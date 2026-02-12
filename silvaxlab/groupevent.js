// groupEventsDashboard.js
const groupSettings = {}; // Stores settings per group { [groupJid]: { welcome: true, goodbye: true } }

const handler = {
    help: ['groupevents', 'events'],
    tags: ['group'],
    command: /^(groupevents|events)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false, // Only owner can configure
    execute: async ({ jid, sock, message, args }) => {
        if (!args[0]) {
            return await sock.sendMessage(jid, {
                text: `📊 *Group Events Dashboard*\n\n` +
                      `Usage:\n` +
                      `.events enable|disable welcome <group_link>\n` +
                      `.events enable|disable goodbye <group_link>\n\n` +
                      `Example:\n` +
                      `.events enable welcome https://chat.whatsapp.com/xxxxxx`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA GROUP DASH 💡",
                        serverMessageId: 143
                    }
                }
            });
        }

        const [action, type, groupLink] = args;
        if (!['enable', 'disable'].includes(action.toLowerCase())) return message.reply('❌ Action must be enable or disable');
        if (!['welcome', 'goodbye'].includes(type.toLowerCase())) return message.reply('❌ Type must be welcome or goodbye');
        if (!groupLink || !groupLink.includes('https://chat.whatsapp.com/')) return message.reply('❌ Invalid group link');

        try {
            const inviteCode = groupLink.split('/')[4];
            const info = await sock.groupGetInviteInfo(inviteCode);
            const groupId = info.id;

            if (!groupSettings[groupId]) groupSettings[groupId] = { welcome: false, goodbye: false };
            groupSettings[groupId][type.toLowerCase()] = action.toLowerCase() === 'enable';

            await sock.sendMessage(jid, {
                text: `✅ *${type.toUpperCase()} messages ${action.toLowerCase()}d* for group: *${info.subject}*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA GROUP DASH 💡",
                        serverMessageId: 143
                    }
                }
            });
        } catch (err) {
            return message.reply(`❌ Error: ${err.message}`);
        }
    }
};

// Listen to participant updates globally
const initGroupEventsListener = (sock) => {
    sock.ev.on('group-participants.update', async (update) => {
        const groupId = update.id;
        if (!groupSettings[groupId]) return;

        for (let user of update.participants) {
            const userTag = `@${user.split('@')[0]}`;

            // Welcome
            if (update.action === 'add' && groupSettings[groupId].welcome) {
                await sock.sendMessage(groupId, {
                    text: `🎉 Welcome ${userTag} to *${groupId.split('@')[0]}*! Enjoy your stay 🌟`,
                    contextInfo: { mentionedJid: [user] }
                });
            }

            // Goodbye
            if (update.action === 'remove' && groupSettings[groupId].goodbye) {
                // Group message
                await sock.sendMessage(groupId, {
                    text: `💔 ${userTag} has left *${groupId.split('@')[0]}*. We'll miss you 😢`,
                    contextInfo: { mentionedJid: [user] }
                });

                // DM
                await sock.sendMessage(user, {
                    text: `💌 Bye! You left the group *${groupId.split('@')[0]}*. Hope to see you again!`,
                    contextInfo: { forwardingScore: 999, isForwarded: true }
                }).catch(() => null);
            }
        }
    });
};

module.exports = { handler, initGroupEventsListener };
