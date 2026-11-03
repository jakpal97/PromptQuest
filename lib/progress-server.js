export const LEVEL_SELECT = 'id, module_id, level_number, xp_reward, config, modules(day_number, total_levels, lives_enabled)';

// Ile prób bez zaliczenia trzeba, żeby odblokować „Pokaż wzorzec i przejdź dalej”
export const SKIP_AFTER_ATTEMPTS = 5;

export function passMarkFor(level) {
  return level.config?.zones ? 90 : 40;
}

export function battlePassed(battle, level) {
  return !!battle && (!!battle.completed_via || (battle.score ?? 0) >= passMarkFor(level));
}

// Zaliczenie ćwiczenia: dopisuje XP i przesuwa postęp w module (wspólne dla oceny, wzorca i trenera)
export async function applyPass(supabase, player, level, xpGained) {
  const moduleInfo = level.modules;
  const totalLevels = moduleInfo?.total_levels || 6;
  const newTotalXp = player.total_xp + xpGained;
  const isCurrentModule = moduleInfo?.day_number === player.current_module;

  if (level.level_number >= totalLevels && isCurrentModule) {
    const updates = { total_xp: newTotalXp, current_lives: 3, current_level_in_module: 1 };
    if (player.current_module < 4) updates.current_module = player.current_module + 1;
    await supabase.from('players').update(updates).eq('id', player.id);
    return { moduleComplete: true, newTotalXp, newLives: 3 };
  }

  const updates = { total_xp: newTotalXp };
  if (isCurrentModule) {
    updates.current_level_in_module = Math.max(player.current_level_in_module, level.level_number + 1);
  }
  await supabase.from('players').update(updates).eq('id', player.id);
  return { newTotalXp, newLives: player.current_lives };
}
