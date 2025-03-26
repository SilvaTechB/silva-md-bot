import axios from 'axios';

const handler = async (m, { conn }) => {
    const githubRepoURL = 'https://github.com/SilvaTechB/silva-md-bot';
    
    try {
        const match = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
        if (!match) throw new Error('Invalid repository URL');
        
        const [_, username, repoName] = match;
        const { data: repoData } = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);
        
        const formattedInfo = `
        🍑🍆 *SILVA MD BOT* 💦☣
        
📂 *Repository:* ${repoData.name}
📝 *Description:* ${repoData.description || 'No description available'}
👤 *Owner:* ${repoData.owner.login}
⭐ *Stars:* ${repoData.stargazers_count}
🍴 *Forks:* ${repoData.forks_count}
🌐 *URL:* ${repoData.html_url}
        
🚀 *OUR REPOSITORY*
_Welcome to Silva MD! 🤖✨_

🔥 **Get Started:** Fork and customize Silva MD WhatsApp bot!

📌 **How to Use:**
1️⃣ *Fork the Repository* – Click “Fork” to create your copy.
2️⃣ *Setup Your Bot* – Follow the README instructions.
3️⃣ *Enjoy Silva MD* – Experience its powerful features! 💬

⚡ *DEPLOY SILVA MD BOT NOW!*
\`\`\` USER FRIENDLY SILVA MD BOT 💥 \`\`\`
        `.trim();

        const userProfilePic = await conn.profilePictureUrl(m.sender, 'image').catch(() => repoData.owner.avatar_url);

        await conn.sendMessage(m.chat, {
            text: formattedInfo,
            contextInfo: {
                externalAdReply: {
                    title: 'Silva MD Bot Repository',
                    body: 'Click to visit GitHub',
                    thumbnailUrl: repoData.owner.avatar_url,
                    sourceUrl: repoData.html_url,
                    showAdAttribution: true
                }
            }
        });

        await conn.sendMessage(m.chat, {
            image: { url: userProfilePic },  
            caption: formattedInfo,
            contextInfo: {
                mentionedJid: [m.sender],
                forwardingScore: 999,
                isForwarded: true,
                forwardedNewsletterMessageInfo: {
                    newsletterJid: '120363200367779016@newsletter',
                    newsletterName: 'SILVA MD BOT REPO💖',
                    serverMessageId: 143
                }
            }
        });
    } catch (error) {
        console.error(error);
        await conn.reply(m.chat, '❌ Error fetching repository information. Please try again later.', m);
    }
};

handler.help = ['script'];
handler.tags = ['main'];
handler.command = ['sc', 'repo', 'script'];

export default handler;
