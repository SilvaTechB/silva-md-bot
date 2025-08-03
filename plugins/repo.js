const axios = require('axios');

module.exports = {
    commands: ['repo'],
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            const repoOwner = 'SilvaTechB';
            const repoName = 'silva-md-bot';
            const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;

            const { data } = await axios.get(apiUrl);
            const { stargazers_count, forks_count, updated_at, html_url } = data;

            const lastUpdated = new Date(updated_at).toLocaleString('en-US', { timeZone: 'UTC' });

            const repoText = `*📦 Silva MD Bot Repository*\n\n` +
                `✅ Repo: ${html_url}\n\n` +
                `⭐ Stars: *${stargazers_count}*\n` +
                `🍴 Forks: *${forks_count}*\n` +
                `🕒 Last Updated: *${lastUpdated} (UTC)*\n\n` +
                `⚡ Powered by Silva Tech Inc`;

            await sock.sendMessage(sender, {
                text: repoText,
                contextInfo: contextInfo
            }, { quoted: m });
        } catch (error) {
            console.error('❌ Repo Plugin Error:', error);
            await sock.sendMessage(sender, {
                text: '❌ Failed to fetch repo details. Please try again later.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};