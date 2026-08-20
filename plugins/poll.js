'use strict';

if (!global.pollRegistry) global.pollRegistry = new Map();

module.exports = {
    commands:    ['poll', 'vote', 'multipoll'],
    description: 'Create a WhatsApp native poll — single or multi-select',
    usage:       '.poll Question | Option1 | Option2 | ...\n.multipoll Question | Option1 | Option2 | ...',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, contextInfo } = ctx;

        if (!isAdmin) {
            return sock.sendMessage(jid, {
                text: '⛔ Only admins can create polls.',
                contextInfo
            }, { quoted: message });
        }

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const isMulti = rawCmd === 'multipoll';

        const input = args.join(' ').trim();
        if (!input) {
            return sock.sendMessage(jid, {
                text:
                    `📊 *Poll Creator*\n\n` +
                    `*Single-select (1 vote each):*\n` +
                    `\`.poll Question | Option1 | Option2 | ...\`\n\n` +
                    `*Multi-select (pick multiple):*\n` +
                    `\`.multipoll Question | Option1 | Option2 | ...\`\n\n` +
                    `*Example:*\n` +
                    `\`.poll Best fruit? | Apple | Mango | Banana | Grape\`\n\n` +
                    `_After creating: reply to the poll with \`.pollresult\` to see live votes._`,
                contextInfo
            }, { quoted: message });
        }

        const parts = input.split('|').map(s => s.trim()).filter(Boolean);
        if (parts.length < 3) {
            return sock.sendMessage(jid, {
                text: '❌ You need a question and at least *2 options*.\n\nExample: `.poll Best fruit? | Apple | Mango | Banana`',
                contextInfo
            }, { quoted: message });
        }

        const [question, ...options] = parts;
        if (options.length > 12) {
            return sock.sendMessage(jid, {
                text: '❌ Maximum *12 options* allowed.',
                contextInfo
            }, { quoted: message });
        }

        // selectableCount: 0 = unlimited (multi-select), 1 = single
        const selectableCount = isMulti ? 0 : 1;

        const sent = await sock.sendMessage(jid, {
            poll: {
                name:            question,
                values:          options,
                selectableCount,
            }
        });

        // Register in global poll tracker for .pollresult tracking
        if (sent?.key?.id) {
            const pollMsg = sent.message?.pollCreationMessageV3
                         || sent.message?.pollCreationMessageV2
                         || sent.message?.pollCreationMessage;
            const msgType = sent.message?.pollCreationMessageV3 ? 'pollCreationMessageV3'
                          : sent.message?.pollCreationMessageV2 ? 'pollCreationMessageV2'
                          : 'pollCreationMessage';

            global.pollRegistry.set(sent.key.id, {
                jid,
                question,
                options,
                isMulti,
                msgType,
                pollCreationMessage: pollMsg,
                pollUpdates:         [],
                meId:                sock.user?.id || '',
                announceResults:     false,
                createdAt:           Date.now(),
            });
        }
    }
};
