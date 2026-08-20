'use strict';
const axios = require('axios');

module.exports = {
    commands: ['describe', 'caption', 'what', 'imgcaption', 'seethis', 'analyze'],
    description: 'AI describes/analyzes an image — reply to any photo and ask what it is',
    usage: '.describe (reply to an image)',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { reply, safeSend, download } = ctx;
        const jid = message.key.remoteJid;

        // Find image — either direct or quoted
        const msg = message.message;
        const imgMsg = msg?.imageMessage
            || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage
            || null;

        if (!imgMsg) {
            return reply(
                `👁️ *Image Describer*\n\n` +
                `Reply to any image and use \`.describe\` and I'll tell you what's in it!\n\n` +
                `_Examples:_\n` +
                `• Reply to a photo → \`.describe\`\n` +
                `• Reply to a photo → \`.what is in this image\`\n` +
                `• Reply to a photo → \`.analyze\``
            );
        }

        const question = args.join(' ').trim() || 'Describe this image in detail. What do you see?';

        await safeSend({ text: `👁️ _Analyzing the image..._` }, { quoted: message });

        try {
            // Download the image
            const imgBuffer = await download(imgMsg, 'image');
            if (!imgBuffer) throw new Error('Could not download image');

            const base64 = imgBuffer.toString('base64');
            const mimeType = imgMsg.mimetype || 'image/jpeg';

            // Try Gemini vision if key is available
            const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
            if (apiKey) {
                try {
                    const { GoogleGenerativeAI } = require('@google/generative-ai');
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-flash' });
                    const result = await model.generateContent([
                        question,
                        { inlineData: { data: base64, mimeType } },
                    ]);
                    const text = result.response.text().trim();
                    return await safeSend({
                        text: `👁️ *Image Analysis*\n\n${text}`,
                    }, { quoted: message });
                } catch { /* fall through */ }
            }

            // Try paxsenix vision API (free)
            try {
                const formData = new FormData();
                formData.append('image', new Blob([imgBuffer], { type: mimeType }), 'image.jpg');
                formData.append('text', question);
                const res = await axios.post('https://api.paxsenix.biz.id/ai/gpt4oVision', formData, {
                    timeout: 20000,
                    headers: { 'Content-Type': 'multipart/form-data' },
                });
                const answer = res.data?.message || res.data?.result;
                if (answer) {
                    return await safeSend({
                        text: `👁️ *Image Analysis*\n\n${answer.trim()}`,
                    }, { quoted: message });
                }
            } catch { /* fall through */ }

            // Last resort: describe basic image metadata
            const sizeKb = Math.round(imgMsg.fileLength / 1024) || '?';
            const w = imgMsg.width || '?';
            const h = imgMsg.height || '?';
            await safeSend({
                text:
                    `👁️ *Image Info*\n\n` +
                    `📐 Resolution: ${w} × ${h}px\n` +
                    `📦 Size: ${sizeKb} KB\n` +
                    `🖼️ Type: ${mimeType}\n\n` +
                    `_For full AI description, set a GEMINI_API_KEY in your secrets._`,
            }, { quoted: message });

        } catch (e) {
            reply(`❌ Could not analyze the image: ${e.message}`);
        }
    },
};
