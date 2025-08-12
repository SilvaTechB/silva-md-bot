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
            // Send loading message without quoted reference
            await safeSend(sock, jid, {
                text: '🔄 Fetching repository details...'
            });

            // Get GitHub data with timeout
            const { data } = await axios.get(apiUrl, { timeout: 5000 });
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
            
            // Create repository info
            const repoInfo = `
*✨ SILVA MD BOT REPOSITORY*

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

            // Send repository information with fallback
            try {
                await safeSend(sock, jid, {
                    image: { 
                        url: "https://files.catbox.moe/5uli5p.jpeg" 
                    },
                    caption: repoInfo,
                    contextInfo: {
                        externalAdReply: {
                            title: "GitHub Repository",
                            body: "Explore the codebase!",
                            sourceUrl: html_url,
                            mediaType: 1
                        }
                    }
                });
            } catch (imageError) {
                console.warn('Image send failed, sending text only');
                await safeSend(sock, jid, { text: repoInfo });
            }

        } catch (error) {
            console.error('Repo Plugin Error:', error.message || error);
            
            // Simple error message without quoted reference
            await safeSend(sock, jid, {
                text: '❌ Failed to fetch repo details. Please try again later.'
            });
        }
    }
};
