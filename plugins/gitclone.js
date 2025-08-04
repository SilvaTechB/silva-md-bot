// plugins/gitclone.js
const getFetch = async () => {
    const module = await import('node-fetch');
    return module.default;
};

module.exports = {
    name: 'gitclone',
    commands: ['gitclone'],
    handler: async ({ sock, m, sender, args }) => {
        const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
        const usedPrefix = '.'; // Your bot's prefix

        try {
            if (!args[0]) {
                return sock.sendMessage(sender, {
                    text: `where is the github link?\n\n📌 Example : ${usedPrefix}gitclone https://github.com/SilvaTechB/silva-md-bot`,
                    contextInfo: { forwardingScore: 999, isForwarded: true }
                }, { quoted: m });
            }

            if (!regex.test(args[0])) {
                return sock.sendMessage(sender, {
                    text: '⚠️ link incorrect',
                    contextInfo: { forwardingScore: 999, isForwarded: true }
                }, { quoted: m });
            }

            const [_, user, repo] = args[0].match(regex) || [];
            const cleanRepo = repo.replace(/.git$/, '');
            const url = `https://api.github.com/repos/${user}/${cleanRepo}/zipball`;

            await sock.sendMessage(sender, {
                text: '✳️ *Wait, sending repository..*',
                contextInfo: { forwardingScore: 999, isForwarded: true }
            }, { quoted: m });

            // Dynamically import node-fetch
            const fetch = await getFetch();
            
            const response = await fetch(url, { method: 'HEAD' });
            const contentDisposition = response.headers.get('content-disposition');
            const filename = contentDisposition.match(/attachment; filename=(.*)/)[1];

            await sock.sendMessage(sender, {
                document: { url: url },
                fileName: filename,
                mimetype: 'application/zip',
                caption: `✅ GitHub Repository Downloaded\n\n📦 *${user}/${cleanRepo}*`,
                contextInfo: {
                    forwardingScore: 999,
                    isForwarded: true,
                    externalAdReply: {
                        title: "GitHub Clone",
                        body: "Powered by Silva MD Bot",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: `https://github.com/${user}/${cleanRepo}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error('GitClone Error:', error);
            sock.sendMessage(sender, {
                text: '❌ Failed to download repository\n' + error.message,
                contextInfo: { forwardingScore: 999, isForwarded: true }
            }, { quoted: m });
        }
    }
};
