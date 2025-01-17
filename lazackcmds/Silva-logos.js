const axios = require("axios");
const { MessageType } = require("@whiskeysockets/baileys");

handler.help = ["logo <text>"];
handler.tags = ["utility"];
handler.command = ["logo"];

handler.owner = false;
handler.group = false;
handler.private = false;
handler.admin = false;

/**
 * Main handler function for creating logos.
 * @param {object} m - Message object from Baileys.
 * @param {object} { conn, args, text } - Context passed to the handler.
 */
handler.handler = async (m, { conn, args, text }) => {
  if (!text) {
    return conn.sendMessage(
      m.chat,
      { text: "Please provide some text. Usage: `.logo <text>`" },
      { quoted: m }
    );
  }

  const menu = `*🎨 SILVA MD BOT Logo Maker 🎨*

Choose a style:
1. Black Pink
2. Black Pink 2
3. Silver 3D
4. Naruto
5. Digital Glitch
6. Pixel Glitch
7. Comic Style
8. Neon Light
9. Free Bear
10. Devil Wings
11. Sad Girl
12. Leaves
13. Dragon Ball
14. Hand Written
15. Neon Light
16. 3D Castle Pop
17. Frozen Christmas
18. 3D Foil Balloons
19. 3D Colorful Paint
20. American Flag 3D

_Reply with the number of your choice._`;

  await conn.sendMessage(m.chat, { text: menu }, { quoted: m });

  conn.once("chat-update", async (msg) => {
    const choice = parseInt(msg.message.conversation.trim());
    const logos = {
      1: "https://en.ephoto360.com/create-a-blackpink-style-logo-with-members-signatures-810.html",
      2: "https://en.ephoto360.com/online-blackpink-style-logo-maker-effect-711.html",
      3: "https://en.ephoto360.com/create-glossy-silver-3d-text-effect-online-802.html",
      4: "https://en.ephoto360.com/naruto-shippuden-logo-style-text-effect-online-808.html",
      5: "https://en.ephoto360.com/create-digital-glitch-text-effects-online-767.html",
      6: "https://en.ephoto360.com/create-pixel-glitch-text-effect-online-769.html",
      7: "https://en.ephoto360.com/create-online-3d-comic-style-text-effects-817.html",
      8: "https://en.ephoto360.com/create-colorful-neon-light-text-effects-online-797.html",
      9: "https://en.ephoto360.com/free-bear-logo-maker-online-673.html",
      10: "https://en.ephoto360.com/neon-devil-wings-text-effect-online-683.html",
      11: "https://en.ephoto360.com/write-text-on-wet-glass-online-589.html",
      12: "https://en.ephoto360.com/create-typography-status-online-with-impressive-leaves-357.html",
      13: "https://en.ephoto360.com/dragon-ball-logo-maker-online-704.html",
      14: "https://en.ephoto360.com/hand-written-logo-effect-768.html",
      15: "https://en.ephoto360.com/neon-light-effect-771.html",
      16: "https://en.ephoto360.com/3d-castle-pop-749.html",
      17: "https://en.ephoto360.com/frozen-christmas-350.html",
      18: "https://en.ephoto360.com/3d-foil-balloons-351.html",
      19: "https://en.ephoto360.com/3d-colorful-paint-652.html",
      20: "https://en.ephoto360.com/american-flag-3d-721.html",
    };

    if (!logos[choice]) {
      return conn.sendMessage(
        m.chat,
        { text: "Invalid choice. Please try again." },
        { quoted: m }
      );
    }

    try {
      const url = logos[choice];
      const apiUrl = `https://api-pink-venom.vercel.app/api/logo?url=${encodeURIComponent(
        url
      )}&name=${encodeURIComponent(text)}`;

      const response = await axios.get(apiUrl);
      const result = response.data.result.download_url;

      await conn.sendMessage(
        m.chat,
        {
          image: { url: result },
          caption: `*🎨 SILVA MD BOT 🎨*\n\nHere is your logo!`,
        },
        { quoted: m }
      );
    } catch (error) {
      console.error(error);
      conn.sendMessage(
        m.chat,
        { text: "Failed to generate logo. Please try again later." },
        { quoted: m }
      );
    }
  });
};

module.exports = handler;
