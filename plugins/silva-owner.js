'use strict';

const config = require('../config');

module.exports = {
    commands:    ['owner', 'creator'],
    description: 'Show bot owner contact information',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, jid, contextInfo }) => {
        const ownerNumber = (config.OWNER_NUMBER || '').replace(/\D/g, '');
        const ownerName   = config.OWNER_NAME || '✦ Silva ✦ MD ✦';

        const vcard = [
            'BEGIN:VCARD',
            'VERSION:3.0',
            `FN:${ownerName}`,
            'ORG:Silva Tech Inc',
            `TEL;type=CELL;type=VOICE;waid=${ownerNumber}:+${ownerNumber}`,
            'END:VCARD'
        ].join('\n');

        await sock.sendMessage(sender, {
            contacts: {
                displayName: ownerName,
                contacts: [{ vcard }]
            },
            contextInfo: {
                ...contextInfo,
                externalAdReply: {
                    title: '👑 Bot Owner',
                    body: 'Tap to view contact details',
                    thumbnailUrl: config.ALIVE_IMG || 'https://files.catbox.moe/5uli5p.jpeg',
                    sourceUrl: 'https://github.com/SilvaTechB/silva-md-bot',
                    mediaType: 1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

        await sock.sendMessage(sender, {
            text: `*👑 Silva MD Bot Owner Info:*\n\n📛 Name: ${ownerName}\n📞 Number: wa.me/${ownerNumber}\n🌐 Website: https://silvatechinc.com\n✨ _Powered by Silva Tech Inc_`,
            contextInfo
        }, { quoted: message });
    }
};
