const axios = require('axios');
const moment = require('moment');

module.exports = {
    commands: ['repo', 'repository', 'github'],
    description: 'Show SILVA MD BOT repository information',
    group: true,
    private: true,
    admin: false,
    
    async run(sock, message, args, context) {
        const { jid, safeSend } = context;
        const quoted = message;
        const repoOwner = 'SilvaTechB';
        const repoName = 'silva-md-bot';
        const apiUrl = `https://api.github.com/repos/${repoOwner}/${repoName}`;
        
        try {
            // Send loading message
            const loadingMsg = await safeSend(sock, jid, {
                text: '🔄 Fetching repository details...'
            }, { quoted });

            // Get GitHub data
            const { data } = await axios.get(apiUrl);
            const { 
                stargazers_count, 
                forks_count, 
                updated_at, 
                html_url, 
                description, 
                language, 
                open_issues, 
                license, 
                size 
            } = data;
            
            // Format last updated time
            const lastUpdated = moment(updated_at).fromNow();
            
            // Create ASCII art
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

            // Delete loading message if possible
            if (loadingMsg) {
                try {
                    await sock.sendMessage(jid, {
                        delete: loadingMsg.key
                    });
                } catch (deleteError) {
                    console.warn('Could not delete loading message:', deleteError.message);
                }
            }

            // Send repository information
            await safeSend(sock, jid, {
                image: { 
                    url: "https://files.catbox.moe/5uli5p.jpeg" 
                },
                caption: repoInfo,
                contextInfo: {
                    externalAdReply: {
                        title: "GitHub Repository",
                        body: "Explore the codebase!",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: html_url,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted });

        } catch (error) {
            console.error('Repo Plugin Error:', error.stack || error);
            await safeSend(sock, jid, {
                text: '❌ Failed to fetch repo details. Please try again later.'
            }, { quoted });
        }
    }
};
