'use strict';
const axios = require('axios');

// numbersapi.com is dead (ECONNREFUSED / timeout) — removed.
// Using uselessfacts.jsph.pl (confirmed working 2026-06) as primary,
// with a local number-facts bank as fallback.

const NUMBER_FACTS = {
    0:   '0 is the only number that is neither positive nor negative.',
    1:   '1 is the only number that is its own factorial: 1! = 1.',
    2:   '2 is the only even prime number.',
    3:   '3 is the first odd prime number.',
    7:   '7 is considered the most popular "lucky number" in the world.',
    13:  '13 is considered an unlucky number in Western cultures.',
    42:  '42 is the "Answer to the Ultimate Question of Life" per Hitchhiker\'s Guide to the Galaxy.',
    0:   '0 was one of the last numbers to be formally accepted in mathematics.',
    100: '100 is the basis of percentages and a perfect square (10²).',
    365: '365 is the number of days in a common year.',
    666: '666 is known as the "Number of the Beast" from the Book of Revelation.',
    1000: '1000 is called a "millennium" when used for years.',
    pi:  '3.14159… — Pi has been calculated to over 100 trillion decimal places.',
};

module.exports = {
    commands:    ['numberfact', 'numfact', 'number'],
    description: 'Get an interesting fact about a number',
    usage:       '.numberfact <number>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        const rawNum = args[0];
        const num    = rawNum && !isNaN(parseInt(rawNum)) ? parseInt(rawNum) : null;

        await sock.sendPresenceUpdate('composing', jid);

        // Check local bank for specific numbers first
        if (num !== null && NUMBER_FACTS[num]) {
            return sock.sendMessage(jid, {
                text: `🔢 *Number Fact: ${num}*\n\n${NUMBER_FACTS[num]}`,
                contextInfo
            }, { quoted: message });
        }

        // 1. Try uselessfacts.jsph.pl (confirmed working 2026-06) for random facts
        try {
            const res = await axios.get(
                'https://uselessfacts.jsph.pl/api/v2/facts/random',
                { headers: { 'Accept': 'application/json', 'User-Agent': 'SilvaMD-Bot/2.0' }, timeout: 8000 }
            );
            const fact = res.data?.text;
            if (fact) {
                const label = num !== null ? `Number ${num}` : 'Random';
                return sock.sendMessage(jid, {
                    text: `🔢 *${label} Fact*\n\n${fact}\n\n_Source: uselessfacts.jsph.pl_`,
                    contextInfo
                }, { quoted: message });
            }
        } catch {}

        // 2. Fallback: generate a mathematical fact about the number
        if (num !== null) {
            const facts = [];
            if (num % 2 === 0) facts.push(`${num} is an even number.`);
            else facts.push(`${num} is an odd number.`);
            if (isPrime(num)) facts.push(`${num} is a prime number.`);
            if (Number.isInteger(Math.sqrt(num)) && num > 0) facts.push(`${num} is a perfect square (√${num} = ${Math.sqrt(num)}).`);
            const digits = String(num).split('').reduce((a, b) => a + parseInt(b), 0);
            facts.push(`The digit sum of ${num} is ${digits}.`);
            return sock.sendMessage(jid, {
                text: `🔢 *Number: ${num}*\n\n${facts.join('\n')}`,
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(jid, {
            text: `❌ Couldn't fetch a number fact. Try: \`.numberfact 42\``,
            contextInfo
        }, { quoted: message });
    }
};

function isPrime(n) {
    if (n < 2) return false;
    if (n === 2) return true;
    if (n % 2 === 0) return false;
    for (let i = 3; i <= Math.sqrt(n); i += 2) if (n % i === 0) return false;
    return true;
}
