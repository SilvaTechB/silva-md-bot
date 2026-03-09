'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['imagine', 'generate', 'aiimage', 'img'],
    description: 'Generate an AI image from a text prompt',
    usage:       '.imagine <description>  e.g. .imagine a lion wearing a crown in space',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        if (!args.length) {
            return sock.sendMessage(jid, {
                text:
                    `❌ *Usage:* \`.imagine <description>\`\n\n` +
                    `_Examples:_\n` +
                    `• \`.imagine a lion wearing a gold crown\`\n` +
                    `• \`.imagine futuristic city at night, neon lights\`\n` +
                    `• \`.imagine beautiful sunset over Mount Kenya\``,
                contextInfo
            }, { quoted: message });
        }
        const prompt = args.join(' ');
        await sock.sendMessage(jid, {
            text: `🎨 _Generating image for:_ "*${prompt}*"\n\n⏳ _Please wait a moment..._`,
            contextInfo
        }, { quoted: message });

        try {
            const seed   = Math.floor(Math.random() * 999999);
            const imgUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&seed=${seed}&nologo=true&model=flux`;
            const res    = await axios.get(imgUrl, { responseType: 'arraybuffer', timeout: 60000 });
            const buffer = Buffer.from(res.data);

            await sock.sendMessage(jid, {
                image:   buffer,
                caption:
                    `🎨 *AI Generated Image*\n\n` +
                    `📝 *Prompt:* ${prompt}\n\n` +
                    `> _Powered by Pollinations AI_`,
                contextInfo
            }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ Image generation failed: ${err.message}\n\nTry a simpler or shorter prompt.`,
                contextInfo
            }, { quoted: message });
        }
    }
};
