'use strict';

const { fmt } = require('../lib/theme');

// Track the last bot-sent message per chat so .edit can find it
if (!global.lastBotMsg) global.lastBotMsg = new Map();

module.exports = {
    commands:    ['edit', 'editmsg', 'correct'],
    description: 'Edit a previously sent bot message (reply to the bot\'s message)',
    usage:       'Reply to a bot message + .edit New text here',
    permission:  'admin',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isOwner, contextInfo, reply } = ctx;

        if (!isAdmin && !isOwner) return reply(fmt('⛔ Only admins can edit bot messages.'));

        const newText = args.join(' ').trim();
        if (!newText) {
            return reply(fmt(
                `✏️ *Edit Bot Message*\n\n` +
                `Reply to any message the bot sent, then:\n` +
                `\`.edit The corrected text here\``
            ));
        }

        // Get the quoted message key (must be a message the bot sent)
        const ctxInfo    = message.message?.extendedTextMessage?.contextInfo;
        const stanzaId   = ctxInfo?.stanzaId;
        const participant = ctxInfo?.participant;

        if (!stanzaId) {
            // Try the last bot message for this chat
            const lastKey = global.lastBotMsg?.get(jid);
            if (!lastKey) {
                return reply(fmt('❌ Reply to a bot message to edit it, or send a message first.'));
            }
            try {
                await sock.sendMessage(jid, {
                    text: fmt(newText),
                    edit: lastKey,
                });
                return;
            } catch (err) {
                return reply(fmt(`❌ Edit failed: ${err.message}`));
            }
        }

        // Build the key of the quoted message
        const editKey = {
            remoteJid:   jid,
            fromMe:      !participant, // bot's own messages have fromMe=true
            id:          stanzaId,
            participant: participant || undefined,
        };

        try {
            await sock.sendMessage(jid, {
                text: fmt(newText),
                edit: editKey,
            });
        } catch (err) {
            reply(fmt(`❌ Could not edit — make sure you replied to a *bot* message.\n\n${err.message}`));
        }
    }
};
