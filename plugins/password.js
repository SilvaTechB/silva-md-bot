'use strict';

module.exports = {
    commands:    ['password', 'passwd', 'genpass'],
    description: 'Generate a strong random password',
    usage:       '.password [length]  default length is 16',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        const len = Math.min(Math.max(parseInt(args[0]) || 16, 6), 64);
        const upper  = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
        const lower  = 'abcdefghijklmnopqrstuvwxyz';
        const digits = '0123456789';
        const syms   = '!@#$%^&*()-_=+[]{}|;:,.<>?';
        const all    = upper + lower + digits + syms;

        let pwd = [
            upper[Math.floor(Math.random() * upper.length)],
            lower[Math.floor(Math.random() * lower.length)],
            digits[Math.floor(Math.random() * digits.length)],
            syms[Math.floor(Math.random() * syms.length)],
        ];
        for (let i = pwd.length; i < len; i++) {
            pwd.push(all[Math.floor(Math.random() * all.length)]);
        }
        pwd = pwd.sort(() => Math.random() - 0.5).join('');

        const strength = len >= 20 ? '🟢 Very Strong' : len >= 14 ? '🟡 Strong' : len >= 10 ? '🟠 Moderate' : '🔴 Weak';

        await sock.sendMessage(jid, {
            text:
                `🔐 *Password Generator*\n\n` +
                `\`\`\`${pwd}\`\`\`\n\n` +
                `📏 *Length:* ${len} characters\n` +
                `💪 *Strength:* ${strength}\n\n` +
                `> ⚠️ _Never share your passwords with anyone_`,
            contextInfo
        }, { quoted: message });
    }
};
