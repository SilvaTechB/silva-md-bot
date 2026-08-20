'use strict';

const { getStr } = require('../lib/theme');
const GH_REGEX = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;

module.exports = {
    commands:    ['gitclone'],
    description: 'Download a GitHub repository as a ZIP file',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        if (!args[0]) {
            return sock.sendMessage(sender, {
                text: `❌ Please provide a GitHub URL.\nExample: .gitclone https://github.com/SilvaTechB/silva-md-bot`,
                contextInfo
            }, { quoted: message });
        }

        if (!GH_REGEX.test(args[0])) {
            return sock.sendMessage(sender, {
                text: '⚠️ Invalid GitHub link.',
                contextInfo
            }, { quoted: message });
        }

        const [, user, repo] = args[0].match(GH_REGEX);
        const cleanRepo = repo.replace(/\.git$/, '');
        const url = `https://api.github.com/repos/${user}/${cleanRepo}/zipball`;

        await sock.sendMessage(sender, {
            text: '✳️ Fetching repository, please wait...',
            contextInfo
        }, { quoted: message });

        try {
            const fetch    = (await import('node-fetch')).default;
            const response = await fetch(url, { method: 'HEAD' });
            const cd       = response.headers.get('content-disposition') || '';
            const filename = cd.match(/attachment; filename=(.*)/)?.[1] || `${cleanRepo}.zip`;

            await sock.sendMessage(sender, {
                document: { url },
                fileName: filename,
                mimetype: 'application/zip',
                caption:  `📦 *${user}/${cleanRepo}*\n_Downloaded via ${getStr('botName') || 'Silva MD'}_`,
                contextInfo
            }, { quoted: message });
        } catch (err) {
            console.error('[GitClone]', err.message);
            await sock.sendMessage(sender, {
                text: `❌ Failed to download repository.\n${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
