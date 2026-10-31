'use strict';

const config = require('../config');
const { setUserSetting } = require('../lib/database');

const lastReactionByChat = new Map();
const REACTION_COOLDOWN_MS = 15000;

function chooseEmoji() {
    const emojis = String(config.CUSTOM_REACT_EMOJIS || '❤️,🔥,💯,👏')
        .split(',').map(item => item.trim()).filter(Boolean);
    return emojis[Math.floor(Math.random() * emojis.length)] || '❤️';
}

module.exports = {
    commands: ['autoreactmessages', 'reactall'],
    description: 'Automatically react to ordinary incoming messages with a safe cooldown',
    usage: '.autoreactmessages on|off|status',
    permission: 'owner',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const action = String(args[0] || 'status').toLowerCase();
        if (action === 'on' || action === 'enable') config.AUTO_REACT_MESSAGES = true;
        else if (action === 'off' || action === 'disable') config.AUTO_REACT_MESSAGES = false;
        else if (action !== 'status') {
            return sock.sendMessage(ctx.sender || ctx.jid, {
                text: 'Usage: .autoreactmessages on|off|status',
                contextInfo: ctx.contextInfo,
            }, { quoted: message });
        }

        const { sender, jid, contextInfo } = ctx;
        void setUserSetting({
            jid: ctx.from || sender || jid,
            key: 'AUTO_REACT_MESSAGES',
            value: Boolean(config.AUTO_REACT_MESSAGES),
        });
        return sock.sendMessage(sender || jid, {
            text: `💬 *Auto-react to messages:* ${config.AUTO_REACT_MESSAGES ? '✅ ON' : '❌ OFF'}\n\nCooldown: one reaction per chat every ${REACTION_COOLDOWN_MS / 1000}s`,
            contextInfo,
        }, { quoted: message });
    },

    onMessage: async (sock, message, text, ctx) => {
        if (!config.AUTO_REACT_MESSAGES || message?.key?.fromMe) return;
        const chat = ctx?.jid || message?.key?.remoteJid;
        if (!chat || chat.endsWith('@newsletter') || message?.key?.remoteJid === 'status@broadcast') return;
        if (!message?.message || !text || /^[.!/]/.test(String(text).trim())) return;

        const now = Date.now();
        const last = lastReactionByChat.get(chat) || 0;
        if (now - last < REACTION_COOLDOWN_MS) return;
        lastReactionByChat.set(chat, now);
        if (lastReactionByChat.size > 1000) {
            const oldest = lastReactionByChat.keys().next().value;
            lastReactionByChat.delete(oldest);
        }

        try {
            await sock.sendMessage(chat, {
                react: { text: chooseEmoji(), key: message.key },
            });
        } catch (error) {
            console.warn(`[AutoReact] reaction failed: ${error.message}`);
        }
    },
};
