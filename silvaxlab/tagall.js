// TagAll plugin
const handler = {
    help: ['tagall'],
    tags: ['group'],
    command: /^(tagall)$/i,
    group: true,
    admin: true,
    botAdmin: true,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const metadata = await sock.groupMetadata(jid);
            const participants = metadata.participants.map(p => p.id);
            const groupName = metadata.subject || 'Group';
            const adminCount = metadata.participants.filter(p => p.admin).length;
            const user = message.pushName || 'User';
            const memberCount = participants.length;

            // Modern emoji set
            const emojis = ["🌟", "🔥", "💫", "🍀", "🎯", "🌈", "🌀"];

            // Generate mentions with emojis
            const mentionsText = participants.map((id, i) => {
                const emoji = emojis[i % emojis.length];
                return `${emoji} @${id.split('@')[0]}`;
            }).join('\n');

            // Catbox video for flair
            const mediaUrl = 'https://files.catbox.moe/5uli5p.jpeg'; // replace with gif/video if desired

            // Fake contact for context
            const sender = message.key.participant || jid;
            const quotedContact = {
                key: { fromMe: false, participant: sender, remoteJid: '0@s.whatsapp.net' },
                message: {
                    contactMessage: {
                        displayName: user,
                        vcard: `BEGIN:VCARD
VERSION:3.0
N:;${user};;;
FN:${user}
item1.TEL;waid=${sender.split('@')[0]}:${sender.split('@')[0]}
item1.X-ABLabel:Ponsel
END:VCARD`,
                    },
                },
            };

            const caption = `
╭─━─⭓ ᴍɪɴɪ 𝚂ɪʟᴠᴀ • ɢʀᴏᴜᴘ ᴛᴀɢɢᴇʀ
│ 🏷️ ɢʀᴏᴜᴘ : ${groupName}
│ 👑 ᴀᴅᴍɪɴ : ${adminCount}
│ 👤 ᴜꜱᴇʀ : ${user}
│ 👥 ᴍᴇᴍʙᴇʀꜱ : ${memberCount}
│
│ 📨 ᴍᴇꜱꜱᴀɢᴇ :
╰─━─⭓

${mentionsText}

> ᴍᴀᴅᴇ ɪɴ ʙʏ Silva Tech Nexus
`;

            await sock.sendMessage(jid, {
                image: { url: mediaUrl },
                caption,
                mentions: participants,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: '120363200367779016@newsletter',
                        newsletterName: 'SILVA',
                        serverMessageId: 143,
                    },
                },
            }, { quoted: quotedContact });

        } catch (error) {
            await sock.sendMessage(jid, { text: `❌ Tagall failed:\n${error.message}` }, { quoted: message });
        }
    },
};

module.exports = { handler };
