const axios = require('axios');
const FormData = require('form-data');
const fs = require('fs');
const os = require('os');
const path = require('path');

module.exports = {
    commands: ['tourl', 'imgtourl', 'imgurl', 'url', 'geturl', 'upload'],
    handler: async ({ sock, m, sender, args, contextInfo = {} }) => {
        try {
            // Check if quoted message exists and has media
            const quotedMsg = m.quoted ? m.quoted : m;
            const mimeType = (quotedMsg.msg || quotedMsg).mimetype || '';

            if (!mimeType) {
                return await sock.sendMessage(sender, {
                    text: '❌ Please reply to an image, video, or audio file',
                    contextInfo
                }, { quoted: m });
            }

            // Processing message
            await sock.sendMessage(sender, {
                text: '⏳ Uploading media to Catbox...',
                contextInfo
            }, { quoted: m });

            // Download the media
            const mediaBuffer = await quotedMsg.download();
            const tempFilePath = path.join(os.tmpdir(), `catbox_upload_${Date.now()}`);
            fs.writeFileSync(tempFilePath, mediaBuffer);

            // Get file extension based on mime type
            let extension = '';
            if (mimeType.includes('image/jpeg')) extension = '.jpg';
            else if (mimeType.includes('image/png')) extension = '.png';
            else if (mimeType.includes('video')) extension = '.mp4';
            else if (mimeType.includes('audio')) extension = '.mp3';

            const fileName = `file${extension}`;

            // Prepare form data for Catbox
            const form = new FormData();
            form.append('fileToUpload', fs.createReadStream(tempFilePath), fileName);
            form.append('reqtype', 'fileupload');

            // Upload to Catbox
            const response = await axios.post("https://catbox.moe/user/api.php", form, {
                headers: form.getHeaders(),
                timeout: 30000 // 30-second timeout
            });

            if (!response.data) {
                throw new Error('Error uploading to Catbox');
            }

            const mediaUrl = response.data;
            fs.unlinkSync(tempFilePath); // Clean up temp file

            // Determine media type for response
            let mediaType = 'File';
            if (mimeType.includes('image')) mediaType = 'Image';
            else if (mimeType.includes('video')) mediaType = 'Video';
            else if (mimeType.includes('audio')) mediaType = 'Audio';

            // Format file size
            const formatBytes = (bytes) => {
                if (bytes === 0) return '0 Bytes';
                const k = 1024;
                const sizes = ['Bytes', 'KB', 'MB', 'GB'];
                const i = Math.floor(Math.log(bytes) / Math.log(k));
                return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
            };

            // Send success response
            await sock.sendMessage(sender, {
                text: `⬆️ *${mediaType} Uploaded Successfully*\n\n` +
                      `📦 *Size:* ${formatBytes(mediaBuffer.length)}\n` +
                      `🔗 *URL:* ${mediaUrl}\n\n` +
                      `_Powered by Catbox.moe_`,
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Media Upload Error:', error.message);
            console.error('Error details:', error.response?.data || error.stack);
            
            // Clean up temp file if it exists
            if (tempFilePath && fs.existsSync(tempFilePath)) {
                fs.unlinkSync(tempFilePath);
            }

            await sock.sendMessage(sender, {
                text: `⚠️ Upload failed!\nReason: ${error.message || 'Service unavailable'}`,
                contextInfo
            }, { quoted: m });
        }
    }
};
