import fetch from 'node-fetch';

const handler = async (m, { conn }) => {
  const user = 'SilvaTechB';
  const repo = 'silva-md-bot';
  const apiUrl = `https://api.github.com/repos/${user}/${repo}`;

  try {
    const res = await fetch(apiUrl);
    const json = await res.json();

    const forks = json.forks_count || 0;
    const stars = json.stargazers_count || 0;

    let message = `🚀 *SILVA MD BOT MILESTONE CHECK*\n\n`;
    message += `🔹 *Forks:* ${forks}\n`;
    message += `🔹 *Stars:* ${stars}\n\n`;

    if (forks >= 1000 && forks < 1500) {
      message += `🎉 We've reached *1000 forks*! Thank you for supporting open source! 💖`;
    } else if (forks >= 1500 && forks < 2000) {
      message += `🔥 *1500 forks* milestone reached! You all are amazing! 💫`;
    } else if (forks >= 2000) {
      message += `👑 *2000+ forks*! This community is legendary! 🏆`;
    } else {
      message += `🛠️ Keep sharing the repo and help us reach the next milestone! 🙌`;
    }

    message += `\n\n🔗 GitHub: https://github.com/${user}/${repo}`;

    await conn.sendMessage(m.chat, {
      text: message,
      mentions: [m.sender],
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'Silva bot fork status : thank you💖🦄',
          serverMessageId: 143
        }
      }
    }, { quoted: m });

  } catch (e) {
    console.error(e);
    m.reply('❌ Failed to fetch GitHub repo data. Try again later.');
  }
};

handler.help = ['milestone'];
handler.tags = ['fun', 'info'];
handler.command = ['milestone', 'forkstatus', 'stars'];

export default handler;
