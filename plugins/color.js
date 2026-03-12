'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

function hexToRgb(hex) {
    const n = parseInt(hex.replace('#', ''), 16);
    return { r: (n >> 16) & 255, g: (n >> 8) & 255, b: n & 255 };
}

function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = s = 0; }
    else {
        const d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch (max) {
            case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
            case g: h = ((b - r) / d + 2) / 6; break;
            case b: h = ((r - g) / d + 4) / 6; break;
        }
    }
    return { h: Math.round(h * 360), s: Math.round(s * 100), l: Math.round(l * 100) };
}

function rgbToCmyk(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const k = 1 - Math.max(r, g, b);
    if (k === 1) return { c: 0, m: 0, y: 0, k: 100 };
    return {
        c: Math.round(((1 - r - k) / (1 - k)) * 100),
        m: Math.round(((1 - g - k) / (1 - k)) * 100),
        y: Math.round(((1 - b - k) / (1 - k)) * 100),
        k: Math.round(k * 100)
    };
}

function hexToDecimal(hex) { return parseInt(hex.replace('#', ''), 16); }

module.exports = {
    commands:    ['color', 'colour', 'hex', 'colorinfo'],
    description: 'Get detailed info about any color — HEX, RGB, HSL, CMYK conversions',
    usage:       '.color [#hex | r,g,b | name]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const input = args.join(' ').trim();
        if (!input) return reply('❌ *Usage:*\n• `.color #FF5733`\n• `.color 255,87,51`\n• `.color red`');

        let hex = '';

        try {
            if (/^#?[0-9a-fA-F]{3,6}$/.test(input.replace(/\s/g, ''))) {
                hex = input.replace('#', '').replace(/\s/g, '');
                if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
                hex = '#' + hex.toUpperCase();
            } else if (/^\d{1,3}\s*,\s*\d{1,3}\s*,\s*\d{1,3}$/.test(input)) {
                const [r, g, b] = input.split(',').map(n => Math.min(255, Math.max(0, parseInt(n.trim()))));
                hex = '#' + [r, g, b].map(n => n.toString(16).padStart(2, '0')).join('').toUpperCase();
            } else {
                // Try the thecolorapi for named colors
                const res = await axios.get('https://www.thecolorapi.com/id', {
                    params: { format: 'json', named: input.replace(/\s/g, '+') },
                    timeout: 8000
                });
                hex = res.data?.hex?.value || '';
                if (!hex) throw new Error('not found');
            }

            const { r, g, b } = hexToRgb(hex);
            const hsl  = rgbToHsl(r, g, b);
            const cmyk = rgbToCmyk(r, g, b);
            const dec  = hexToDecimal(hex);

            // Fetch color name from thecolorapi
            let name = 'Unknown';
            try {
                const nameRes = await axios.get('https://www.thecolorapi.com/id', {
                    params: { hex: hex.replace('#', ''), format: 'json' },
                    timeout: 8000
                });
                name = nameRes.data?.name?.value || 'Unknown';
            } catch { /* optional */ }

            const preview = `https://singlecolorimage.com/get/${hex.replace('#', '')}/120x40`;

            const lines = [
                `🎨 *Color Info*`,
                ``,
                `🏷️ *Name:* ${name}`,
                ``,
                `🔵 *HEX:*  ${hex}`,
                `🔴 *RGB:*  rgb(${r}, ${g}, ${b})`,
                `🟡 *HSL:*  hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)`,
                `⚫ *CMYK:* cmyk(${cmyk.c}%, ${cmyk.m}%, ${cmyk.y}%, ${cmyk.k}%)`,
                `🔢 *DEC:*  ${dec}`,
                ``,
                `🖼️ Preview: ${preview}`,
            ];

            return reply(lines.join('\n'));

        } catch (e) {
            return reply(`❌ Could not parse color *"${input}"*\n\nTry:\n• \`.color #FF5733\`\n• \`.color 255,87,51\`\n• \`.color red\``);
        }
    }
};
