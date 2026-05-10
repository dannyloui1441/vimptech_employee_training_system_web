/**
 * migrate-password-hash.mjs
 *
 * One-time migration script: hashes each user's plain-text password
 * and writes it to the password_hash column in Supabase.
 *
 * Only processes users where password_hash IS NULL and password IS NOT NULL.
 * Safe to run multiple times (idempotent).
 *
 * Usage:
 *   SUPABASE_URL=<url> SUPABASE_SERVICE_ROLE_KEY=<key> node scripts/migrate-password-hash.mjs
 *
 * Or add SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY to .env.local and run:
 *   node --env-file=.env.local scripts/migrate-password-hash.mjs
 */

import { createClient } from '@supabase/supabase-js';
import bcrypt from 'bcrypt';

const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const BCRYPT_ROUNDS = 10;

// ── Validate env vars ──────────────────────────────────────────────────────
if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
    console.error('❌  Missing environment variables.');
    console.error('    Set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY before running.');
    console.error('    Example:');
    console.error('    node --env-file=.env.local scripts/migrate-password-hash.mjs');
    process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

// ── Fetch users with no password_hash ─────────────────────────────────────
console.log('🔍  Fetching users with NULL password_hash…\n');

const { data: users, error: fetchError } = await supabase
    .from('users')
    .select('id, name, email, role, password')
    .is('password_hash', null);

if (fetchError) {
    console.error('❌  Failed to fetch users:', fetchError.message);
    process.exit(1);
}

if (!users || users.length === 0) {
    console.log('✅  No users need migrating. All password_hash values are set.');
    process.exit(0);
}

console.log(`📋  Found ${users.length} user(s) to migrate:\n`);
for (const u of users) {
    console.log(`    [${u.role.padEnd(8)}]  ${u.email}`);
}
console.log();

// ── Hash and update each user ──────────────────────────────────────────────
let successCount = 0;
let skipCount = 0;
let errorCount = 0;

for (const user of users) {
    if (!user.password) {
        console.warn(`⚠️   Skipping ${user.email} — no plain-text password to hash.`);
        skipCount++;
        continue;
    }

    try {
        const hash = await bcrypt.hash(user.password, BCRYPT_ROUNDS);

        const { error: updateError } = await supabase
            .from('users')
            .update({ password_hash: hash })
            .eq('id', user.id);

        if (updateError) {
            console.error(`❌  Failed to update ${user.email}: ${updateError.message}`);
            errorCount++;
        } else {
            console.log(`✅  Migrated: ${user.email} (${user.role})`);
            successCount++;
        }
    } catch (err) {
        console.error(`❌  Error hashing ${user.email}: ${err.message}`);
        errorCount++;
    }
}

// ── Summary ────────────────────────────────────────────────────────────────
console.log('\n─────────────────────────────────');
console.log(`✅  Migrated:  ${successCount}`);
if (skipCount > 0) console.log(`⚠️   Skipped:   ${skipCount} (no plain-text password)`);
if (errorCount > 0) console.log(`❌  Errors:    ${errorCount}`);
console.log('─────────────────────────────────');

if (errorCount > 0) process.exit(1);
