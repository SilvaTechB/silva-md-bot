'use strict';

const { getStr } = require('../lib/theme');
const THUMB = 'https://files.catbox.moe/5uli5p.jpeg';

module.exports = {
    commands:    ['getjid', 'jid'],
    description: 'Get the JID of the current chat',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, jid, contextInfo }) => {
        try {
            const botName = getStr('botName') || 'Silva MD';
            const pic     = getStr('pic1') || THUMB;
            const type = jid.endsWith('@g.us')
                ? 'Group'
                : jid.endsWith('@newsletter')
                    ? 'Channel (Newsletter)'
                    : 'Private Chat';

            const caption =
`┏━━━━━━━━━━━━━━━┓
      ✦ *${botName} JID Fetch* ✦
┗━━━━━━━━━━━━━━━┛

🔹 *Chat JID:* \`${jid}\`
🔹 *Your JID:* \`${sender}\`
🔹 *Type:* ${type}

✨ _Powered by ${botName}_`;

            await sock.sendMessage(sender, {
                image:   { url: pic },
                caption,
                contextInfo
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
