'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['color', 'colorinfo', 'hex'],
    description: 'Get color information from a HEX code',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        let hex = (args[0] || '').replace('#', '').trim();
        if (!hex || !/^[0-9a-fA-F]{3,6}$/.test(hex)) {
            return sock.sendMessage(sender, {
                text: '🎨 Please provide a valid HEX color.\nExample: .color ff5733',
                contextInfo
            }, { quoted: message });
        }
        if (hex.length === 3) hex = hex.split('').map(c => c + c).join('');
        try {
            const { data } = await axios.get(`https://www.thecolorapi.com/id?hex=${hex}`, { timeout: 10000 });
            const r = data.rgb.r, g = data.rgb.g, b = data.rgb.b;
            const hsl = data.hsl;
            const imageUrl = `https://singlecolorimage.com/get/${hex}/200x200`;
            await sock.sendMessage(sender, {
                image:   { url: imageUrl },
                caption:
`🎨 *Color Info*

▸ *Name:*  ${data.name.value}
▸ *HEX:*   #${hex.toUpperCase()}
▸ *RGB:*   rgb(${r}, ${g}, ${b})
▸ *HSL:*   hsl(${hsl.h}°, ${hsl.s}%, ${hsl.l}%)
▸ *Closest:* ${data.name.closest_named_hex}

_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Color lookup failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
