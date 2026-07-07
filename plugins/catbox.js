'use strict';

const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const os       = require('os');
const path     = require('path');
const { fmt }  = require('../lib/theme');
const { dlBuffer, TYPE_MAP } = require('../lib/dlmedia');

module.exports = {
    commands:    ['tourl', 'imgtourl', 'imgurl', 'geturl', 'upload'],
    description: 'Upload a media file to Catbox and get a shareable URL',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        const msg    = message.message;
        const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

        // Prefer quoted, fall back to direct media in the command message
        const source = quoted || msg;

        const mediaTypes = Object.keys(TYPE_MAP);
        const msgKey     = mediaTypes.find(k => source?.[k]);
        if (!msgKey) {
            return reply(fmt('❌ Reply to (or send with) an *image, video, audio, or document* and use this command.'));
        }

        const msgContent = source[msgKey];
        const mediaType  = TYPE_MAP[msgKey];
        const mimeType   = msgContent?.mimetype || '';

        await sock.sendMessage(jid, { text: fmt('⏳ Uploading to Catbox…'), contextInfo }, { quoted: message });

        let tempPath = null;
        try {
            const buffer = await dlBuffer(msgContent, mediaType);

            let ext = '';
            if (mimeType.includes('image/jpeg'))      ext = '.jpg';
            else if (mimeType.includes('image/png'))  ext = '.png';
            else if (mimeType.includes('image/webp')) ext = '.webp';
            else if (mimeType.includes('video'))      ext = '.mp4';
            else if (mimeType.includes('audio'))      ext = '.mp3';
            else if (mimeType.includes('pdf'))        ext = '.pdf';

            tempPath = path.join(os.tmpdir(), `catbox_${Date.now()}${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const form = new FormData();
            form.append('fileToUpload', fs.createReadStream(tempPath), `file${ext}`);
            form.append('reqtype', 'fileupload');

            const { data: mediaUrl } = await axios.post('https://catbox.moe/user/api.php', form, {
                headers: form.getHeaders(),
                timeout: 30_000
            });

            if (!mediaUrl || mediaUrl.toLowerCase().includes('error')) {
                throw new Error('Catbox returned an error: ' + mediaUrl);
            }

            const sizeStr = buffer.length < 1_048_576
                ? `${(buffer.length / 1024).toFixed(1)} KB`
                : `${(buffer.length / 1_048_576).toFixed(2)} MB`;

            const label = mimeType.includes('image') ? '🖼️ Image'
                : mimeType.includes('video')  ? '🎬 Video'
                : mimeType.includes('audio')  ? '🎵 Audio'
                : '📄 File';

            await reply(fmt(
                `☁️ *Upload Complete*\n\n` +
                `${label}\n` +
                `📦 *Size:* ${sizeStr}\n` +
                `🔗 *URL:* ${mediaUrl}`
            ));

        } catch (err) {
            console.error('[Catbox]', err.message);
            await reply(fmt(`⚠️ Upload failed: ${err.message}`));
        } finally {
            if (tempPath && fs.existsSync(tempPath)) {
                try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
            }
        }
    }
};
