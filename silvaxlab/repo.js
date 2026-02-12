const axios = require('axios');

const handler = {
    help: ['script', 'repo', 'sc'],
    tags: ['main'],
    command: /^(script|repo|sc)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message }) => {
        try {
            const sender = message.key.participant || message.key.remoteJid;
            const repoUrl = "https://github.com/SilvaTechB/silva-md-bot";
            const match = repoUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
            if (!match) throw new Error("Invalid repository URL");

            const [, owner, repo] = match;

            const { data } = await axios.get(`https://api.github.com/repos/${owner}/${repo}`);

            const repoInfo = `
🍑🍆 *SILVA MD BOT* 💦☣

📂 *Repository:* ${data.name}
👤 *Owner:* ${data.owner.login}
⭐ *Stars:* ${data.stargazers_count}
🍴 *Forks:* ${data.forks_count}
🌐 *URL:* ${data.html_url}
📝 *Description:* ${data.description || "No description available"}

🚀 *OUR REPOSITORY*
_Welcome to Silva MD! 🤖✨_

OUR CHANNEL: https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v
OFFICIAL GROUP: https://chat.whatsapp.com/Ik0YpP0dM8jHVjScf1Ay5S
⚡ *DEPLOY SILVA MD BOT NOW!*
\`\`\` USER FRIENDLY SILVA MD BOT 💥 \`\`\`
            `.trim();

            const profilePic = await sock.profilePictureUrl(sender, "image").catch(() => data.owner.avatar_url || '');

            const externalAd = {
                title: "Silva MD Bot Repository",
                body: "Click to visit GitHub",
                thumbnailUrl: data.owner.avatar_url || '',
                sourceUrl: data.html_url,
                showAdAttribution: true
            };

            await sock.sendMessage(jid, { text: repoInfo, contextInfo: { externalAdReply: externalAd } });

            await sock.sendMessage(jid, {
                image: { url: profilePic },
                caption: repoInfo,
                contextInfo: {
                    mentionedJid: [sender],
                    forwardingScore: 999,
                    isForwarded: true,
                    forwardedNewsletterMessageInfo: {
                        newsletterJid: "120363200367779016@newsletter",
                        newsletterName: "SILVA MD BOT REPO💖",
                        serverMessageId: 143
                    }
                }
            });
        } catch (error) {
            console.error(error);
            await sock.sendMessage(jid, { text: "❌ Error fetching repository information. Please try again later." });
        }
    }
};

module.exports = { handler };
