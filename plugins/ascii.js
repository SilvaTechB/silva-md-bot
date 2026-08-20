'use strict';

const figlet = require('figlet');

const FONTS = ['Standard', 'Big', 'Slant', 'Banner', 'Block', 'Doom', 'Ghost', 'Poison', 'Thick'];

module.exports = {
    commands:    ['ascii', 'figlet', 'art', 'textart'],
    description: 'Convert text to ASCII art',
    usage:       '.ascii <text> | .ascii <text> --font Slant',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        if (!args.length) {
            return sock.sendMessage(jid, {
                text: `❌ Provide text.\n\nUsage: \`.ascii Hello\`\n\nAvailable fonts:\n${FONTS.map(f => `• ${f}`).join('\n')}\n\nWith font: \`.ascii Hello --font Slant\``,
                contextInfo
            }, { quoted: message });
        }

        let font = 'Standard';
        let text = args.join(' ');

        const fontIdx = text.indexOf('--font');
        if (fontIdx !== -1) {
            const parts = text.slice(fontIdx + 6).trim().split(/\s+/);
            const requestedFont = parts[0];
            if (FONTS.map(f => f.toLowerCase()).includes(requestedFont.toLowerCase())) {
                font = FONTS.find(f => f.toLowerCase() === requestedFont.toLowerCase());
            }
            text = text.slice(0, fontIdx).trim();
        }

        if (!text) {
            return sock.sendMessage(jid, { text: '❌ Provide text before the --font option.', contextInfo }, { quoted: message });
        }

        if (text.length > 30) {
            return sock.sendMessage(jid, { text: '❌ Text too long — max 30 characters for ASCII art.', contextInfo }, { quoted: message });
        }

        figlet.text(text, { font }, async (err, result) => {
            if (err || !result) {
                return sock.sendMessage(jid, { text: '❌ Failed to generate ASCII art.', contextInfo }, { quoted: message });
            }
            await sock.sendMessage(jid, {
                text: `\`\`\`\n${result}\n\`\`\``,
                contextInfo
            }, { quoted: message });
        });
    }
};
