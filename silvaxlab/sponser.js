import { exec } from 'child_process';

let handler = async (m, { conn }) => {
  // Thumbnail for external ad reply
  const sponsorThumbnail = 'https://i.imgur.com/z9TGGlv.jpeg'; // Replace with a sponsor-related image URL

  // Fake contact message (optional)
  let sponsorContact = {
    key: { fromMe: false, participant: `0@s.whatsapp.net`, remoteJid: 'status@broadcast' },
    message: {
      contactMessage: {
        displayName: `Sylivanus`,
        vcard: `BEGIN:VCARD\nVERSION:3.0\nN:;Sylivanus;;;\nFN:SILVA TECH INC\nitem1.TEL;waid=${m.sender.split('@')[0]}:${m.sender.split('@')[0]}\nitem1.X-ABLabel:Ponsel\nEND:VCARD`,
      },
    },
  };

  // Initial sponsor message
  let initialMsg = await conn.sendMessage(
    m.chat,
    { text: '✨ *Hello, Innovator!* Let us tell you how you can support Silva Tech Inc! 🚀', gifPlayback: false },
    { quoted: sponsorContact }
  );

  // Sponsor sequence messages
  const sponsorSteps = [
    `🌟 *Empower Innovation!* Silva Tech Inc is on a mission to develop groundbreaking solutions and creative projects like the Silva MD Bot.`,
    `💡 *Why Sponsor Us?* Your support fuels our journey to make a difference through technology.`,
    `🔗 *Ready to Join?* Visit our sponsorship page now to become part of this amazing journey: https://github.com/sponsors/SilvaTechB`,
    `❤️ *Thank you for believing in our vision!* Together, we can achieve incredible things!`,
  ];

  // Send sponsor sequence messages with delay
  for (const step of sponsorSteps) {
    await new Promise((res) => setTimeout(res, 4000)); // 4-second delay
    await conn.sendMessage(m.chat, { text: step }, { quoted: sponsorContact });
  }

  // Final sponsor message with external ad reply
  await conn.sendMessage(
    m.chat,
    {
      text: `🔗 *Click here to sponsor us!* https://github.com/sponsors/SilvaTechB`,
      contextInfo: {
        externalAdReply: {
          title: '🌟 Sponsor Silva Tech Inc!',
          body: 'Join us in shaping the future of technology.',
          thumbnailUrl: sponsorThumbnail,
          sourceUrl: 'https://github.com/sponsors/SilvaTechB',
          mediaType: 1,
          renderLargerThumbnail: true,
        },
      },
    },
    { quoted: sponsorContact }
  );
};

// Command metadata
handler.help = ['sponsor'];
handler.tags = ['info', 'ad'];
handler.command = ['sponsor'];

export default handler;
