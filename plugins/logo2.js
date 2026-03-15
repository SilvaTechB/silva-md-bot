'use strict';

const axios  = require('axios');
const { fmt } = require('../lib/theme');

const LOGO_STYLES = {
    advancedglow:    { style: 'neon',           color: '#00ff88', bg: '#000000' },
    americanflag:    { style: 'flag',            color: '#B22234', bg: '#3C3B6E' },
    blackpinklogo:   { style: 'blackpink',       color: '#FF1493', bg: '#000000' },
    blackpinkstyle:  { style: 'blackpink2',      color: '#FF69B4', bg: '#111111' },
    cartoonstyle:    { style: 'cartoon',         color: '#FFD700', bg: '#FF4500' },
    deletingtext:    { style: 'delete',          color: '#FF0000', bg: '#000000' },
    effectclouds:    { style: 'clouds',          color: '#87CEEB', bg: '#FFFFFF' },
    galaxy:          { style: 'galaxy',          color: '#9B59B6', bg: '#000011' },
    galaxystyle:     { style: 'galaxy2',         color: '#E8D5FF', bg: '#000022' },
    glitchtext:      { style: 'glitch',          color: '#FF0000', bg: '#000000' },
    glossysilver:    { style: 'glossy',          color: '#C0C0C0', bg: '#222222' },
    glowingtext:     { style: 'glow',            color: '#FFFF00', bg: '#000000' },
    gradienttext:    { style: 'gradient',        color: '#FF0080', bg: '#FFFFFF' },
    lighteffect:     { style: 'light',           color: '#FFFFFF', bg: '#003366' },
    logo1917:        { style: 'retro',           color: '#C0A000', bg: '#1A1A1A' },
    luxurygold:      { style: 'gold',            color: '#FFD700', bg: '#1A0A00' },
    makingneon:      { style: 'neon2',           color: '#00FFFF', bg: '#000000' },
    neonglitch:      { style: 'neonglitch',      color: '#FF00FF', bg: '#000000' },
    nigerianflag:    { style: 'flag2',           color: '#008751', bg: '#FFFFFF' },
    papercut:        { style: 'paper',           color: '#333333', bg: '#F5F5DC' },
    pixelglitch:     { style: 'pixel',           color: '#00FF00', bg: '#000000' },
    sandsummer:      { style: 'sand',            color: '#DEB887', bg: '#87CEEB' },
    summerbeach:     { style: 'beach',           color: '#FF6B35', bg: '#00CED1' },
    texteffect:      { style: 'effect',          color: '#FF4500', bg: '#FFFFFF' },
    typographytext:  { style: 'typography',      color: '#2C3E50', bg: '#ECF0F1' },
    underwater:      { style: 'underwater',      color: '#00BFFF', bg: '#006994' },
    writetext:       { style: 'handwriting',     color: '#1A1A1A', bg: '#FFFFF0' },
    logomaker:       { style: 'logo',            color: '#FF6600', bg: '#FFFFFF' },
    logolist:        null,
    logo1917:        { style: 'retro',           color: '#C0A000', bg: '#1A1A1A' },
};

const LOGO_APIS = [
    (text, fg, bg) => `https://api.siputzx.my.id/api/maker/brat?text=${encodeURIComponent(text)}`,
    (text, fg, bg) => `https://api.siputzx.my.id/api/maker/ttp?text=${encodeURIComponent(text)}&color=${fg.replace('#','')}&bgcolor=${bg.replace('#','')}`,
    (text, fg, bg) => `https://api.ryzendesu.vip/api/sticker/carbon?text=${encodeURIComponent(text)}`,
];

module.exports = {
    commands: [
        'advancedglow', 'americanflag', 'blackpinklogo', 'blackpinkstyle',
        'cartoonstyle', 'deletingtext', 'effectclouds', 'galaxy', 'galaxystyle',
        'glitchtext', 'glossysilver', 'glowingtext', 'gradienttext', 'lighteffect',
        'logo1917', 'logolist', 'logomaker', 'luxurygold', 'makingneon', 'neonglitch',
        'nigerianflag', 'papercut', 'pixelglitch', 'sandsummer', 'summerbeach',
        'texteffect', 'typographytext', 'underwater', 'writetext'
    ],
    description: 'Logo maker and text effect generator',
    usage:       '.logomaker <text> | .galaxy <text> | .glitchtext <text>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const cmd   = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const text  = args.join(' ').trim();
        const send  = (t) => sock.sendMessage(jid, { text: fmt(t), contextInfo }, { quoted: message });

        if (cmd === 'logolist') {
            const styles = Object.keys(LOGO_STYLES).filter(k => k !== 'logolist').sort();
            const chunk1 = styles.slice(0, Math.ceil(styles.length / 2));
            const chunk2 = styles.slice(Math.ceil(styles.length / 2));
            return send(
                `🎨 *Logo Styles (${styles.length})*\n\n` +
                chunk1.map(s => `• .${s}`).join('\n') + '\n\n' +
                chunk2.map(s => `• .${s}`).join('\n') +
                `\n\n_Usage: .${styles[0]} <your text>_`
            );
        }

        if (!text) {
            return send(
                `🎨 *${cmd.toUpperCase()} Logo Maker*\n\n` +
                `❌ *Usage:* \`.${cmd} <your text>\`\n\n` +
                `Example: \`.${cmd} Silva MD\`\n\n` +
                `_Use \`.logolist\` to see all styles_`
            );
        }

        const styleInfo = LOGO_STYLES[cmd] || { style: 'logo', color: '#FF6600', bg: '#FFFFFF' };
        await sock.sendPresenceUpdate('composing', jid);

        let sent = false;
        for (const buildUrl of LOGO_APIS) {
            try {
                const url = buildUrl(text, styleInfo.color, styleInfo.bg);
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
                if (res.data?.length > 500) {
                    await sock.sendMessage(jid, {
                        image: Buffer.from(res.data),
                        caption: fmt(`🎨 *${cmd.toUpperCase()}*\n\nText: ${text}`),
                        contextInfo
                    }, { quoted: message });
                    sent = true;
                    break;
                }
            } catch {}
        }

        if (!sent) {
            const fancy = text.split('').map(c => {
                const code = c.charCodeAt(0);
                if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D3BF);
                if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D3B9);
                return c;
            }).join('');
            await send(
                `🎨 *${cmd.toUpperCase()} Style*\n\n` +
                `${fancy}\n\n` +
                `_Text:_ ${text}\n` +
                `_Style:_ ${cmd}\n\n` +
                `_Image generation unavailable — showing styled text_`
            );
        }
    }
};
