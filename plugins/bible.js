'use strict';
const axios = require('axios');

const DAILY_VERSES = [
    'john 3:16', 'psalm 23:1', 'proverbs 3:5-6', 'philippians 4:13',
    'romans 8:28', 'isaiah 40:31', 'jeremiah 29:11', 'psalm 46:1',
    'matthew 6:33', 'john 14:6', 'genesis 1:1', '1 corinthians 13:4-7',
    'psalm 27:1', 'romans 12:2', 'hebrews 11:1', 'matthew 11:28',
];

module.exports = {
    commands:    ['bible', 'verse', 'scripture'],
    description: 'Look up a Bible verse or get a random daily verse',
    usage:       '.bible [reference]  e.g. .bible john 3:16  or just .bible',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        const ref = args.length
            ? args.join(' ')
            : DAILY_VERSES[Math.floor(Math.random() * DAILY_VERSES.length)];

        try {
            const res = await axios.get(`https://bible-api.com/${encodeURIComponent(ref)}`, { timeout: 10000 });
            const { reference, text, translation_name } = res.data;
            if (!text) throw new Error('Not found');
            await sock.sendMessage(jid, {
                text:
                    `✝️ *${reference}*\n\n` +
                    `_${text.trim()}_\n\n` +
                    `📖 Translation: ${translation_name || 'KJV'}\n\n` +
                    `> _Powered by Bible API_`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, {
                text: `❌ Verse not found for *"${ref}"*.\n\nTry: \`.bible john 3:16\` or just \`.bible\` for a random verse.`,
                contextInfo
            }, { quoted: message });
        }
    }
};
