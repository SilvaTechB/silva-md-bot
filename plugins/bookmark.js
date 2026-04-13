'use strict';

const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'bookmarks.json');

function loadBookmarks() {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return {}; }
}
function saveBookmarks(data) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

module.exports = {
    commands: ['bookmark', 'save', 'saved', 'bookmarks', 'delbookmark', 'clearbookmarks'],
    description: 'Save/bookmark messages to retrieve later via DM',
    usage: '.save <label> (reply to a message) | .saved | .delbookmark <number>',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { jid, sender, contextInfo } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const bookmarks = loadBookmarks();
        if (!bookmarks[sender]) bookmarks[sender] = [];

        if (rawCmd === 'clearbookmarks') {
            bookmarks[sender] = [];
            saveBookmarks(bookmarks);
            return sock.sendMessage(jid, { text: '🗑️ *All bookmarks cleared.*', contextInfo }, { quoted: message });
        }

        if (rawCmd === 'delbookmark') {
            const idx = parseInt(args[0]) - 1;
            if (isNaN(idx) || idx < 0 || idx >= bookmarks[sender].length) {
                return sock.sendMessage(jid, {
                    text: `❌ Invalid bookmark number. You have ${bookmarks[sender].length} bookmarks.\n\nUse \`.saved\` to see them.`,
                    contextInfo
                }, { quoted: message });
            }
            const removed = bookmarks[sender].splice(idx, 1)[0];
            saveBookmarks(bookmarks);
            return sock.sendMessage(jid, {
                text: `🗑️ *Bookmark deleted:* "${removed.label || 'Untitled'}"`,
                contextInfo
            }, { quoted: message });
        }

        if (['saved', 'bookmarks'].includes(rawCmd)) {
            if (!bookmarks[sender].length) {
                return sock.sendMessage(jid, {
                    text: '📌 *No bookmarks yet.*\n\nReply to any message with `.save <label>` to bookmark it!',
                    contextInfo
                }, { quoted: message });
            }

            const list = bookmarks[sender].map((bm, i) => {
                const date = new Date(bm.timestamp).toLocaleDateString();
                const preview = bm.text ? bm.text.substring(0, 60) + (bm.text.length > 60 ? '...' : '') : '[media]';
                return `${i + 1}. 📌 *${bm.label || 'Untitled'}*\n   ${preview}\n   _${date} • ${bm.from || 'unknown'}_`;
            }).join('\n\n');

            const target = ctx.isGroup ? sender : jid;
            return sock.sendMessage(target, {
                text: `📚 *Your Bookmarks (${bookmarks[sender].length})*\n\n${list}\n\n_Delete: \`.delbookmark <number>\`_\n_Clear all: \`.clearbookmarks\`_`,
                contextInfo
            }, { quoted: message });
        }

        if (['bookmark', 'save'].includes(rawCmd)) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return sock.sendMessage(jid, {
                    text: '📌 *Bookmark Messages*\n\nReply to any message with:\n`.save <label>`\n\n*Example:* Reply to a message and type:\n`.save important link`\n\n*Other commands:*\n• `.saved` — view all bookmarks\n• `.delbookmark 2` — delete bookmark #2\n• `.clearbookmarks` — clear all',
                    contextInfo
                }, { quoted: message });
            }

            const label = args.join(' ').trim() || '';
            const quotedText = quoted.conversation
                || quoted.extendedTextMessage?.text
                || quoted.imageMessage?.caption
                || quoted.videoMessage?.caption
                || '';

            const fromParticipant = message.message?.extendedTextMessage?.contextInfo?.participant || '';
            const fromNum = fromParticipant ? fromParticipant.split('@')[0] : 'unknown';

            if (bookmarks[sender].length >= 50) {
                return sock.sendMessage(jid, {
                    text: '❌ Bookmark limit reached (50). Delete some with `.delbookmark <number>`.',
                    contextInfo
                }, { quoted: message });
            }

            bookmarks[sender].push({
                label: label || `Bookmark ${bookmarks[sender].length + 1}`,
                text: quotedText,
                from: fromNum,
                group: ctx.isGroup ? jid : null,
                timestamp: Date.now(),
                hasMedia: !!(quoted.imageMessage || quoted.videoMessage || quoted.audioMessage || quoted.documentMessage)
            });
            saveBookmarks(bookmarks);

            return sock.sendMessage(jid, {
                text: `📌 *Message bookmarked!*\n\n📝 *Label:* ${label || 'Bookmark ' + bookmarks[sender].length}\n\nView your bookmarks with \`.saved\``,
                contextInfo
            }, { quoted: message });
        }
    }
};
