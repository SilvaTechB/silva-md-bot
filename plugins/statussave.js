module.exports = {
    name: 'status-saver',
    commands: ['send', 'nitumie', 'save'],
    tags: ['status', 'utility'],
    description: 'Automatically download and send statuses when commands are used',
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            const commandsList = module.exports.commands; // ✅ Avoid `this` binding issues

            // 1. Validate sock
            if (!sock || typeof sock.sendMessage !== 'function') {
                console.error('[CRITICAL] Invalid sock object:', sock);
                return;
            }

            // 2. Handle text safely
            const rawText = typeof m.text === 'string' ? m.text : '';
            const cleanText = rawText.replace(/^[\/\!\.\#\-]/, '').trim().toLowerCase();
            console.log(`[DEBUG] Raw text: "${rawText}" | Clean text: "${cleanText}"`);

            // 3. Command detection
            const commandUsed = commandsList.find(cmd =>
                cleanText === cmd ||
                cleanText.startsWith(cmd + ' ') ||
                cleanText.endsWith(' ' + cmd) ||
                cleanText.includes(' ' + cmd + ' ')
            );
            if (!commandUsed) {
                console.log('[DEBUG] No valid command found - exiting');
                return;
            }

            // 4. Validate quoted message
            if (!m.quoted || !m.quoted.message) {
                console.log('[DEBUG] No quoted message');
                return await sock.sendMessage(
                    sender,
                    {
                        text: `📌 *Reply to a status first!*\n\nExample: reply to a status with "save"`,
                        contextInfo
                    },
                    { quoted: m }
                );
            }

            // 5. Check media type
            const isImage = !!m.quoted.message.imageMessage;
            const isVideo = !!m.quoted.message.videoMessage;
            if (!isImage && !isVideo) {
                console.log('[DEBUG] Quoted message is not status media');
                return await sock.sendMessage(
                    sender,
                    {
                        text: `❌ *Unsupported message type!*\n\nOnly status images/videos can be saved`,
                        contextInfo
                    },
                    { quoted: m }
                );
            }

            // 6. Download media
            console.log('[DEBUG] Downloading media...');
            const mediaType = isImage ? 'image' : 'video';
            const buffer = await sock.downloadMediaMessage(m.quoted);
            if (!buffer || buffer.length === 0) {
                throw new Error('Empty media buffer');
            }

            // 7. Get caption or use default
            const mediaData = isImage ? m.quoted.message.imageMessage : m.quoted.message.videoMessage;
            const caption = mediaData.caption || '📥 Status saved by Silva MD';

            // 8. Send media
            console.log(`[DEBUG] Sending ${mediaType} media...`);
            await sock.sendMessage(
                sender,
                {
                    [mediaType]: buffer,
                    caption: caption,
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

            // 9. Send confirmation
            console.log('[DEBUG] Sending confirmation');
            await sock.sendMessage(
                sender,
                { text: "✅ Status saved successfully!", contextInfo },
                { quoted: m }
            );
        } catch (error) {
            console.error('[ERROR] Status saver failed:', error);
            if (sock?.sendMessage) {
                await sock.sendMessage(
                    sender,
                    {
                        text: `❌ *Download failed!*\n\nError: ${error.message || 'Unknown error'}`,
                        contextInfo
                    },
                    { quoted: m }
                );
            }
        }
    }
};
