const axios = require('axios');

const handler = {
    help: ['privacy', 'broadcast', 'status'],
    tags: ['tools', 'main'],
    command: /^(privacy|broadcast|status)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, text }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            const args = text ? text.split(' ') : [];

            // ----- Block / Unblock -----
            if (args[0] === 'block') {
                await sock.updateBlockStatus(jid, 'block');
                return await sock.sendMessage(jid, { 
                    text: '🔒 User blocked successfully.', 
                    contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA BOT PRIVACY💖", serverMessageId: 143 } } 
                });
            }
            if (args[0] === 'unblock') {
                await sock.updateBlockStatus(jid, 'unblock');
                return await sock.sendMessage(jid, { 
                    text: '🔓 User unblocked successfully.', 
                    contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA BOT PRIVACY💖", serverMessageId: 143 } } 
                });
            }

            // ----- Get Privacy Settings -----
            if (args[0] === 'getprivacy') {
                const privacySettings = await sock.fetchPrivacySettings(true);
                const blockList = await sock.fetchBlocklist();
                return await sock.sendMessage(jid, { 
                    text: `📜 *Silva Privacy Settings:*\n${JSON.stringify(privacySettings, null, 2)}\n\n📋 *Block List:*\n${JSON.stringify(blockList, null, 2)}`, 
                    contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA BOT PRIVACY💖", serverMessageId: 143 } } 
                });
            }

            // ----- Set Privacy -----
            if (args[0] === 'setprivacy') {
                const type = args[1]; // lastseen, online, profilePic, status, read, groups, ephemeral
                const value = args[2]; 

                switch(type) {
                    case 'lastseen': await sock.updateLastSeenPrivacy(value); break;
                    case 'online': await sock.updateOnlinePrivacy(value); break;
                    case 'profilePic': await sock.updateProfilePicturePrivacy(value); break;
                    case 'status': await sock.updateStatusPrivacy(value); break;
                    case 'read': await sock.updateReadReceiptsPrivacy(value); break;
                    case 'groups': await sock.updateGroupsAddPrivacy(value); break;
                    case 'ephemeral': await sock.updateDefaultDisappearingMode(Number(value)); break;
                    default: throw '❌ Invalid privacy type';
                }

                return await sock.sendMessage(jid, { 
                    text: `✅ *${type}* privacy updated to *${value}*`, 
                    contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA BOT PRIVACY💖", serverMessageId: 143 } } 
                });
            }

            // ----- Broadcast / Status -----
            if (args[0] === 'broadcast') {
                const url = args[1];
                const caption = args[2] || '';
                const statusList = args[3] ? args[3].split(',') : [];

                await sock.sendMessage(jid, {
                    image: { url },
                    caption,
                }, {
                    backgroundColor: '#F0F8FF',
                    font: 'Helvetica',
                    statusJidList: statusList,
                    broadcast: true,
                    contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA BOT PRIVACY💖", serverMessageId: 143 } }
                });

                return await sock.sendMessage(jid, { text: '🚀 Broadcast sent successfully!' });
            }

            // Fallback
            await sock.sendMessage(jid, { 
                text: '❌ Invalid command. Use block/unblock/getprivacy/setprivacy/broadcast', 
                contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA BOT PRIVACY💖", serverMessageId: 143 } } 
            });

        } catch (error) {
            console.error(error);
            await sock.sendMessage(jid, { 
                text: '❌ Error executing Silva privacy/broadcast command. Check console for details.', 
                contextInfo: { mentionedJid: [sender], forwardingScore: 999, isForwarded: true, forwardedNewsletterMessageInfo: { newsletterJid: "120363200367779016@newsletter", newsletterName: "SILVA BOT PRIVACY💖", serverMessageId: 143 } } 
            });
        }
    }
};

module.exports = { handler };
