'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

const COIN_ALIASES = {
    btc: 'bitcoin', eth: 'ethereum', bnb: 'binancecoin',
    xrp: 'ripple', ada: 'cardano', sol: 'solana',
    doge: 'dogecoin', dot: 'polkadot', matic: 'matic-network',
    ltc: 'litecoin', shib: 'shiba-inu', avax: 'avalanche-2',
    link: 'chainlink', uni: 'uniswap', atom: 'cosmos',
    xlm: 'stellar', algo: 'algorand', near: 'near',
    trx: 'tron', xmr: 'monero', usdt: 'tether', usdc: 'usd-coin',
};

module.exports = {
    commands:    ['crypto', 'coin', 'price', 'btc', 'eth', 'doge'],
    description: 'Live cryptocurrency prices and stats',
    usage:       '.crypto [coin]  |  .price [coin]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        // If command IS a coin shortcut (btc, eth, doge) use it as the coin
        let input = args[0]?.toLowerCase() || rawCmd;

        // Resolve aliases
        const coinId = COIN_ALIASES[input] || input;

        if (!coinId || ['crypto', 'coin', 'price'].includes(coinId)) {
            const topCoins = Object.entries(COIN_ALIASES).slice(0, 12).map(([k]) => `.crypto ${k}`).join('\n');
            return reply(`❌ *Usage:* \`.crypto [coin]\`\n\nExamples:\n${topCoins}\n\n_Or use a full CoinGecko ID like_ \`.crypto bitcoin\``);
        }

        try {
            const res = await axios.get(`https://api.coingecko.com/api/v3/coins/${coinId}`, {
                params: { localization: false, tickers: false, community_data: false, developer_data: false },
                timeout: 12000
            });

            const d    = res.data;
            const m    = d.market_data;
            const usd  = (n) => n != null ? `$${Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 6 })}` : 'N/A';
            const pct  = (n) => n != null ? `${n > 0 ? '📈 +' : '📉 '}${Number(n).toFixed(2)}%` : 'N/A';

            const price   = m.current_price?.usd;
            const change1 = m.price_change_percentage_1h_in_currency?.usd;
            const change24 = m.price_change_percentage_24h;
            const change7  = m.price_change_percentage_7d;

            const lines = [
                `💰 *${d.name} (${d.symbol?.toUpperCase()})*`,
                ``,
                `💵 *Price:* ${usd(price)}`,
                ``,
                `📊 *Price Change:*`,
                `  • 1h:  ${pct(change1)}`,
                `  • 24h: ${pct(change24)}`,
                `  • 7d:  ${pct(change7)}`,
                ``,
                `🏦 Market Cap: ${usd(m.market_cap?.usd)}`,
                `📦 24h Volume: ${usd(m.total_volume?.usd)}`,
                `🔄 Circulating: ${m.circulating_supply ? Number(m.circulating_supply).toLocaleString() + ' ' + d.symbol?.toUpperCase() : 'N/A'}`,
                ``,
                `🔺 All-Time High: ${usd(m.ath?.usd)}`,
                `🔻 All-Time Low:  ${usd(m.atl?.usd)}`,
                ``,
                `🌐 Rank: #${d.market_cap_rank || 'N/A'}`,
                `🔗 coingecko.com/en/coins/${d.id}`,
            ];

            return reply(lines.join('\n'));

        } catch (e) {
            if (e.response?.status === 404) return reply(`❌ Coin *"${input}"* not found.\n\nTry the full name: \`.crypto bitcoin\``);
            if (e.response?.status === 429) return reply('⚠️ Rate limit hit — please wait 60 seconds and try again.');
            return reply(`❌ Crypto lookup failed: ${e.message}`);
        }
    }
};
