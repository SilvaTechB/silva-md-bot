'use strict';

const THUMB = 'https://files.catbox.moe/5uli5p.jpeg';

module.exports = {
    commands:    ['getjid', 'jid'],
    description: 'Get the JID of the current chat',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, jid, contextInfo }) => {
        try {
            const type = jid.endsWith('@g.us')
                ? 'Group'
                : jid.endsWith('@newsletter')
                    ? 'Channel (Newsletter)'
                    : 'Private Chat';

            const caption =
`┏━━━━━━━━━━━━━━━┓
      ✦ *Silva MD JID Fetch* ✦
┗━━━━━━━━━━━━━━━┛

🔹 *Chat JID:* \`${jid}\`
🔹 *Your JID:* \`${sender}\`
🔹 *Type:* ${type}

✨ _Powered by Silva Tech Inc_`;

            await sock.sendMessage(sender, {
                image:   { url: THUMB },
                caption,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title:               'Silva MD JID Tool',
                        body:                'Fetch and manage WhatsApp JIDs',
                        thumbnailUrl:        THUMB,
                        mediaType:           1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: message });
        } catch (err) {
            console.error('[GetJID]', err.message);
            await sock.sendMessage(sender, {
                text: '⚠️ Failed to fetch JID.',
                contextInfo
            }, { quoted: message });
        }
    }
};
