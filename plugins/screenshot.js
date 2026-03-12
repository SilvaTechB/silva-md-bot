'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['ss', 'screenshot', 'webshot', 'capture'],
    description: 'Take a screenshot of any website',
    usage:       '.ss [url]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        let url = args[0];
        if (!url) return reply('❌ *Usage:* `.ss [url]`\n\nExample: `.ss https://github.com`');
        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        try { new URL(url); }
        catch { return reply('❌ Invalid URL provided.'); }

        await reply(`📸 Taking screenshot of *${new URL(url).hostname}*...\n_This may take a few seconds._`);

        try {
            // Use screenshotone free tier (no key needed for basic use)
            const apiUrl = `https://shot.screenshotone.com/take?url=${encodeURIComponent(url)}&viewport_width=1280&viewport_height=720&format=jpg&image_quality=80&cache=true`;

            const res = await axios.get(apiUrl, {
                responseType: 'arraybuffer',
                timeout: 30000,
                headers: { 'User-Agent': 'SilvaMDBot/1.0' }
            });

            const buffer = Buffer.from(res.data);
            const domain = new URL(url).hostname;

            await sock.sendMessage(jid, {
                image: buffer,
                caption: fmt(`📸 *Screenshot*\n🌐 ${domain}\n🔗 ${url}`),
                mimetype: 'image/jpeg',
                contextInfo
            }, { quoted: message });

        } catch (e) {
            // Fallback to alternative API
            try {
                const fallbackUrl = `https://image.thum.io/get/width/1280/crop/720/png/${encodeURIComponent(url)}`;
                const res2 = await axios.get(fallbackUrl, { responseType: 'arraybuffer', timeout: 25000 });
                const buf2 = Buffer.from(res2.data);
                const domain = new URL(url).hostname;

                await sock.sendMessage(jid, {
                    image: buf2,
                    caption: fmt(`📸 *Screenshot*\n🌐 ${domain}\n🔗 ${url}`),
                    mimetype: 'image/png',
                    contextInfo
                }, { quoted: message });
            } catch (e2) {
                return reply(`❌ Screenshot failed: ${e2.message}\n\nThe site may be blocking screenshots or taking too long.`);
            }
        }
    }
};
