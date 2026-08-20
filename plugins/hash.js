'use strict';
const crypto = require('crypto');

module.exports = {
    commands:    ['hash', 'md5', 'sha256', 'sha1'],
    description: 'Generate MD5, SHA1, SHA256 hashes',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, prefix, contextInfo }) => {
        const cmd  = message.body?.split(' ')[0]?.replace(prefix, '').toLowerCase();
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(sender, {
                text: `🔐 Please provide text to hash.\nExample: .${cmd} hello world`,
                contextInfo
            }, { quoted: message });
        }
        const algorithms = cmd === 'md5' ? ['md5'] : cmd === 'sha1' ? ['sha1'] : cmd === 'sha256' ? ['sha256'] : ['md5', 'sha1', 'sha256', 'sha512'];
        const results = algorithms.map(alg => {
            const h = crypto.createHash(alg).update(text).digest('hex');
            return `*${alg.toUpperCase()}:*\n${h}`;
        });
        await sock.sendMessage(sender, {
            text: `🔐 *Hash Generator*\n\n📝 Input: \`${text}\`\n\n${results.join('\n\n')}\n\n_Powered by Silva MD_`,
            contextInfo
        }, { quoted: message });
    }
};
