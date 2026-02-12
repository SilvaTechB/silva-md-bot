const handler = {
    help: ['fetchjid <group/channel link>'],
    tags: ['utilities'],
    command: /^fetchjid$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        const sender = message.key.participant || message.key.remoteJid;

        if (!args || !args[0]) {
            return await sock.sendMessage(jid, {
                text: '⚠️ Please provide a WhatsApp group or channel invite link.',
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA TECH UTILITY 💻",
                        serverMessageId: 200
                    }
                }
            }, { quoted: message });
        }

        const link = args[0].trim();
        let fetchedJid;

        try {
            // Extract invite code
            const matchGroup = link.match(/chat\.whatsapp\.com\/([0-9A-Za-z]+)/i);
            const matchChannel = link.match(/whatsapp\.com\/channel\/([0-9A-Za-z]+)/i);

            if (matchGroup) {
                const code = matchGroup[1];
                const info = await sock.groupInviteInfo(code).catch(() => null);

                if (!info || !info.id) throw new Error('Unable to fetch group info');
                fetchedJid = info.id.endsWith('@g.us') ? info.id : `${info.id}@g.us`;

            } else if (matchChannel) {
                const code = matchChannel[1];
                const info = await sock.query({
                    tag: 'iq',
                    attrs: { type: 'get', xmlns: 'w:g2', to: 's.whatsapp.net' },
                    content: [{ tag: 'invite', attrs: { code } }]
                }).catch(() => null);

                if (!info || !info.content || !info.content[0] || !info.content[0].attrs || !info.content[0].attrs.id) {
                    throw new Error('Unable to fetch channel info');
                }

                fetchedJid = info.content[0].attrs.id.replace(/@c\.us$/, '@newsletter');

            } else {
                throw new Error('Invalid group or channel link');
            }

            await sock.sendMessage(jid, {
                text: `✅ *JID fetched successfully!*\n\n${fetchedJid}`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA TECH UTILITY 💻",
                        serverMessageId: 201
                    },
                    externalAdReply: {
                        title: "SILVA TECH BOT",
                        body: "Fetch JID Utility ⚡",
                        sourceUrl: "https://silvatech.top",
                        showAdAttribution: true,
                        thumbnailUrl: "https://i.imgur.com/8hQvY5j.png"
                    }
                }
            }, { quoted: message });

        } catch (err) {
            await sock.sendMessage(jid, {
                text: `❌ *Error fetching JID:*\n${err.message}`,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA TECH ERROR 💥",
                        serverMessageId: 202
                    }
                }
            }, { quoted: message });
        }
    }
};

module.exports = { handler };