module.exports = {
    name: 'status-saver',
    commands: ['send', 'nitumie', 'save'],
    tags: ['status', 'utility'],
    description: 'Automatically downloads and sends status when keywords are detected',
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            // Check if sock is available
            if (!sock || typeof sock.sendMessage !== 'function') {
                console.error('WebSocket connection not available');
                return;
            }

            // Define trigger keywords (works with or without prefix)
            const keywords = ['send', 'nitumie', 'save'];
            
            // Extract clean text (remove prefix if exists)
            const prefixRegex = new RegExp(`^[\\/\\!\\#\\.\\-]`);
            const cleanText = (m.text || '').replace(prefixRegex, '').trim().toLowerCase();

            // Check if message contains any trigger keyword
            const hasKeyword = keywords.some(keyword => 
                cleanText === keyword.toLowerCase() || 
                cleanText.includes(keyword.toLowerCase())
            );

            if (!hasKeyword) return; // Skip if no keyword found

            // Check if this is a reply to a status message
            if (!m.quoted?.message || 
               (!m.quoted.message.imageMessage && !m.quoted.message.videoMessage)) {
                return await sock.sendMessage(
                    sender,
                    { 
                        text: `*📌 Reply to a status (image/video) with these keywords:*\n` +
                              `${keywords.map(k => `▸ ${k}`).join('\n')}\n\n` +
                              `_You can use with or without prefix_`,
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }

            // Extract media from quoted message
            const mediaMessage = m.quoted.message.imageMessage || m.quoted.message.videoMessage;
            const caption = mediaMessage.caption || "📥 Status downloaded by Silva MD";

            // Download the media
            const buffer = await sock.downloadMediaMessage(m.quoted);
            if (!buffer) throw new Error('Failed to download media');

            // Determine media type and prepare message
            const isImage = !!m.quoted.message.imageMessage;
            const messageOptions = {
                [isImage ? 'image' : 'video']: buffer,
                caption: caption,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title: "Status Saved Successfully",
                        body: "Silva MD Status Downloader",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        mediaType: 1
                    }
                }
            };

            // Send the status back to user
            await sock.sendMessage(sender, messageOptions, { quoted: m });

            // Optional: Send confirmation text
            await sock.sendMessage(
                sender,
                { text: "✅ Status downloaded successfully!", contextInfo },
                { quoted: m }
            );

        } catch (error) {
            console.error('Status Saver Error:', error);
            if (sock?.sendMessage) {
                await sock.sendMessage(
                    sender,
                    { 
                        text: '❌ Failed to process status!\nPlease try again later',
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }
        }
    }
};
