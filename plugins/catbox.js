'use strict';

const axios    = require('axios');
const FormData = require('form-data');
const fs       = require('fs');
const os       = require('os');
const path     = require('path');

module.exports = {
    commands:    ['tourl', 'imgtourl', 'imgurl', 'geturl', 'upload'],
    description: 'Upload a media file to Catbox and get a URL',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
        if (!quoted) {
            return sock.sendMessage(sender, {
                text: '❌ Reply to an image, video, or audio file with this command.',
                contextInfo
            }, { quoted: message });
        }

        const mediaTypes = ['imageMessage', 'videoMessage', 'audioMessage', 'documentMessage'];
        const msgType    = Object.keys(quoted).find(k => mediaTypes.includes(k));
        if (!msgType) {
            return sock.sendMessage(sender, {
                text: '❌ Only image, video, audio, or document files can be uploaded.',
                contextInfo
            }, { quoted: message });
        }

        const mimeType = quoted[msgType]?.mimetype || '';
        await sock.sendMessage(sender, { text: '⏳ Uploading media to Catbox...', contextInfo }, { quoted: message });

        let tempPath = null;
        try {
            const buffer = await sock.downloadMediaMessage({ message: quoted });
            if (!buffer?.length) throw new Error('Empty media buffer');

            let ext = '';
            if (mimeType.includes('image/jpeg')) ext = '.jpg';
            else if (mimeType.includes('image/png')) ext = '.png';
            else if (mimeType.includes('video')) ext = '.mp4';
            else if (mimeType.includes('audio')) ext = '.mp3';

            tempPath = path.join(os.tmpdir(), `catbox_${Date.now()}${ext}`);
            fs.writeFileSync(tempPath, buffer);

            const form = new FormData();
            form.append('fileToUpload', fs.createReadStream(tempPath), `file${ext}`);
            form.append('reqtype', 'fileupload');

            const { data: mediaUrl } = await axios.post('https://catbox.moe/user/api.php', form, {
                headers:  form.getHeaders(),
                timeout:  30000
            });

            if (!mediaUrl) throw new Error('Catbox returned empty response');

            const sizeStr = buffer.length < 1048576
                ? `${(buffer.length / 1024).toFixed(1)} KB`
                : `${(buffer.length / 1048576).toFixed(2)} MB`;

            const mediaLabel = mimeType.includes('image') ? 'Image'
                : mimeType.includes('video') ? 'Video'
                : mimeType.includes('audio') ? 'Audio'
                : 'File';

            await sock.sendMessage(sender, {
                text:
`⬆️ *${mediaLabel} Uploaded Successfully*

📦 *Size:* ${sizeStr}
🔗 *URL:* ${mediaUrl}

_Powered by Catbox.moe_`,
                contextInfo
            }, { quoted: message });
        } catch (err) {
            console.error('[Catbox]', err.message);
            await sock.sendMessage(sender, {
                text: `⚠️ Upload failed: ${err.message}`,
                contextInfo
            }, { quoted: message });
        } finally {
            if (tempPath && fs.existsSync(tempPath)) {
                try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
            }
        }
    }
};
