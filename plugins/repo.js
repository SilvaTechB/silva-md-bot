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
            // Send processing notification
            const loadingMsg = await safeSend({
                text: '🔄 Fetching repository details...'
            });

            // Get GitHub data
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

📦 *Repository*: ${repoName}
🔗 *URL*: ${html_url}
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

            // Send repository information
            await safeSend({
                text: repoInfo
            });

        } catch (error) {
            console.error('Repo Plugin Error:', error.message || error);
            
            // Simplified error message
            await safeSend({
                text: '❌ Failed to fetch repo details. Please try again later.'
            });
        }
    }
};
