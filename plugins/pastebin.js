'use strict';
const axios = require('axios');

// hastebin.com is dead (connection refused) — removed.
// Using paste.rs (reliable, no account needed) as primary.
// dpaste.org as secondary. Catbox .txt as final fallback.

module.exports = {
    commands:    ['paste', 'pastebin', 'hastebin'],
    description: 'Paste text online and get a shareable link',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const msg = message.message;
        const quotedText = msg?.extendedTextMessage?.contextInfo?.quotedMessage?.conversation
                        || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.extendedTextMessage?.text
                        || '';
        const text = args.join(' ').trim() || quotedText;

        if (!text) {
            return sock.sendMessage(sender, {
                text: '📋 Please provide text to paste.\nExample: `.paste Hello World`\n_Or reply to a message with `.paste`_',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, { text: '⏳ Uploading paste...', contextInfo }, { quoted: message });

        // Strategy 1: paste.rs — simple PUT, returns URL in body
        try {
            const res = await axios.post('https://paste.rs/', text, {
                headers: { 'Content-Type': 'text/plain' },
                timeout: 12000,
            });
            const link = String(res.data).trim();
            if (link.startsWith('https://')) {
                return sock.sendMessage(sender, {
                    text: `📋 *Paste Uploaded!*\n\n🔗 ${link}\n\n_paste.rs • No expiry_`,
                    contextInfo
                }, { quoted: message });
            }
        } catch {}

        // Strategy 2: dpaste.org
        try {
            const form = new URLSearchParams({
                content:  text,
                syntax:   'text',
                title:    'Silva MD Paste',
                expiry_days: '30',
            });
            const res = await axios.post('https://dpaste.org/api/', form.toString(), {
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                timeout: 12000,
            });
            const link = String(res.data).trim().replace(/["']/g, '');
            if (link.startsWith('http')) {
                return sock.sendMessage(sender, {
                    text: `📋 *Paste Uploaded!*\n\n🔗 ${link}\n\n_dpaste.org • Expires in 30 days_`,
                    contextInfo
                }, { quoted: message });
            }
        } catch {}

        // Strategy 3: catbox.moe (text file upload)
        try {
            const FormData = require('form-data');
            const form = new FormData();
            form.append('reqtype', 'fileupload');
            form.append('fileToUpload', Buffer.from(text, 'utf8'), {
                filename: `paste_${Date.now()}.txt`,
                contentType: 'text/plain',
            });
            const res = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(),
                timeout: 20000,
            });
            const link = String(res.data).trim();
            if (link.startsWith('https://')) {
                return sock.sendMessage(sender, {
                    text: `📋 *Paste Uploaded!*\n\n🔗 ${link}\n\n_catbox.moe • No expiry_`,
                    contextInfo
                }, { quoted: message });
            }
        } catch {}

        await sock.sendMessage(sender, {
            text: `❌ Paste upload failed.\n\nYou can paste text manually at:\n🔗 https://paste.rs\n🔗 https://dpaste.org`,
            contextInfo
        }, { quoted: message });
    }
};
