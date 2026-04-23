import { createClient } from '@supabase/supabase-js';
const sb = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const { data, error } = await sb.from('users').select('email, role, password_hash').order('role');
if (error) { console.error(error.message); process.exit(1); }
let allGood = true;
for (const u of data) {
    const ok = u.password_hash?.startsWith('$2b$');
    if (!ok) allGood = false;
    console.log(`  ${ok ? '✅' : '❌'} [${u.role.padEnd(8)}] ${u.email}`);
}
console.log(allGood ? '\n✅ All users have valid bcrypt password_hash.\n' : '\n❌ Some users still need migration.\n');
