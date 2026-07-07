'use strict';

const axios = require('axios');
const { fmt } = require('../lib/theme');

const SESSION_SERVER = 'https://session.silvatech.co.ke';

async function fetchPairCode(phoneNumber) {
    const clean = String(phoneNumber).replace(/\D/g, '');
    if (clean.length < 7) throw new Error('Invalid phone number');
    const res = await axios.get(`${SESSION_SERVER}/code`, {
        params:  { number: clean },
        timeout: 15000,
        headers: { 'User-Agent': 'SilvaMD-Bot/2.0' }
    });
    const code = res.data?.code || res.data?.pairCode || res.data?.pair_code;
    if (!code) throw new Error('No code returned from server');
    return { code, number: clean };
}

module.exports = {
    commands:    ['getcode', 'paircode', 'getpair', 'sessioncode', 'connectbot'],
    description: 'Fetch a WhatsApp pair code from the Silva session server to connect your bot',
    usage:       '.getcode 2547XXXXXXXX',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { sender, jid, contextInfo, reply } = ctx;

        // Number can come from args or be inferred from sender
        let rawNumber = args.join('').replace(/\D/g, '');

        // If no number given, show usage
        if (!rawNumber) {
            return reply(fmt(
                `🔗 *Get WhatsApp Pair Code*\n\n` +
                `Enter your phone number (with country code) to get a pair code from the Silva session server.\n\n` +
                `*Usage:*\n` +
                `• \`.getcode 2547XXXXXXXX\`\n` +
                `• \`.getcode +1 555 000 1234\`\n\n` +
                `*How to use the code:*\n` +
                `1️⃣ Open WhatsApp → Linked Devices\n` +
                `2️⃣ Tap *Link with phone number*\n` +
                `3️⃣ Enter the 8-character code shown\n\n` +
                `_Codes expire in 60 seconds — enter it quickly!_\n\n` +
                `🌐 Or visit: ${SESSION_SERVER}`
            ));
        }

        await reply(fmt(`⏳ Fetching pair code for +${rawNumber}…`));

        try {
            const { code, number } = await fetchPairCode(rawNumber);

            // Format code as XXXX-XXXX for readability
            const formatted = code.length === 8
                ? `${code.slice(0, 4)}-${code.slice(4)}`
                : code;

            const text = fmt(
                `🔗 *WhatsApp Pair Code*\n\n` +
                `📞 *Number:* +${number}\n` +
                `🔑 *Pair Code:*\n\n` +
                `┌──────────────┐\n` +
                `│  \`${formatted}\`  │\n` +
                `└──────────────┘\n\n` +
                `*How to link:*\n` +
                `1️⃣ Open WhatsApp → *Linked Devices*\n` +
                `2️⃣ Tap *Link with phone number*\n` +
                `3️⃣ Enter the code above\n\n` +
                `⚠️ _Code expires in ~60 seconds. Enter it immediately!_\n\n` +
                `🌐 *Session server:* ${SESSION_SERVER}\n` +
                `_Powered by Silva MD_`
            );

            // Send to DM for privacy (not in group)
            if (jid?.endsWith('@g.us')) {
                await sock.sendMessage(sender, { text: text, contextInfo }, { quoted: message });
                await reply(fmt(`✅ Pair code sent to your DM — check it there.`));
            } else {
                await sock.sendMessage(jid, { text: text, contextInfo }, { quoted: message });
            }

        } catch (err) {
            const msg = err.response?.status === 429
                ? '⚠️ Rate limited — wait a moment then try again.'
                : `❌ Failed to fetch pair code: ${err.message}\n\nTry visiting ${SESSION_SERVER} directly.`;
            reply(fmt(msg));
        }
    }
};
