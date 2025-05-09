import fetch from "node-fetch";
import "@whiskeysockets/baileys";

// Cooldown map to track requests
const cooldown = new Map();

const handler = async (m, { conn, args }) => {
  const sender = m.sender;
  const currentTime = Date.now();
  const lastRequestTime = cooldown.get(sender);
  const cooldownTime = 1200000; // 20 minutes

  // Check cooldown for non-owner users
  if (sender !== "254700143167@s.whatsapp.net" && lastRequestTime && currentTime - lastRequestTime < cooldownTime) {
    const remainingTime = cooldownTime - (currentTime - lastRequestTime);
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    return conn.reply(m.chat, `⏳ Please wait ${minutes} minute(s) and ${seconds} second(s) before requesting again.`, m);
  }

  // Validate phone number argument
  if (!args[0]) {
    return conn.reply(m.chat, "📱 Please provide a phone number.\n\n*Example:* *.getpair 254700143167*", m);
  }

  const phoneNumber = encodeURIComponent(args[0]);
  const apiUrl = `https://silva-session-id-1.onrender.com/pair?phone=${phoneNumber}`;

  m.reply("⏳ *Retrieving your pairing code... Please wait.*");

  try {
    // Fetch pairing code from the API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      throw new Error(`Failed to fetch pairing code: ${response.statusText}`);
    }

    const result = await response.json();

    if (result.code) {
      const pairingCode = result.code;
      const message = `
*🤖 Silva MD Pairing Code 🫂*

💬 A verification code has been sent to your phone number. Please check your phone and enter the code to complete pairing.

*🔢 Code:* \`${pairingCode}\`
      `;
      // Send pairing code message
      await conn.reply(m.chat, message, m);

      // Update cooldown
      cooldown.set(sender, currentTime);
    } else if (result.error) {
      conn.reply(m.chat, `⚠️ Error: ${result.error}`, m);
    } else {
      conn.reply(m.chat, `⚠️ Unexpected response format: ${JSON.stringify(result)}`, m);
    }
  } catch (error) {
    conn.reply(m.chat, `❌ Error: ${error.message}`, m);
  }
};

handler.help = ["getpair", "getcode"];
handler.tags = ["tools"];
handler.command = ["getpair", "getcode", "paircode"];
handler.owner = false;
handler.private = true;

export default handler;
