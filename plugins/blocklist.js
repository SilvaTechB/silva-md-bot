'use strict';



module.exports = {
    commands:    ['blocklist', 'listblock'],
    description: 'Show the bot\'s blocked numbers list — owner only',
    permission:  'owner',
    group:       false,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        try {
            const blocklist = await sock.fetchBlocklist();

            if (!blocklist?.length) {
                return sock.sendMessage(sender, {
                    text: '🔓 *No numbers are currently blocked*',
                    contextInfo
                }, { quoted: message });
            }

            let txt      = `🚫 *Blocked Numbers List*\n\n• Total: ${blocklist.length}\n\n┌───⊷\n`;
            const mentions = [];
            for (const num of blocklist) {
                const n = num.split('@')[0];
                txt += `▢ @${n}\n`;
                mentions.push(`${n}@s.whatsapp.net`);
            }
            txt += '└───────────';

            await sock.sendMessage(sender, { text: txt, contextInfo }, { quoted: message });
        } catch (err) {
            console.error('[Blocklist]', err.message);
            await sock.sendMessage(sender, {
                text: `❌ Failed to fetch blocklist: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
