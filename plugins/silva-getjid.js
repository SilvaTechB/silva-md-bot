const handler = async (sock, m) => {
    try {
        const chatJid = m.key.remoteJid;
        let chatType = 'Unknown';

        if (chatJid.endsWith('@g.us')) {
            chatType = 'Group';
        } else if (chatJid.endsWith('@newsletter')) {
            chatType = 'Channel (Newsletter)';
        } else {
            chatType = 'Private Chat';
        }

        const caption = `📌 *Chat JID Info*\n\n` +
                        `🔹 *JID:* \`${chatJid}\`\n` +
                        `🔹 *Type:* ${chatType}\n\n` +
                        `✅ Copy the above JID for your use.`;

        await sock.sendMessage(m.key.remoteJid, {
            image: { url: 'https://files.catbox.moe/5uli5p.jpeg' },
            caption: caption,
            contextInfo: {
                externalAdReply: {
                    title: "Silva MD Bot",
                    body: "JID Fetch Tool",
                    thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                    sourceUrl: "https://whatsapp.com",
                    mediaType: 1,
                    renderLargerThumbnail: true,
                    showAdAttribution: true
                }
            }
        }, { quoted: m });

    } catch (err) {
        console.error('Error in getjid plugin:', err);
        await sock.sendMessage(m.key.remoteJid, { text: '❌ Failed to fetch JID.' }, { quoted: m });
    }
};

module.exports = {
    command: ['getjid', 'jid'],
    handler
};
