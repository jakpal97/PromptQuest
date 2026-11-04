import Anthropic from '@anthropic-ai/sdk';
import { getServiceClient } from '@/lib/supabase';
import { detectRedZone } from '@/lib/redZone';
import { guardLevelAccess, sessionPlayerId } from '@/lib/session';
import {
  AI_TIMEOUT_MS, FOLLOW_UP_MAX_TOKENS, MAX_FOLLOW_UPS,
  aiUnavailable, chatEnabled, chatRequest, completionText, questionCount, wordCount,
} from '@/lib/conversation';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
const MODEL = 'claude-haiku-4-5-20251001';
const MAX_PROMPT_CHARS = 8000;
const MAX_TURN_CHARS = 4000;

// Dalsza rozmowa w podglądzie: odpowiedzi uczestnika nie są oceniane — sprawdzamy tylko czerwoną strefę (w 1.2 także długość)
export async function POST(req) {
  try {
    const { levelId, prompt, history } = await req.json();
    const turns = Array.isArray(history) ? history : [];
    const wellFormed = turns.length >= 2
      && turns.every((m, i) => m && typeof m.content === 'string' && m.content.trim() && m.role === (i % 2 ? 'user' : 'assistant'))
      && turns.at(-1).role === 'user';
    if (!levelId || !prompt || !wellFormed) {
      return Response.json({ error: 'Brak danych rozmowy' }, { status: 400 });
    }
    const replies = turns.filter(m => m.role === 'user');
    if (replies.length > MAX_FOLLOW_UPS) {
      return Response.json({ error: 'To już koniec rozmowy w tym zadaniu.', code: 'chat_limit' }, { status: 422 });
    }

    const playerId = await sessionPlayerId();
    const denied = await guardLevelAccess(playerId, levelId, req);
    if (denied) return denied;

    const { data: level } = await getServiceClient()
      .from('levels')
      .select('config, modules(day_number)')
      .eq('id', levelId)
      .single();
    if (!chatEnabled(level?.config, level?.modules?.day_number)) {
      return Response.json({ error: 'W tym zadaniu nie ma rozmowy z AI' }, { status: 400 });
    }
    const cfg = level.config;

    const reply = replies.at(-1).content;
    const minWords = cfg.conversation?.reply_min_words || 1;
    if (wordCount(reply) < minWords) {
      return Response.json({ error: `Napisz co najmniej ${minWords} słowa.`, code: 'too_short' }, { status: 422 });
    }
    const detected = [...new Set(replies.flatMap(m => detectRedZone(m.content, cfg.red_terms)))];
    if (detected.length) {
      return Response.json({
        error: `Twoja odpowiedź zawiera dane z czerwonej strefy (${detected.join(', ')}). Zamień je na placeholder, np. [TELEFON].`,
        code: 'red_zone',
        redZoneDetected: detected,
      }, { status: 422 });
    }
    if (detectRedZone(prompt, cfg.red_terms).length) {
      return Response.json({ error: 'Prompt zawiera dane z czerwonej strefy.', code: 'red_zone' }, { status: 422 });
    }

    let aiReply;
    try {
      aiReply = await completionText(() => client.messages.create({
        model: MODEL,
        max_tokens: cfg.conversation?.reply_max_tokens || FOLLOW_UP_MAX_TOKENS,
        ...chatRequest(cfg, prompt.slice(0, MAX_PROMPT_CHARS), turns.map(m => ({ ...m, content: m.content.slice(0, MAX_TURN_CHARS) }))),
      }, { timeout: AI_TIMEOUT_MS, maxRetries: 1 }));
    } catch (err) {
      console.error('Converse model error:', err.message);
      return aiUnavailable();
    }
    if (!aiReply) return aiUnavailable();

    return Response.json({ aiReply, asksAgain: questionCount(aiReply) > 0, repliesLeft: MAX_FOLLOW_UPS - replies.length });
  } catch (err) {
    console.error('Converse error:', err);
    return aiUnavailable();
  }
}
