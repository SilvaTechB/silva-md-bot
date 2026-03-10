'use strict';

const { TempMail } = require('tempmail.lol');

module.exports = {
    commands:    ['tempmail', 'tmpmail', 'fakemail', 'disposable'],
    description: 'Generate a temporary disposable email address and check its inbox',
    usage:       '.tempmail | .tempmail inbox <address>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const sub = (args[0] || '').toLowerCase();

        if (sub === 'inbox') {
            const address = args[1]?.trim();
            if (!address || !address.includes('@')) {
                return sock.sendMessage(jid, {
                    text: '❌ Provide the full email address.\n\nUsage: `.tempmail inbox you@domain.com`',
                    contextInfo
                }, { quoted: message });
            }

            try {
                const mail  = new TempMail();
                const inbox = await mail.getInbox(address);
                if (!inbox?.length) {
                    return sock.sendMessage(jid, { text: `📭 *Inbox for* \`${address}\`\n\nNo messages yet.`, contextInfo }, { quoted: message });
                }

                const items = inbox.slice(0, 5).map((m, i) =>
                    `*${i + 1}.* From: ${m.sender}\n   Subject: ${m.subject || '(no subject)'}`
                ).join('\n\n');

                await sock.sendMessage(jid, {
                    text: `📬 *Inbox for* \`${address}\` (${inbox.length} message${inbox.length > 1 ? 's' : ''})\n\n${items}`,
                    contextInfo
                }, { quoted: message });

            } catch (e) {
                await sock.sendMessage(jid, { text: `❌ Failed to fetch inbox: ${e.message}`, contextInfo }, { quoted: message });
            }

        } else {
            try {
                const mail    = new TempMail();
                const account = await mail.createAddress();
                const address = account.address || account.email || JSON.stringify(account);

                await sock.sendMessage(jid, {
                    text: [
                        `📧 *Temporary Email Generated*`,
                        ``,
                        `\`${address}\``,
                        ``,
                        `• Tap to copy the address above`,
                        `• Check inbox: \`.tempmail inbox ${address}\``,
                        ``,
                        `⚠️ This address is temporary — do not use for important accounts.`
                    ].join('\n'),
                    contextInfo
                }, { quoted: message });

            } catch (e) {
                await sock.sendMessage(jid, { text: `❌ Failed to create temp email: ${e.message}`, contextInfo }, { quoted: message });
            }
        }
    }
};
