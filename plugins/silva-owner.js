const config = require('../config'); // ✅ Import config.js

module.exports = {
    commands: ['owner', 'creator'],
    handler: async ({ sock, m, sender, contextInfo = {} }) => {
        try {
            const ownerNumber = config.OWNER_NUMBER.replace(/[^0-9]/g, ''); // clean number
            const ownerName = config.OWNER_NAME;

            // ✅ Build vCard
            const vcard = `
BEGIN:VCARD
VERSION:3.0
FN:${ownerName}
ORG:Silva Tech Inc
TEL;type=CELL;type=VOICE;waid=${ownerNumber}:${ownerNumber}
END:VCARD
`.trim();

            // ✅ Send Contact Card with Preview
            await sock.sendMessage(sender, {
                contacts: {
                    displayName: ownerName,
                    contacts: [{ vcard }]
                },
                contextInfo: {
                    externalAdReply: {
                        title: "👑 Bot Owner",
                        body: "Tap to view contact details",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg", // ✅ Your bot image
                        sourceUrl: "https://github.com/SilvaTechB/silva-md-bot",
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            // ✅ Send Owner Info as Text
            await sock.sendMessage(sender, {
                text: `
*👑 Silva MD Bot Owner Info:*

📛 Name: ${ownerName}
📞 Number: wa.me/${ownerNumber}
🌐 Website: https://silvatechinc.com
✨ _Powered by Silva Tech Inc_
                `.trim(),
                contextInfo
            }, { quoted: m });

        } catch (error) {
            console.error('❌ Owner Plugin Error:', error.message);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to fetch owner details from config.js.',
                contextInfo
            }, { quoted: m });
        }
    }
};
