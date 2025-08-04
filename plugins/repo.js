const axios = require('axios');
const moment = require('moment');

module.exports = {
    name: 'repo',
    commands: ['repo', 'repository', 'github'],
    handler: async ({ sock, m, sender, contextInfo }) => {
        try {
            const repoOwner = 'SilvaTechB';
            const repoName = 'silva-md-bot';
            const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
            
            // Show loading message with animation
            const loadingMsg = await sock.sendMessage(sender, {
                text: '🔄 Fetching repository details...',
                contextInfo: contextInfo
            }, { quoted: m });

            const { data } = await axios.get(apiUrl);
            const { stargazers_count, forks_count, updated_at, html_url, 
                    description, language, open_issues, license, size } = data;
            
            // Format last updated time
            const lastUpdated = moment(updated_at).fromNow();
            
            // Create fancy ASCII art
            const asciiArt = `
███████╗██╗██╗     ██╗   ██╗ █████╗ 
██╔════╝██║██║     ██║   ██║██╔══██╗
███████╗██║██║     ██║   ██║███████║
╚════██║██║██║     ██║   ██║██╔══██║
███████║██║███████╗╚██████╔╝██║  ██║
╚══════╝╚═╝╚══════╝ ╚═════╝ ╚═╝  ╚═╝
            `;
            
            // Create repository info
            const repoInfo = `
*✨ SILVA MD BOT REPOSITORY*

${asciiArt}

📦 *Repository*: [${repoName}](${html_url})
📝 *Description*: ${description || 'No description provided'}

🌟 *Stars*: ${stargazers_count}
🍴 *Forks*: ${forks_count}
💻 *Language*: ${language || 'Unknown'}
📦 *Size*: ${(size / 1024).toFixed(1)} MB
📜 *License*: ${license?.name || 'None'}
⚠️ *Open Issues*: ${open_issues}
🕒 *Last Updated*: ${lastUpdated}

⚡ *Powered by Silva Tech Inc*
            `;

            // Delete loading message
            if (loadingMsg) {
                await sock.sendMessage(sender, {
                    delete: loadingMsg.key
                });
            }

            // Send repository information with image
            await sock.sendMessage(sender, {
                image: { 
                    url: "https://files.catbox.moe/5uli5p.jpeg" 
                },
                caption: repoInfo,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title: "GitHub Repository",
                        body: "Explore the codebase!",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: html_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
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
