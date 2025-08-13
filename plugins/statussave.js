module.exports = {
    name: 'status-saver',
    commands: ['send', 'nitumie', 'save'],
    tags: ['status', 'utility'],
    description: 'Automatically downloads statuses when keywords are detected',
    handler: async ({ sock, m, sender, contextInfo }) => {
        console.log('[Status Saver] Command triggered by:', sender);
        try {
            // 1. Validate essential parameters
            if (!sock || typeof sock.sendMessage !== 'function') {
                console.error('[Critical] sock object is invalid:', sock);
                return;
            }

            // 2. Define trigger keywords (case-insensitive)
            const keywords = ['send', 'nitumie', 'save'];
            console.log(`[Debug] Received message text: "${m.text}"`);

            // 3. Extract clean text (remove prefixes/special characters)
            const cleanText = (m.text || '').replace(/^[\/\!\.\#\-]/, '').trim().toLowerCase();
            console.log(`[Debug] Cleaned text: "${cleanText}"`);

            // 4. Check for keyword presence (whole word match)
            const hasKeyword = keywords.some(keyword => 
                cleanText === keyword || 
                cleanText.startsWith(keyword + ' ') || 
                cleanText.includes(' ' + keyword + ' ') || 
                cleanText.endsWith(' ' + keyword)
            );

            if (!hasKeyword) {
                console.log('[Debug] No keyword match - exiting');
                return;
            }

            // 5. Validate quoted message
            if (!m.quoted) {
                console.log('[Debug] No quoted message found');
                return await sock.sendMessage(
                    sender,
                    { 
                        text: `📌 *Reply to a status first!*\n\n` +
                              `_Example: reply to a status image/video with "save"_`,
                        contextInfo
                    },
                    { quoted: m }
                );
            }

            // 6. Check if quoted message is valid status
            const isImageStatus = m.quoted.message?.imageMessage;
            const isVideoStatus = m.quoted.message?.videoMessage;
            
            if (!isImageStatus && !isVideoStatus) {
                console.log('[Debug] Quoted message is not status:', m.quoted.message);
                return await sock.sendMessage(
                    sender,
                    { 
                        text: `❌ *Unsupported message type!*\n\n` +
                              `Only status images/videos can be saved`,
                        contextInfo
                    },
                    { quoted: m }
                );
            }

            // 7. Download media
            console.log('[Debug] Starting media download...');
            const mediaType = isImageStatus ? 'image' : 'video';
            const buffer = await sock.downloadMediaMessage(m.quoted);
            
            if (!buffer || buffer.length === 0) {
                console.error('[Error] Empty buffer from download');
                throw new Error('Downloaded media is empty');
            }
            console.log(`[Success] Downloaded ${mediaType} (${buffer.length} bytes)`);

            // 8. Prepare caption
            const mediaCaption = (
                (isImageStatus ? m.quoted.message.imageMessage.caption : m.quoted.message.videoMessage.caption) || 
                '📥 Status saved by Silva MD'
            );

            // 9. Send media with enhanced reliability
            console.log(`[Debug] Sending ${mediaType} back to user...`);
            await sock.sendMessage(
                sender,
                {
                    [mediaType]: buffer,
                    caption: mediaCaption,
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title: "Status Saved",
                            body: "Silva MD Status Downloader",
                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                            mediaType: 1
                        }
                    }
                },
                { quoted: m }
            );

            // 10. Send success confirmation
            console.log('[Success] Media sent successfully');
            await sock.sendMessage(
                sender,
                { text: "✅ Status saved successfully!", contextInfo },
                { quoted: m }
            );

        } catch (error) {
            console.error('[Critical Error] in status-saver:', error);
            if (sock?.sendMessage) {
                await sock.sendMessage(
                    sender,
                    { 
                        text: `❌ *Download failed!*\n\n` +
                              `_Error: ${error.message || 'Unknown error'}_\n` +
                              `Please try again later`,
                        contextInfo
                    },
                    { quoted: m }
                );
            }
        }
    }
};
