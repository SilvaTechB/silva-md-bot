'use strict';

/**
 * BGM Trigger store — maps trigger words → audio file paths + mimetype.
 * Data lives in lib/bgm_data/index.json
 * Audio files live in lib/bgm_data/audio/<word>.<ext>
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, 'bgm_data');
const AUDIO_DIR  = path.join(DATA_DIR, 'audio');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

// ─── Mimetype → file extension map ───────────────────────────────────────────
function mimeToExt(mime) {
    if (!mime) return 'mp4';
    if (mime.includes('ogg'))  return 'ogg';
    if (mime.includes('opus')) return 'ogg';
    if (mime.includes('mp3') || mime.includes('mpeg')) return 'mp3';
    if (mime.includes('mp4') || mime.includes('m4a')) return 'mp4';
    if (mime.includes('wav')) return 'wav';
    if (mime.includes('aac')) return 'aac';
    return 'mp4';
}

// ─── Load / save index ────────────────────────────────────────────────────────
function loadIndex() {
    try {
        if (fs.existsSync(INDEX_FILE))
            return JSON.parse(fs.readFileSync(INDEX_FILE, 'utf8'));
    } catch { /* corrupt — start fresh */ }
    return {};
}

function saveIndex(index) {
    fs.writeFileSync(INDEX_FILE, JSON.stringify(index, null, 2));
}

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Save an audio buffer for a trigger word.
 * @param {string} word
 * @param {Buffer} audioBuffer
 * @param {string} mimetype   — original mimetype from WhatsApp (e.g. 'audio/mp4')
 * @returns {string}          — normalised trigger word
 */
function setTrigger(word, audioBuffer, mimetype) {
    const key  = word.trim().toLowerCase();
    const ext  = mimeToExt(mimetype);
    const safe = key.replace(/[^a-z0-9_\-]/g, '_');

    // Remove old file if extension changed
    const index = loadIndex();
    if (index[key]) {
        const old = path.join(AUDIO_DIR, index[key].filename || index[key]);
        if (fs.existsSync(old)) try { fs.unlinkSync(old); } catch { /* ok */ }
    }

    const filename = `${safe}.${ext}`;
    fs.writeFileSync(path.join(AUDIO_DIR, filename), audioBuffer);

    index[key] = { filename, mimetype: mimetype || 'audio/mp4' };
    saveIndex(index);
    return key;
}

/** Remove a trigger word. Returns true if it existed. */
function delTrigger(word) {
    const key   = word.trim().toLowerCase();
    const index = loadIndex();
    if (!index[key]) return false;

    const entry    = index[key];
    const filename = typeof entry === 'string' ? entry : entry.filename;
    const filepath = path.join(AUDIO_DIR, filename);
    if (fs.existsSync(filepath)) try { fs.unlinkSync(filepath); } catch { /* ok */ }

    delete index[key];
    saveIndex(index);
    return true;
}

/** Return a list of all trigger words. */
function listTriggers() {
    return Object.keys(loadIndex());
}

/**
 * Given message text, return { word, audioBuffer, mimetype } for the first
 * trigger word found (whole-word match, case-insensitive).  Returns null if none.
 */
function matchTrigger(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    const index = loadIndex();

    for (const word of Object.keys(index)) {
        const re = new RegExp(`(?<![a-z0-9])${escapeRegex(word)}(?![a-z0-9])`, 'i');
        if (!re.test(lower)) continue;

        const entry    = index[word];
        const filename = typeof entry === 'string' ? entry : entry.filename;
        const mimetype = typeof entry === 'string' ? 'audio/mp4' : (entry.mimetype || 'audio/mp4');
        const filepath = path.join(AUDIO_DIR, filename);

        if (fs.existsSync(filepath)) {
            return { word, audioBuffer: fs.readFileSync(filepath), mimetype };
        }
    }
    return null;
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { setTrigger, delTrigger, listTriggers, matchTrigger };
