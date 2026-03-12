'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['urban', 'ud', 'slang', 'urbandict'],
    description: 'Look up any word or phrase on Urban Dictionary',
    usage:       '.urban [word or phrase]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const term = args.join(' ').trim();
        if (!term) return reply('❌ *Usage:* `.urban [word]`\n\nExample: `.urban slay`');

        try {
            const res = await axios.get('https://api.urbandictionary.com/v0/define', {
                params: { term },
                timeout: 10000
            });

            const list = res.data?.list;
            if (!list || list.length === 0) return reply(`❌ No Urban Dictionary results found for *"${term}"*`);

            const top = list[0];

            // Clean up [brackets] used for links in UD definitions
            const clean = (str = '') => str.replace(/\[([^\]]+)\]/g, '$1').trim();

            const definition = clean(top.definition).slice(0, 800);
            const example    = clean(top.example).slice(0, 400);
            const thumbsUp   = top.thumbs_up || 0;
            const thumbsDown = top.thumbs_down || 0;
            const author     = top.author || 'Unknown';

            const lines = [
                `📖 *Urban Dictionary*`,
                `🔍 *${term}*`,
                ``,
                `📝 *Definition:*`,
                definition,
            ];

            if (example) {
                lines.push('', `💬 *Example:*`, example);
            }

            lines.push(
                '',
                `👍 ${thumbsUp.toLocaleString()}  👎 ${thumbsDown.toLocaleString()}`,
                `✍️ by ${author}`
            );

            return reply(lines.join('\n'));

        } catch (e) {
            return reply(`❌ Urban Dictionary lookup failed: ${e.message}`);
        }
    }
};
