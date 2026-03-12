'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['fetch', 'webfetch', 'geturl', 'readurl'],
    description: 'Fetch plain-text content from any public URL',
    usage:       '.fetch [url]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        let url = args[0];
        if (!url) return reply('❌ *Usage:* `.fetch [url]`\n\nExample:\n`.fetch https://example.com`');

        if (!/^https?:\/\//i.test(url)) url = 'https://' + url;

        try {
            new URL(url);
        } catch {
            return reply('❌ Invalid URL. Make sure it starts with `http://` or `https://`');
        }

        try {
            const res = await axios.get(url, {
                timeout: 15000,
                maxContentLength: 50000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; SilvaMDBot/1.0)',
                    'Accept': 'text/plain, text/html, application/json, */*'
                },
                responseType: 'text'
            });

            let content = String(res.data || '');

            // Strip HTML tags for cleaner output
            content = content
                .replace(/<script[\s\S]*?<\/script>/gi, '')
                .replace(/<style[\s\S]*?<\/style>/gi, '')
                .replace(/<[^>]+>/g, ' ')
                .replace(/&nbsp;/g, ' ')
                .replace(/&amp;/g, '&')
                .replace(/&lt;/g, '<')
                .replace(/&gt;/g, '>')
                .replace(/&quot;/g, '"')
                .replace(/\s{2,}/g, ' ')
                .trim();

            if (!content) return reply('⚠️ The page returned no readable text content.');

            const MAX = 3000;
            const truncated = content.length > MAX;
            const preview = content.slice(0, MAX) + (truncated ? '\n\n_[Content truncated — showing first 3000 chars]_' : '');

            const domain = new URL(url).hostname;
            const status = res.status;

            return reply(`🌐 *Web Fetch*\n🔗 ${domain}\n📡 Status: ${status}\n\n${preview}`);

        } catch (e) {
            if (e.response) {
                return reply(`❌ Server returned *${e.response.status}* — ${e.response.statusText || 'Error'}`);
            }
            if (e.code === 'ECONNABORTED') return reply('⏱️ Request timed out — the site took too long to respond.');
            return reply(`❌ Failed to fetch URL: ${e.message}`);
        }
    }
};
