'use strict';

const axios = require('axios');

module.exports = {
    commands:    ['fetch', 'get'],
    description: 'Fetch a URL and return its content or file',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid    = message.key.remoteJid;
        const sender = message.key.participant || jid;

        const reply = (text) =>
            sock.sendMessage(jid, { text, contextInfo }, { quoted: message });

        try {
            // Resolve URL from args or quoted message text
            let url = args.join(' ').trim();

            if (!url) {
                const quotedText =
                    message.message?.extendedTextMessage?.contextInfo?.quotedMessage
                        ?.conversation ||
                    message.message?.extendedTextMessage?.contextInfo?.quotedMessage
                        ?.extendedTextMessage?.text;
                url = (quotedText || '').trim();
            }

            if (!url || !/^https?:\/\//.test(url)) {
                return reply('✳️ Provide a valid URL starting with http:// or https://');
            }

            const res = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout:      15000,
            });

            // Guard against huge files
            const contentLength = parseInt(res.headers['content-length'] || '0', 10);
            if (contentLength > 100 * 1024 * 1024) {
                return reply(`❌ File too large: ${(contentLength / 1024 / 1024).toFixed(1)} MB`);
            }

            const contentType = res.headers['content-type'] || '';

            // Non-text/JSON → send as document
            if (!/text|json/.test(contentType)) {
                const fileName = url.split('/').pop().split('?')[0] || 'file';
                return sock.sendMessage(
                    jid,
                    {
                        document: Buffer.from(res.data),
                        fileName,
                        mimetype:    contentType,
                        contextInfo: { ...contextInfo, mentionedJid: [sender] },
                    },
                    { quoted: message }
                );
            }

            // Text / JSON → format and send
            let txt = Buffer.from(res.data).toString('utf-8');
            try {
                txt = JSON.stringify(JSON.parse(txt), null, 2);
            } catch {
                // Keep as plain text
            }

            // Limit to 65 k chars
            txt = txt.slice(0, 65536);

            return sock.sendMessage(
                jid,
                { text: txt, contextInfo: { ...contextInfo, mentionedJid: [sender] } },
                { quoted: message }
            );

        } catch (err) {
            console.error('[fetch]', err.message);
            return reply(`❌ Error fetching URL:\n${err.message}`);
        }
    },
};
