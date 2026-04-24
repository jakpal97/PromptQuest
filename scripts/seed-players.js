const bcrypt = require('bcryptjs');
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function seed() {
  console.log('🌱 Dodawanie graczy...');

  const players = [];
  for (let i = 1; i <= 10; i++) {
    players.push({
      username: `uczestnik${i}`,
      password_hash: bcrypt.hashSync(`uczestnik${i}`, 10),
      display_name: null,
      character_id: null,
      role: 'player',
      total_xp: 0,
      current_module: 1,
      current_lives: 3,
      current_level_in_module: 1,
    });
  }

  players.push({
    username: 'admin',
    password_hash: bcrypt.hashSync('admin123', 10),
    display_name: 'Admin',
    character_id: 1,
    role: 'admin',
    total_xp: 0,
    current_module: 1,
    current_lives: 3,
    current_level_in_module: 1,
  });

  const { error } = await supabase.from('players').upsert(players, { onConflict: 'username' });

  if (error) {
    console.error('❌ Błąd:', error.message);
    process.exit(1);
  }

  console.log('✅ Dodano/zaktualizowano graczy:');
  for (let i = 1; i <= 10; i++) {
    console.log(`  uczestnik${i} / uczestnik${i}`);
  }
  console.log('  admin / admin123');
  console.log('\n🎮 Gotowe! Uruchom: npm run dev');
}

seed();
