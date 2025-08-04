module.exports = {
    commands: ['getjid', 'jid'],
    handler: async ({ sock, m, sender, contextInfo = {} }) => {
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

            const caption = `
┏━━━━━━━━━━━━━━━┓
      ✦ *Silva MD JID Fetch* ✦
┗━━━━━━━━━━━━━━━┛

🔹 *Chat JID:* \`${chatJid}\`
🔹 *Type:* ${chatType}

✅ Copy and use the JID as needed.
✨ _Powered by Silva Tech Inc_
`.trim();

            await sock.sendMessage(sender, {
                image: { url: 'https://files.catbox.moe/5uli5p.jpeg' },
                caption,
                footer: 'Choose an option below:',
                buttons: [
                    {
                        buttonId: 'fetch_all_groups',
                        buttonText: { displayText: '📋 All Group JIDs' },
                        type: 1
                    },
                    {
                        buttonId: 'fetch_all_channels',
                        buttonText: { displayText: '📢 All Channel JIDs' },
                        type: 1
                    },
                    {
                        buttonId: 'copy_jid',
                        buttonText: { displayText: '📌 Copy JID' },
                        type: 1
                    }
                ],
                headerType: 4,
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ GetJID Plugin Error:', error.message);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to fetch JID. Please try again later.',
                contextInfo
            }, { quoted: m });
        }
    }
};
