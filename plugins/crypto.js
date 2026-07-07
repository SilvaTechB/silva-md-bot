'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['crypto', 'coin', 'price'],
    description: 'Get live cryptocurrency prices',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const coins  = (args[0] || 'bitcoin,ethereum,solana').toLowerCase().replace(/\s+/g, ',');
        try {
            const { data } = await axios.get(
                `https://api.coingecko.com/api/v3/simple/price?ids=${coins}&vs_currencies=usd&include_24hr_change=true`,
                { timeout: 10000 }
            );
            if (!Object.keys(data).length) throw new Error('No coins found. Check the coin name.');
            const lines = Object.entries(data).map(([coin, v]) => {
                const price  = v.usd.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
                const change = v.usd_24h_change?.toFixed(2);
                const emoji  = change >= 0 ? '📈' : '📉';
                return `${emoji} *${coin.toUpperCase()}:* ${price}  (${change >= 0 ? '+' : ''}${change}% 24h)`;
            });
            await sock.sendMessage(chatId, {
                text: `💰 *Crypto Prices*\n\n${lines.join('\n')}\n\n_Powered by CoinGecko • Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ Crypto lookup failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
