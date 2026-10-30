'use strict';

const crypto = require('crypto');
const config = require('../config');

let Pool;
try { ({ Pool } = require('pg')); } catch { Pool = null; }

const DEFAULT_DEVELOPERS = [
    { phone: '254700143167', name: 'Silva', role: 'lead developer' },
    { phone: '254755257907', name: 'Silva', role: 'developer' },
    { phone: '254743706010', name: 'Silva', role: 'developer' },
];

let pool;
let initialized = false;
let initPromise;

function databaseUrl() {
    const decode = value => {
        if (!value) return '';
        try {
            const decoded = Buffer.from(String(value), 'base64').toString('utf8').trim();
            return /^postgres(?:ql)?:\/\//i.test(decoded) ? decoded : '';
        } catch { return ''; }
    };
    return decode(process.env.DATABASE_URL_POOLED_B64 || config.DATABASE_URL_POOLED_B64)
        || decode(process.env.DATABASE_URL_B64 || config.DATABASE_URL_B64)
        || process.env.DATABASE_URL_POOLED || process.env.DATABASE_URL
        || config.DATABASE_URL_POOLED || config.DATABASE_URL || '';
}

function getPool() {
    if (pool || !Pool || !databaseUrl()) return pool;
    pool = new Pool({ connectionString: databaseUrl(), max: 5, idleTimeoutMillis: 30000, connectionTimeoutMillis: 8000, ssl: { rejectUnauthorized: false } });
    pool.on('error', error => console.warn(`[Database] pool error: ${error.message}`));
    return pool;
}

function encryptionKey() {
    const source = process.env.DB_ENCRYPTION_KEY || config.DB_ENCRYPTION_KEY || process.env.SESSION_ID || config.SESSION_ID || process.env.OWNER_NUMBER || config.OWNER_NUMBER || 'silva-local-key';
    return crypto.createHash('sha256').update(String(source)).digest();
}

function encrypt(value) {
    const iv = crypto.randomBytes(12);
    const cipher = crypto.createCipheriv('aes-256-gcm', encryptionKey(), iv);
    const ciphertext = Buffer.concat([cipher.update(String(value), 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${iv.toString('base64url')}.${tag.toString('base64url')}.${ciphertext.toString('base64url')}`;
}

function decrypt(value) {
    try {
        const [ivRaw, tagRaw, dataRaw] = String(value).split('.');
        const decipher = crypto.createDecipheriv('aes-256-gcm', encryptionKey(), Buffer.from(ivRaw, 'base64url'));
        decipher.setAuthTag(Buffer.from(tagRaw, 'base64url'));
        return Buffer.concat([decipher.update(Buffer.from(dataRaw, 'base64url')), decipher.final()]).toString('utf8');
    } catch { return null; }
}

function developerList() {
    const raw = process.env.DEVELOPER_NUMBERS || config.DEVELOPER_NUMBERS || '';
    const numbers = raw.split(',').map(phone => phone.replace(/\D/g, '')).filter(Boolean);
    if (!numbers.length) return DEFAULT_DEVELOPERS;
    return numbers.map((phone, index) => ({ phone, name: 'Silva', role: index === 0 ? 'lead developer' : 'developer' }));
}

async function query(text, values = []) {
    const db = getPool();
    if (!db) return null;
    try { return await db.query(text, values); } catch (error) {
        console.warn(`[Database] query failed: ${error.message}`);
        return null;
    }
}

async function initDatabase() {
    if (initialized) return true;
    if (initPromise) return initPromise;
    if (!getPool()) return false;
    initPromise = (async () => {
        const db = getPool();
        await db.query(`
            CREATE TABLE IF NOT EXISTS silva_users (
                jid TEXT PRIMARY KEY,
                phone TEXT,
                display_name TEXT,
                is_group BOOLEAN NOT NULL DEFAULT FALSE,
                first_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                last_seen TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                message_count BIGINT NOT NULL DEFAULT 0,
                metadata JSONB NOT NULL DEFAULT '{}'::jsonb
            );
            CREATE TABLE IF NOT EXISTS silva_agent_chats (
                id BIGSERIAL PRIMARY KEY,
                jid TEXT NOT NULL,
                role TEXT NOT NULL CHECK (role IN ('user', 'assistant', 'memory')),
                content_encrypted TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS silva_agent_chats_jid_created_idx ON silva_agent_chats (jid, created_at DESC);
            CREATE TABLE IF NOT EXISTS silva_developers (
                phone TEXT PRIMARY KEY,
                profile_encrypted TEXT NOT NULL,
                created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
                updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
            );
        `);
        for (const developer of developerList()) {
            await db.query(`
                INSERT INTO silva_developers (phone, profile_encrypted)
                VALUES ($1, $2)
                ON CONFLICT (phone) DO UPDATE SET profile_encrypted = EXCLUDED.profile_encrypted, updated_at = NOW()
            `, [developer.phone, encrypt(JSON.stringify(developer))]);
        }
        initialized = true;
        console.log(`[Database] encrypted Postgres storage ready (${developerList().length} developer contacts)`);
        return true;
    })().catch(error => {
        console.warn(`[Database] initialization skipped: ${error.message}`);
        return false;
    });
    return initPromise;
}

function phoneFromJid(jid) {
    return String(jid || '').split('@')[0].replace(/\D/g, '') || null;
}

function recordUser({ jid, displayName = '', isGroup = false, metadata = {} }) {
    if (!jid) return Promise.resolve(false);
    return initDatabase().then(ready => ready ? query(`
        INSERT INTO silva_users (jid, phone, display_name, is_group, metadata)
        VALUES ($1, $2, $3, $4, $5::jsonb)
        ON CONFLICT (jid) DO UPDATE SET
            display_name = COALESCE(NULLIF(EXCLUDED.display_name, ''), silva_users.display_name),
            last_seen = NOW(), message_count = silva_users.message_count + 1,
            metadata = silva_users.metadata || EXCLUDED.metadata
    `, [jid, phoneFromJid(jid), String(displayName).slice(0, 120), Boolean(isGroup), JSON.stringify(metadata)]) : null).then(() => true).catch(() => false);
}

function recordAgentMessage({ jid, role, content }) {
    if (!jid || !['user', 'assistant', 'memory'].includes(role) || !content) return Promise.resolve(false);
    return initDatabase().then(ready => ready ? query('INSERT INTO silva_agent_chats (jid, role, content_encrypted) VALUES ($1, $2, $3)', [jid, role, encrypt(String(content).slice(0, 4000))]) : null).then(() => true).catch(() => false);
}

async function getDevelopers() {
    if (!await initDatabase()) return developerList();
    const result = await query('SELECT phone, profile_encrypted FROM silva_developers ORDER BY phone');
    const decrypted = (result?.rows || []).map(row => { try { return JSON.parse(decrypt(row.profile_encrypted)); } catch { return null; } }).filter(Boolean);
    return decrypted.length ? decrypted : developerList();
}

module.exports = { initDatabase, recordUser, recordAgentMessage, getDevelopers, encrypt, decrypt, developerList };
