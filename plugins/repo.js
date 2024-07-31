import { promises } from 'fs';
import { join } from 'path';
import axios from 'axios'; 

let handler = async function (m, { conn, __dirname }) {
const githubRepoURL = 'https://github.com/Lazack28/Lazack-md';
  try {
const [, username, repoName] = githubRepoURL.match(/github\.com\/([^/]+)\/([^/]+)/);
const response = await axios.get(`https://api.github.com/repos/${username}/${repoName}`);
if (response.status === 200) {
const repoData = response.data;
const formattedInfo = `
🍪 𝐋𝐀𝐙𝐀𝐂𝐊-𝐌𝐃 🍪
*A Fully Featured WhatsApp Bot Loaded with Features 🎊*
𝖲𝖳𝖠𝖱✨ :: ${repoData.stargazers_count}
𝖥𝖮𝖱𝖪 🍽️ :: ${repoData.forks_count}
𝖴𝖱𝖫 👻 :: ${repoData.html_url}
\`🚀 Key Features\`
*Automated Messaging:* 𝙲𝚞𝚜𝚝𝚘𝚖 𝚛𝚎𝚜𝚙𝚘𝚗𝚜𝚎𝚜 𝚏𝚘𝚛 𝚟𝚊𝚛𝚒𝚘𝚞𝚜 𝚝𝚛𝚒𝚐𝚐𝚎𝚛𝚜.
*Media Sharing ::* 𝙴𝚊𝚜𝚒𝚕𝚢 𝚜𝚑𝚊𝚛𝚎 𝚒𝚖𝚊𝚐𝚎𝚜, 𝚟𝚒𝚍𝚎𝚘𝚜, 𝚊𝚗𝚍 𝚏𝚒𝚕𝚎𝚜.
*Chat Management ::* 𝚃𝚘𝚘𝚕𝚜 𝚝𝚘 𝚖𝚊𝚗𝚊𝚐𝚎 𝚌𝚑𝚊𝚝𝚜
effectively.
*Interactive Features::* 𝙶𝚊𝚖𝚎𝚜, 𝚝𝚛𝚒𝚟𝚒𝚊, 𝚊𝚗𝚍 𝚖𝚘𝚛𝚎 𝚏𝚞𝚗. 
*Custom Commands::* 𝙲𝚛𝚎𝚊𝚝𝚎 𝚊𝚗𝚍 𝚍𝚎𝚙𝚕𝚘𝚢 𝚢𝚘𝚞𝚛 𝚘𝚠𝚗 𝚌𝚘𝚖𝚖𝚊𝚗𝚍𝚜.

*_DEPLOY NOW_*

\`\`\`Enhance your WhatsApp experience with 𝐋𝐀𝐙𝐀𝐂𝐊-𝐌𝐃 ! 🍪\`\`\`
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
handler.command = ['sc', 'repo', 'script', 'code'];

export default handler;
