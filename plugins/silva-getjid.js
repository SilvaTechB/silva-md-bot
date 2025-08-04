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
                        buttonId: `jid_action:fetch_all_groups`,
                        buttonText: { displayText: '📋 All Group JIDs' },
                        type: 1
                    },
                    {
                        buttonId: `jid_action:fetch_all_channels`,
                        buttonText: { displayText: '📢 All Channel JIDs' },
                        type: 1
                    },
                    {
                        buttonId: `jid_action:copy_jid:${chatJid}`,
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
    },

    /**
     * Button Response Handler
     */
    onButton: async ({ sock, buttonId, sender, m }) => {
        try {
            if (!buttonId.startsWith('jid_action')) return;

            const [, action, data] = buttonId.split(':');

            if (action === 'fetch_all_groups') {
                const groups = await sock.groupFetchAllParticipating();
                const groupList = Object.values(groups)
                    .map(g => `• ${g.subject} → ${g.id}`)
                    .join('\n');

                await sock.sendMessage(sender, {
                    text: `📋 *All Group JIDs*\n\n${groupList || 'No groups found.'}`
                }, { quoted: m });

            } else if (action === 'fetch_all_channels') {
                // Channels (Newsletters) require filtering chats
                const chats = await sock.chats;
                const channels = Object.values(chats)
                    .filter(c => c.id.endsWith('@newsletter'))
                    .map(c => `• ${c.name || 'Unnamed'} → ${c.id}`)
                    .join('\n');

                await sock.sendMessage(sender, {
                    text: `📢 *All Channel JIDs*\n\n${channels || 'No channels found.'}`
                }, { quoted: m });

            } else if (action === 'copy_jid') {
                await sock.sendMessage(sender, {
                    text: `📌 *Chat JID:*\n\`${data}\``
                }, { quoted: m });
            }

        } catch (error) {
            console.error('❌ Button Handling Error:', error.message);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to process button action.'
            }, { quoted: m });
        }
    }
};
