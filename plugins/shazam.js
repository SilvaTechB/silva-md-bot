'use strict';

const axios = require('axios');
const fs    = require('fs');
const path  = require('path');
const os    = require('os');

module.exports = {
    commands:    ['shazam', 'identify', 'song'],
    description: 'Identify a song from a replied audio/video message using AudD',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, sender, contextInfo, safeSend }) => {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return safeSend({
                text: '🎵 Please *reply* to an audio or video message to identify the song.',
                contextInfo
            }, { quoted: message });
        }

        const msgType = Object.keys(quoted)[0];
        if (!['audioMessage', 'videoMessage'].includes(msgType)) {
            return safeSend({
                text: '❌ Please reply to an *audio* or *video* message.',
                contextInfo
            }, { quoted: message });
        }

        await safeSend({ text: '🎧 Identifying song...', contextInfo }, { quoted: message });

        let tempFile = null;
        try {
            const { downloadContentFromMessage } = require('@whiskeysockets/baileys');
            const stream = await downloadContentFromMessage(quoted[msgType], msgType.replace('Message', ''));
            let buffer = Buffer.alloc(0);
            for await (const chunk of stream) buffer = Buffer.concat([buffer, chunk]);

            tempFile = path.join(os.tmpdir(), `shazam_${Date.now()}.ogg`);
            fs.writeFileSync(tempFile, buffer);

            const form = new FormData();
            form.append('return', 'apple_music,spotify');
            form.append('api_token', 'test');
            form.append('file', new Blob([buffer]), 'audio.ogg');

            const res = await axios.post('https://api.audd.io/', form, { timeout: 30000 });
            const result = res.data?.result;

            if (!result) {
                return safeSend({
                    text: '❌ Could not identify the song. Try a clearer audio clip.',
                    contextInfo
                }, { quoted: message });
            }

            const text =
                `🎵 *Song Identified!*\n\n` +
                `🎤 *Title:* ${result.title}\n` +
                `🎸 *Artist:* ${result.artist}\n` +
                `💿 *Album:* ${result.album || 'N/A'}\n` +
                `📅 *Release:* ${result.release_date || 'N/A'}\n` +
                `🔗 *Apple Music:* ${result.apple_music?.url || 'N/A'}\n` +
                `🎧 *Spotify:* ${result.spotify?.external_urls?.spotify || 'N/A'}`;

            await safeSend({ text, contextInfo }, { quoted: message });
        } catch (err) {
            console.error('[Shazam]', err.message);
            await safeSend({
                text: `⚠️ Shazam failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        } finally {
            if (tempFile && fs.existsSync(tempFile)) fs.unlinkSync(tempFile);
        }
    }
};
