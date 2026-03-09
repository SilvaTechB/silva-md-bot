'use strict';

module.exports = {
    commands:    ['save', 'nitumie', 'statussave'],
    description: 'Save a WhatsApp status (reply to a status with this command)',
    permission:  'public',
    group:       false,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        try {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quoted) {
                return sock.sendMessage(sender, {
                    text: '📌 *Reply to a status* to save it.\nExample: reply to a status image/video with `.save`',
                    contextInfo
                }, { quoted: message });
            }

            const isImage = !!quoted.imageMessage;
            const isVideo = !!quoted.videoMessage;

            if (!isImage && !isVideo) {
                return sock.sendMessage(sender, {
                    text: '❌ Only image and video statuses can be saved.',
                    contextInfo
                }, { quoted: message });
            }

            const mediaType = isImage ? 'image' : 'video';
            const buffer    = await sock.downloadMediaMessage({ message: quoted });

            if (!buffer || buffer.length === 0) throw new Error('Empty media buffer');

            const caption = (isImage ? quoted.imageMessage : quoted.videoMessage).caption
                || '📥 Status saved by Silva MD';

            await sock.sendMessage(sender, {
                [mediaType]: buffer,
                caption,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title:        'Status Saved',
                        body:         'Silva MD Status Downloader',
                        thumbnailUrl: 'https://files.catbox.moe/5uli5p.jpeg',
                        mediaType:    1
                    }
                }
            }, { quoted: message });

            await sock.sendMessage(sender, {
                text: '✅ Status saved successfully!',
                contextInfo
            }, { quoted: message });
        } catch (err) {
            console.error('[StatusSave]', err.message);
            await sock.sendMessage(sender, {
                text: `❌ Failed to save status: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
