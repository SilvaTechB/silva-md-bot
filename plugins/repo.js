import { promises } from 'fs';
import { join } from 'path';
import axios from 'axios'; 

let handler = async function (m, { conn, __dirname }) {
const githubRepoURL = 'https://github.com/SilvaTechB/silva-md-bot';
  try {
const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);
if (response.status === 200) {
const repoData = response.data;
const formattedInfo = `
🍑🍆𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓💦☣
*This is a Horny WhatsApp Bot Loaded with Features 🎊*
𝖲𝖳𝖠𝖱✨ :: ${repoData.stargazers_count}
𝖥𝖮𝖱𝖪 🍽️ :: ${repoData.forks_count}
𝖴𝖱𝖫 👻 :: ${repoData.html_url}
\`🚀 Key Features\`
*Automated Messaging:*
*Media Sharing ::*
*Chat Management :*
*Interactive Features::*
*Custom Commands::*.
> Trying to make it a usee friendly bot

*_DEPLOY 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 NOW_*

\`\`\`Enhance your WhatsApp experience with 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓💥\`\`\`
        `.trim();
        
      await conn.relayMessage(m.chat,  {
        requestPaymentMessage: {
          currencyCodeIso4217: 'INR',
          amount1000: 69000,
          requestFrom: m.sender,
          noteMessage: {
          extendedTextMessage: {
          text: formattedInfo,
          contextInfo: {
          externalAdReply: {
          showAdAttribution: true
          }}}}}}, {})
          
    } else {
      await conn.reply(m.chat, 'Unable to fetch repository information.', m);
    }
  } catch (error) {
    console.error(error);
    await conn.reply(m.chat, 'An error occurred while fetching repository information.', m);
  }
};
handler.help = ['script'];
handler.tags = ['main'];
handler.command = ['sc', 'repo', 'script', 'code', 'silva'];

export default handler;
