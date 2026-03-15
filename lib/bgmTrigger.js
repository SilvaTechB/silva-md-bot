'use strict';

/**
 * BGM Trigger store — maps trigger words → audio file paths.
 * Data lives in lib/bgm_data/index.json
 * Audio files live in lib/bgm_data/audio/<word>.ogg
 */

const fs   = require('fs');
const path = require('path');

const DATA_DIR   = path.join(__dirname, 'bgm_data');
const AUDIO_DIR  = path.join(DATA_DIR, 'audio');
const INDEX_FILE = path.join(DATA_DIR, 'index.json');

// Ensure directories exist
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

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

/** Save an audio buffer for a trigger word. Returns the file path. */
function setTrigger(word, audioBuffer) {
    const key      = word.trim().toLowerCase();
    const filename = `${key.replace(/[^a-z0-9_\-]/g, '_')}.ogg`;
    const filepath = path.join(AUDIO_DIR, filename);

    fs.writeFileSync(filepath, audioBuffer);

    const index = loadIndex();
    index[key]  = filename;
    saveIndex(index);
    return key;
}

/** Remove a trigger word. Returns true if it existed. */
function delTrigger(word) {
    const key   = word.trim().toLowerCase();
    const index = loadIndex();
    if (!index[key]) return false;

    const filepath = path.join(AUDIO_DIR, index[key]);
    if (fs.existsSync(filepath)) {
        try { fs.unlinkSync(filepath); } catch { /* ignore */ }
    }
    delete index[key];
    saveIndex(index);
    return true;
}

/** Return a list of all trigger words. */
function listTriggers() {
    return Object.keys(loadIndex());
}

/**
 * Given a message text, return { word, audioBuffer } for the FIRST trigger
 * word found (whole-word match, case-insensitive).  Returns null if no match.
 */
function matchTrigger(text) {
    if (!text) return null;
    const lower = text.toLowerCase();
    const index = loadIndex();

    for (const word of Object.keys(index)) {
        // Whole-word boundary: word surrounded by non-alphanumeric or start/end
        const re = new RegExp(`(?<![a-z0-9])${escapeRegex(word)}(?![a-z0-9])`, 'i');
        if (re.test(lower)) {
            const filepath = path.join(AUDIO_DIR, index[word]);
            if (fs.existsSync(filepath)) {
                return { word, audioBuffer: fs.readFileSync(filepath) };
            }
        }
    }
    return null;
}

function escapeRegex(s) {
    return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

module.exports = { setTrigger, delTrigger, listTriggers, matchTrigger };
