import Anthropic from '@anthropic-ai/sdk';

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

export async function POST(req) {
  try {
    const { userPrompt, taskDescription, goalDescription, brokenPrompt } = await req.json();

    if (!userPrompt || !taskDescription) {
      return Response.json({ error: 'Brak prompta lub opisu zadania' }, { status: 400 });
    }

    // KROK 1: Wykonaj prompt uczestnika
    let aiResponse = '';
    try {
      const execution = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 400,
        messages: [{ role: 'user', content: userPrompt }],
      });
      aiResponse = execution.content[0].text;
    } catch (err) {
      aiResponse = '[Błąd wykonania prompta]';
    }

    // KROK 2: Oceń efekt
    const systemPrompt = brokenPrompt
      ? `Jesteś ekspertem od prompt engineeringu oceniającym uczestników szkolenia AI w Polsce. Zadanie: ${taskDescription}. Cel: ${goalDescription}. Uczestnik miał poprawić zły prompt: "${brokenPrompt}". Oceniaj po polsku, bądź konstruktywny i pomocny.`
      : `Jesteś ekspertem od prompt engineeringu oceniającym uczestników szkolenia AI w Polsce. Zadanie: ${taskDescription}. Cel: ${goalDescription}. Oceniaj po polsku, bądź konstruktywny i pomocny.`;

    const evaluation = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 400,
      system: systemPrompt,
      messages: [{
        role: 'user',
        content: `Prompt uczestnika: "${userPrompt}"\n\nAI odpowiedziała: "${aiResponse}"\n\nOceń na ile odpowiedź AI realizuje cel zadania.\n\nOdpowiedz TYLKO w JSON bez markdown:\n{"score": <0-100>, "co_poszlo_dobrze": "<max 20 słów>", "co_poprawic": "<max 20 słów>", "wskazowka": "<max 20 słów>"}`
      }],
    });

    let result;
    try {
      const rawText = evaluation.content[0].text.trim();
      const jsonMatch = rawText.match(/\{[\s\S]*\}/);
      result = JSON.parse(jsonMatch ? jsonMatch[0] : rawText);
    } catch {
      result = {
        score: 50,
        co_poszlo_dobrze: 'Prompt wysłany pomyślnie',
        co_poprawic: 'Błąd parsowania odpowiedzi — spróbuj ponownie',
        wskazowka: 'Sprawdź format odpowiedzi AI',
      };
    }

    return Response.json({ ...result, aiResponse });
  } catch (err) {
    console.error('Evaluate error:', err);
    return Response.json({ error: 'Błąd serwera oceny: ' + err.message }, { status: 500 });
  }
}
