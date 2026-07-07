'use strict';

const fs   = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');

const DATA_DIR  = path.join(__dirname, '../data/notes');
const ADMIN_DIR = path.join(__dirname, '../data/notes_admin');

function ensureDir(d) { if (!fs.existsSync(d)) fs.mkdirSync(d, { recursive: true }); }
function userFile(jid)  { return path.join(DATA_DIR, jid.replace(/[^a-z0-9]/gi, '_') + '.json'); }
function adminFile(jid) { return path.join(ADMIN_DIR, jid.replace(/[^a-z0-9]/gi, '_') + '.json'); }

function loadNotes(file)  {
    try { return JSON.parse(fs.readFileSync(file, 'utf8')); } catch { return {}; }
}
function saveNotes(file, notes) {
    ensureDir(path.dirname(file));
    fs.writeFileSync(file, JSON.stringify(notes, null, 2), 'utf8');
}

function slugify(s) { return s.toLowerCase().trim().replace(/\s+/g, '_').slice(0, 40); }

module.exports = {
    commands:    ['addnote', 'delnote', 'delallnotes', 'getnote', 'getnotes', 'notes', 'updatenote',
                  'adminnotes', 'admindelnote', 'adminclearnotes', 'adminupdatenote', 'allnotes'],
    description: 'Personal notes — save, view, update and delete your notes',
    usage:       '.addnote <title> | <content>\n.getnote <title>\n.notes (list all)',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo, isOwner } = ctx;
        const from   = message.key.participant || message.key.remoteJid;
        const cmd    = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const uFile = userFile(from);
        const aFile = adminFile(jid);

        const send = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        if (cmd === 'notes' || cmd === 'getnotes') {
            const notes = loadNotes(uFile);
            const keys  = Object.keys(notes);
            if (!keys.length) return send('📒 *Your Notes*\n\nYou have no saved notes.\n\nCreate one with `.addnote <title> | <content>`');
            const list = keys.map((k, i) => `*${i + 1}.* ${k}`).join('\n');
            return send(`📒 *Your Notes (${keys.length})*\n\n${list}\n\n_Use \`.getnote <title>\` to read a note_`);
        }

        if (cmd === 'addnote') {
            const raw  = args.join(' ');
            const sep  = raw.indexOf('|');
            if (sep < 0) return send('❌ *Usage:* `.addnote <title> | <content>`\n\nExample: `.addnote shopping | milk, bread, eggs`');
            const title   = slugify(raw.slice(0, sep).trim());
            const content = raw.slice(sep + 1).trim();
            if (!title || !content) return send('❌ Both title and content are required.');
            const notes = loadNotes(uFile);
            notes[title] = { content, created: new Date().toISOString(), updated: new Date().toISOString() };
            saveNotes(uFile, notes);
            return send(`✅ *Note saved!*\n\n📌 *Title:* ${title}\n📝 *Content:* ${content}`);
        }

        if (cmd === 'getnote') {
            const title = slugify(args.join(' '));
            if (!title) return send('❌ *Usage:* `.getnote <title>`');
            const notes = loadNotes(uFile);
            const note  = notes[title];
            if (!note) return send(`❌ Note \`${title}\` not found.\n\nUse \`.notes\` to see your list.`);
            const d = new Date(note.updated || note.created).toLocaleDateString();
            return send(`📌 *${title}*\n\n${note.content}\n\n_Last updated: ${d}_`);
        }

        if (cmd === 'updatenote') {
            const raw  = args.join(' ');
            const sep  = raw.indexOf('|');
            if (sep < 0) return send('❌ *Usage:* `.updatenote <title> | <new content>`');
            const title   = slugify(raw.slice(0, sep).trim());
            const content = raw.slice(sep + 1).trim();
            const notes   = loadNotes(uFile);
            if (!notes[title]) return send(`❌ Note \`${title}\` not found.`);
            notes[title] = { ...notes[title], content, updated: new Date().toISOString() };
            saveNotes(uFile, notes);
            return send(`✅ Note \`${title}\` updated!`);
        }

        if (cmd === 'delnote') {
            const title = slugify(args.join(' '));
            if (!title) return send('❌ *Usage:* `.delnote <title>`');
            const notes = loadNotes(uFile);
            if (!notes[title]) return send(`❌ Note \`${title}\` not found.`);
            delete notes[title];
            saveNotes(uFile, notes);
            return send(`🗑️ Note \`${title}\` deleted.`);
        }

        if (cmd === 'delallnotes') {
            saveNotes(uFile, {});
            return send('🗑️ All your notes have been deleted.');
        }

        if (cmd === 'allnotes') {
            if (!isOwner) return send('⛔ Owner only.');
            const files = fs.existsSync(DATA_DIR) ? fs.readdirSync(DATA_DIR) : [];
            if (!files.length) return send('📒 No notes stored across any users.');
            let total = 0;
            files.forEach(f => { try { total += Object.keys(JSON.parse(fs.readFileSync(path.join(DATA_DIR, f), 'utf8'))).length; } catch {} });
            return send(`📒 *All Notes Overview*\n\n👥 Users with notes: *${files.length}*\n📝 Total notes: *${total}*`);
        }

        if (cmd === 'adminnotes') {
            const notes = loadNotes(aFile);
            const keys  = Object.keys(notes);
            if (!keys.length) return send('📒 *Group Notes*\n\nNo notes set for this group.');
            const list  = keys.map((k, i) => `*${i + 1}.* ${k}`).join('\n');
            return send(`📒 *Group Notes (${keys.length})*\n\n${list}\n\n_Use \`.getnote <title>\` to read_`);
        }

        if (cmd === 'admindelnote') {
            if (!isOwner && !ctx.isAdmin) return send('⛔ Admins only.');
            const title = slugify(args.join(' '));
            const notes = loadNotes(aFile);
            if (!notes[title]) return send(`❌ Group note \`${title}\` not found.`);
            delete notes[title];
            saveNotes(aFile, notes);
            return send(`🗑️ Group note \`${title}\` deleted.`);
        }

        if (cmd === 'adminclearnotes') {
            if (!isOwner) return send('⛔ Owner only.');
            saveNotes(aFile, {});
            return send('🗑️ All group notes cleared.');
        }

        if (cmd === 'adminupdatenote') {
            if (!isOwner && !ctx.isAdmin) return send('⛔ Admins only.');
            const raw  = args.join(' ');
            const sep  = raw.indexOf('|');
            if (sep < 0) return send('❌ *Usage:* `.adminupdatenote <title> | <content>`');
            const title   = slugify(raw.slice(0, sep).trim());
            const content = raw.slice(sep + 1).trim();
            const notes   = loadNotes(aFile);
            if (!notes[title]) return send(`❌ Group note \`${title}\` not found.`);
            notes[title] = { ...notes[title], content, updated: new Date().toISOString() };
            saveNotes(aFile, notes);
            return send(`✅ Group note \`${title}\` updated.`);
        }
    }
};
