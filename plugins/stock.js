'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['stock', 'stockprice', 'shares'],
    description: 'Get live stock price from Yahoo Finance',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId = groupId || sender;
        const symbol = (args[0] || '').toUpperCase();
        if (!symbol) {
            return sock.sendMessage(chatId, {
                text: '📈 Usage: .stock <symbol>\nExamples: .stock AAPL  .stock TSLA  .stock AMZN',
                contextInfo
            }, { quoted: message });
        }
        try {
            const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?interval=1d&range=1d`;
            const { data } = await axios.get(url, {
                timeout: 10000,
                headers: { 'User-Agent': 'Mozilla/5.0' }
            });
            const meta   = data?.chart?.result?.[0]?.meta;
            if (!meta) throw new Error(`Symbol "${symbol}" not found.`);
            const price  = meta.regularMarketPrice?.toFixed(2);
            const prev   = meta.chartPreviousClose?.toFixed(2);
            const change = (price - prev).toFixed(2);
            const pct    = ((change / prev) * 100).toFixed(2);
            const emoji  = change >= 0 ? '📈' : '📉';
            await sock.sendMessage(chatId, {
                text:
`${emoji} *${symbol} — ${meta.longName || meta.symbol}*

💰 *Price:*  $${price}
${emoji} *Change:* ${change >= 0 ? '+' : ''}${change} (${pct}%)
📊 *52W High:* $${meta.fiftyTwoWeekHigh?.toFixed(2) || 'N/A'}
📊 *52W Low:*  $${meta.fiftyTwoWeekLow?.toFixed(2)  || 'N/A'}
💱 *Currency:* ${meta.currency}
🏛️ *Exchange:* ${meta.exchangeName}

_Powered by Yahoo Finance • Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(chatId, { text: `❌ Stock lookup failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
