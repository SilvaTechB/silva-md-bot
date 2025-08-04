const jidThumbnail = 'https://files.catbox.moe/5uli5p.jpeg';

module.exports = {
    commands: ['getjid', 'jid'],
    handler: async ({ sock, m, sender }) => {
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

✅ Use buttons below for more options.
✨ _Powered by Silva Tech Inc_
`.trim();

            await sock.sendMessage(sender, {
                image: { url: jidThumbnail },
                caption,
                footer: 'Choose an option:',
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
                contextInfo: {
                    externalAdReply: {
                        title: 'Silva MD JID Tool',
                        body: 'Fetch and manage WhatsApp JIDs easily!',
                        mediaUrl: 'https://silvatech.africa', // your site or GitHub
                        mediaType: 1,
                        sourceUrl: 'https://silvatech.africa',
                        thumbnailUrl: jidThumbnail,
                        renderLargerThumbnail: true,
                        showAdAttribution: true
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error('❌ GetJID Plugin Error:', error.message);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to fetch JID. Please try again later.'
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
                    .map(g => `• ${g.subject}\n   JID: ${g.id}`)
                    .join('\n\n');

                await sock.sendMessage(sender, {
                    text: `📋 *All Group JIDs*\n\n${groupList || 'No groups found.'}`,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Group JID List',
                            body: 'Fetched by Silva MD',
                            mediaUrl: 'https://silvatech.africa',
                            mediaType: 1,
                            sourceUrl: 'https://silvatech.africa',
                            thumbnailUrl: jidThumbnail,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: m });

            } else if (action === 'fetch_all_channels') {
                const chats = Object.values(sock.chats);
                const channels = chats
                    .filter(c => c.id.endsWith('@newsletter'))
                    .map(c => `• ${c.name || 'Unnamed'}\n   JID: ${c.id}`)
                    .join('\n\n');

                await sock.sendMessage(sender, {
                    text: `📢 *All Channel JIDs*\n\n${channels || 'No channels found.'}`,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Channel JID List',
                            body: 'Fetched by Silva MD',
                            mediaUrl: 'https://silvatech.africa',
                            mediaType: 1,
                            sourceUrl: 'https://silvatech.africa',
                            thumbnailUrl: jidThumbnail,
                            renderLargerThumbnail: false
                        }
                    }
                }, { quoted: m });

            } else if (action === 'copy_jid') {
                await sock.sendMessage(sender, {
                    text: `📌 *Chat JID:*\n\`${data}\``,
                    contextInfo: {
                        externalAdReply: {
                            title: 'Copied JID',
                            body: 'You can now paste this JID wherever needed',
                            mediaUrl: 'https://silvatech.africa',
                            mediaType: 1,
                            sourceUrl: 'https://silvatech.africa',
                            thumbnailUrl: jidThumbnail
                        }
                    }
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
