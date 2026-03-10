'use strict';

let afkActive = false;
let afkReason  = 'No reason given';
let afkSince   = 0;

function formatDuration(ms) {
    const s = Math.floor(ms / 1000);
    const m = Math.floor(s / 60);
    const h = Math.floor(m / 60);
    const d = Math.floor(h / 24);
    if (d > 0) return `${d}d ${h % 24}h`;
    if (h > 0) return `${h}h ${m % 60}m`;
    if (m > 0) return `${m}m ${s % 60}s`;
    return `${s}s`;
}

module.exports = {
    commands:    ['afk', 'back'],
    description: 'Owner AFK mode — bot auto-replies to everyone while you are away',
    permission:  'owner',
    group:       true,
    private:     true,

    isAfk:      () => afkActive,
    getAfkData: () => ({ reason: afkReason, since: afkSince }),

    run: async (sock, message, args, ctx) => {
        const { safeSend, contextInfo } = ctx;
        const cmdText = (message.message?.conversation || message.message?.extendedTextMessage?.text || '')
            .trim().split(/\s+/)[0].replace(/^[^a-zA-Z]*/, '').toLowerCase();

        if (cmdText === 'afk') {
            afkActive = true;
            afkReason  = args.join(' ') || 'No reason given';
            afkSince   = Date.now();
            await safeSend({
                text: `🌙 *AFK Mode Activated*\n\n📝 Reason: ${afkReason}\n\n_Anyone who messages will receive an auto-reply until you use .back_`,
                contextInfo
            }, { quoted: message });
            return;
        }

        if (cmdText === 'back') {
            if (!afkActive) {
                await sock.sendMessage(message.key.remoteJid, { text: '✅ AFK mode is not currently active.', contextInfo }, { quoted: message });
                return;
            }
            const duration = formatDuration(Date.now() - afkSince);
            afkActive = false;
            await safeSend({
                text: `🌸 *Welcome back!*\n\n⏱ You were away for *${duration}*.`,
                contextInfo
            }, { quoted: message });
        }
    }
};
