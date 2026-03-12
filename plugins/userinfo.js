'use strict';
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['userinfo', 'whoami', 'whois', 'me'],
    description: 'Show detailed info about yourself or a mentioned user',
    usage:       '.userinfo | .whois @mention',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, from, isGroup, contextInfo } = ctx;
        const config = require('../config');
        const reply  = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        // Resolve target — mentioned user or self
        const mentioned = message.message?.extendedTextMessage?.contextInfo?.mentionedJid?.[0]
                       || (args[0]?.match(/^\d+$/) ? args[0] + '@s.whatsapp.net' : null);

        const target    = mentioned || from;
        const num       = target.split('@')[0];
        const isOwner   = num === (config.OWNER_NUMBER || '').replace(/[^0-9]/g, '');
        const isMe      = target === from;

        // Country code lookup (first 1-3 digits)
        const CC_MAP = {
            '1': '🇺🇸 USA/Canada', '7': '🇷🇺 Russia/Kazakhstan', '20': '🇪🇬 Egypt',
            '27': '🇿🇦 South Africa', '44': '🇬🇧 United Kingdom', '49': '🇩🇪 Germany',
            '33': '🇫🇷 France', '39': '🇮🇹 Italy', '34': '🇪🇸 Spain',
            '55': '🇧🇷 Brazil', '61': '🇦🇺 Australia', '62': '🇮🇩 Indonesia',
            '63': '🇵🇭 Philippines', '64': '🇳🇿 New Zealand', '65': '🇸🇬 Singapore',
            '81': '🇯🇵 Japan', '82': '🇰🇷 South Korea', '86': '🇨🇳 China',
            '91': '🇮🇳 India', '92': '🇵🇰 Pakistan', '254': '🇰🇪 Kenya',
            '255': '🇹🇿 Tanzania', '256': '🇺🇬 Uganda', '233': '🇬🇭 Ghana',
            '234': '🇳🇬 Nigeria', '212': '🇲🇦 Morocco', '213': '🇩🇿 Algeria',
            '216': '🇹🇳 Tunisia', '221': '🇸🇳 Senegal', '260': '🇿🇲 Zambia',
            '263': '🇿🇼 Zimbabwe', '250': '🇷🇼 Rwanda', '251': '🇪🇹 Ethiopia',
        };

        let country = '🌍 Unknown';
        for (const cc of ['254', '255', '256', '234', '233', '250', '251', '263', '260', '212', '213', '216', '221', '27']) {
            if (num.startsWith(cc)) { country = CC_MAP[cc] || country; break; }
        }
        if (country === '🌍 Unknown') {
            for (const cc of ['1', '7', '20', '44', '49', '33', '39', '34', '55', '61', '62', '63', '65', '81', '82', '86', '91', '92', '64']) {
                if (num.startsWith(cc)) { country = CC_MAP[cc] || country; break; }
            }
        }

        const lines = [
            `👤 *User Info*`,
            ``,
            `📱 *Number:* +${num}`,
            `🌍 *Country:* ${country}`,
            `📌 *JID:* ${target}`,
        ];

        if (isOwner) lines.push(`👑 *Role:* Owner`);
        else if (isGroup) {
            try {
                const meta    = await sock.groupMetadata(jid);
                const admins  = (meta.participants || []).filter(p => p.admin).map(p => p.id);
                const role    = admins.includes(target) ? '🛡️ Admin' : '👤 Member';
                lines.push(`🏷️ *Role:* ${role}`);
            } catch { /* group metadata optional */ }
        }

        if (isMe) lines.push(``, `_That's you! 👆_`);

        try {
            const ppUrl = await sock.profilePictureUrl(target, 'image');
            if (ppUrl) {
                const res = await (require('axios').get(ppUrl, { responseType: 'arraybuffer', timeout: 8000 }));
                await sock.sendMessage(jid, {
                    image: Buffer.from(res.data),
                    caption: fmt(lines.join('\n')),
                    contextInfo
                }, { quoted: message });
                return;
            }
        } catch { /* no profile picture, fall through to text */ }

        return reply(lines.join('\n'));
    }
};
