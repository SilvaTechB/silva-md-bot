'use strict';

const fs   = require('fs');
const path = require('path');

const THEMES_DIR = path.join(__dirname, '..', 'themes');

function listThemes() {
    return fs.readdirSync(THEMES_DIR)
        .filter(f => f.endsWith('.json'))
        .map(f => f.replace('.json', '').toLowerCase())
        .sort();
}

function loadTheme(name) {
    const key  = (name || 'silva').toLowerCase().trim();
    const file = path.join(THEMES_DIR, `${key}.json`);
    if (!fs.existsSync(file)) return null;
    try {
        const raw = JSON.parse(fs.readFileSync(file, 'utf8'));
        return raw.STRINGS || null;
    } catch {
        return null;
    }
}

function getActiveTheme() {
    if (global._activeThemeStrings) return global._activeThemeStrings;
    const config = require('../config');
    const strings = loadTheme(config.THEME) || loadTheme('silva');
    global._activeThemeStrings = strings;
    return strings;
}

function setActiveTheme(name) {
    const strings = loadTheme(name);
    if (!strings) return false;
    global._activeThemeStrings = strings;
    return true;
}

function getStr(key) {
    const t = getActiveTheme();
    return (t && t.global && t.global[key]) || null;
}

module.exports = { listThemes, loadTheme, getActiveTheme, setActiveTheme, getStr };
