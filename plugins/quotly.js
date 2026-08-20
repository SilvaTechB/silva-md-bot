'use strict';
const axios = require('axios');

module.exports = {
    commands: ['quotly', 'quote2img', 'q2s', 'quotesticker'],
    description: 'Convert a quoted text message into a beautiful styled quote image/sticker',
    usage: '.quotly (reply to a message)',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { reply, safeSend } = ctx;
        const jid = message.key.remoteJid;

        const quoted = message.message?.extendedTextMessage?.contextInfo;
        const quotedText = quoted?.quotedMessage?.conversation
            || quoted?.quotedMessage?.extendedTextMessage?.text
            || args.join(' ').trim();

        if (!quotedText) {
            return reply(
                `📸 *Quotly — Quote to Image*\n\n` +
                `Reply to any text message and use \`.quotly\` to turn it into a beautiful quote image!\n\n` +
                `_Or provide text directly:_ \`.quotly Your quote here\``
            );
        }

        const sender = quoted?.participant || message.key.participant || message.key.remoteJid;
        const senderNum = sender?.split('@')[0] || 'Unknown';

        await safeSend({ text: `🎨 _Creating your quote image..._` }, { quoted: message });

        try {
            // Try quotly API first
            const res = await axios.post(
                'https://quotly.ryzl.xyz/api/generate',
                {
                    type: 'quote',
                    format: 'png',
                    backgroundColor: '#1a1a2e',
                    messages: [{
                        entities: [],
                        media: { type: 'none' },
                        replyMessage: {},
                        avatar: true,
                        from: {
                            id: 0,
                            name: `+${senderNum}`,
                            photo: { url: `https://ui-avatars.com/api/?name=${senderNum}&background=random&color=fff&size=128` },
                        },
                        text: quotedText,
                        type: 'string',
                    }],
                },
                { timeout: 15000, responseType: 'arraybuffer' }
            );

            await sock.sendMessage(jid, {
                sticker: Buffer.from(res.data),
            }, { quoted: message });

        } catch {
            // Fallback: send as a nicely formatted text quote card
            try {
                const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(
                    `beautiful minimalist quote card, dark background, elegant white text: "${quotedText.slice(0, 120)}", professional, clean, modern design`
                )}?width=1024&height=512&nologo=true&model=flux&seed=${Math.floor(Math.random() * 999999)}`;

                const imgRes = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 30000 });
                await sock.sendMessage(jid, {
                    image: Buffer.from(imgRes.data),
                    caption: `💬 _"${quotedText}"\n\n— +${senderNum}_`,
                }, { quoted: message });

            } catch {
                // Plain text fallback
                await safeSend({
                    text:
                        `┌─────────────────────\n` +
                        `│ 💬 *Quote*\n` +
                        `│\n` +
                        `│ _"${quotedText}"_\n` +
                        `│\n` +
                        `│ — *+${senderNum}*\n` +
                        `└─────────────────────`,
                }, { quoted: message });
            }
        }
    },
};
