'use strict';

module.exports = {
    commands:    ['base64', 'b64'],
    description: 'Encode or decode Base64 text',
    usage:       '.base64 encode <text>  •  .base64 decode <base64>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid  = message.key.remoteJid;
        const mode = (args[0] || '').toLowerCase();
        if (!['encode','decode','enc','dec'].includes(mode) || args.length < 2) {
            return sock.sendMessage(jid, {
                text: `❌ *Usage:*\n• \`.base64 encode Hello World\`\n• \`.base64 decode SGVsbG8gV29ybGQ=\``,
                contextInfo
            }, { quoted: message });
        }
        const input = args.slice(1).join(' ');
        const isEnc = mode === 'encode' || mode === 'enc';
        try {
            const result = isEnc
                ? Buffer.from(input, 'utf8').toString('base64')
                : Buffer.from(input, 'base64').toString('utf8');
            await sock.sendMessage(jid, {
                text: isEnc
                    ? `🔐 *Base64 Encoder*\n\n📝 *Input:*\n${input}\n\n📦 *Encoded:*\n\`\`\`${result}\`\`\``
                    : `🔓 *Base64 Decoder*\n\n📦 *Input:*\n\`${input}\`\n\n📝 *Decoded:*\n${result}`,
                contextInfo
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, { text: `❌ Invalid Base64 string.`, contextInfo }, { quoted: message });
        }
    }
};
