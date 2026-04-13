'use strict';

const { Sticker, StickerTypes } = require('wa-sticker-formatter');

const styles = {
    default: { bg: '#000000', color: '#FFFFFF', font: 'bold 60px sans-serif' },
    neon: { bg: '#0a0a2e', color: '#00ff88', font: 'bold 56px monospace' },
    fire: { bg: '#1a0000', color: '#ff4500', font: 'bold 58px Impact' },
    ocean: { bg: '#001f3f', color: '#7fdbff', font: 'bold 54px Georgia' },
    pink: { bg: '#2d001e', color: '#ff69b4', font: 'bold 56px Arial' },
    gold: { bg: '#1a1a00', color: '#ffd700', font: 'bold 58px serif' },
    matrix: { bg: '#000000', color: '#00ff00', font: 'bold 48px monospace' },
    retro: { bg: '#2d1b69', color: '#ff6ec7', font: 'bold 54px Courier' },
};

function createTextImage(text, styleName = 'default') {
    const style = styles[styleName] || styles.default;

    const lines = [];
    const words = text.split(' ');
    let currentLine = '';
    for (const word of words) {
        if (currentLine.length + word.length > 15) {
            lines.push(currentLine.trim());
            currentLine = word + ' ';
        } else {
            currentLine += word + ' ';
        }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());

    const svgLines = lines.map((line, i) => {
        const y = 256 - ((lines.length - 1) * 35) + (i * 70);
        return `<text x="256" y="${y}" text-anchor="middle" dominant-baseline="middle" font-family="sans-serif" font-weight="bold" font-size="56" fill="${style.color}" stroke="${style.color}" stroke-width="1">${escapeXml(line)}</text>`;
    }).join('');

    return Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
        <rect width="512" height="512" fill="${style.bg}" rx="20"/>
        ${svgLines}
    </svg>`);
}

function escapeXml(str) {
    return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

module.exports = {
    commands: ['textsticker', 'tsticker', 'stext', 'textstick'],
    description: 'Create styled text stickers with various themes',
    usage: '.textsticker [style] <text> | Styles: neon, fire, ocean, pink, gold, matrix, retro',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        if (!args.length) {
            const styleList = Object.keys(styles).map(s => `• ${s}`).join('\n');
            return sock.sendMessage(jid, {
                text: `🎨 *Text Sticker Maker*\n\nCreate beautiful text stickers!\n\n*Usage:*\n\`.textsticker <text>\`\n\`.textsticker neon Hello World\`\n\n*Available Styles:*\n${styleList}`,
                contextInfo
            }, { quoted: message });
        }

        let styleName = 'default';
        let text = args.join(' ');

        if (styles[args[0].toLowerCase()]) {
            styleName = args[0].toLowerCase();
            text = args.slice(1).join(' ');
        }

        if (!text.trim()) {
            return sock.sendMessage(jid, { text: '❌ Please provide some text.', contextInfo }, { quoted: message });
        }

        if (text.length > 100) {
            return sock.sendMessage(jid, { text: '❌ Text too long. Max 100 characters.', contextInfo }, { quoted: message });
        }

        try {
            const svgBuffer = createTextImage(text, styleName);
            const sticker = new Sticker(svgBuffer, {
                pack: ctx.pushName || 'Silva MD',
                author: 'Silva Bot',
                type: StickerTypes.FULL,
                quality: 80
            });
            const stickerBuffer = await sticker.toBuffer();
            await sock.sendMessage(jid, { sticker: stickerBuffer }, { quoted: message });
        } catch (err) {
            await sock.sendMessage(jid, { text: '❌ Failed to create sticker. Try shorter text.', contextInfo }, { quoted: message });
        }
    }
};
