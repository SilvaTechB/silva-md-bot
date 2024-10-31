import fetch from "node-fetch";
import "@whiskeysockets/baileys";

let cooldown = new Map();

let handler = async (m, { conn, args }) => {
  const currentTime = Date.now();
  const lastRequestTime = cooldown.get(m.sender);
  
  // Check for cooldown (20 minutes)
  if (m.sender !== "923092668108@s.whatsapp.net" && lastRequestTime && currentTime - lastRequestTime < 1200000) {
    const remainingTime = 1200000 - (currentTime - lastRequestTime);
    const minutes = Math.floor(remainingTime / 60000);
    const seconds = Math.floor((remainingTime % 60000) / 1000);
    return conn.reply(m.chat, `Please wait ${minutes} minute(s) and ${seconds} second(s) before requesting again.`, m);
  }

  // Check if phone number is provided
  if (!args[0]) {
    return conn.reply(m.chat, "Please provide a phone number.\n*Example:* *.getpair 254700143167*", m);
  }

  const phoneNumber = encodeURIComponent(args[0]);
  const apiUrl = `https://creds-1.onrender.com/pair?phone=${phoneNumber}`;
  
  m.reply("*Wait while we get your pairing code*");

  try {
    // Fetch pairing code from the API
    const response = await fetch(apiUrl);

    if (!response.ok) {
      const responseText = await response.text();
      throw new Error(`Network response was not ok: ${response.statusText}. Response: ${responseText}`);
    }

    const result = await response.json();

    if (result.code) {
      const pairingCode = result.code;
      const message = `
*⛲ Pairing Code ⛲*

💬 A verification code has been sent to your phone number. Please check your phone and copy this code to pair it and get the Silva Bot session ID.

*🔢 Code:* \`${pairingCode}\`
      `;
      // Send response with a button
      await conn.sendButton2(m.chat, message, "𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓", "https://envs.sh/wlR.jpg", [["❣️❣️❣️", ".copy"]], pairingCode, null, m);
      
      // Set cooldown
      cooldown.set(m.sender, currentTime);
    } else if (result.error) {
      conn.reply(m.chat, `Error: ${result.error}`, m);
    } else {
      conn.reply(m.chat, `Unexpected response structure: ${JSON.stringify(result)}`, m);
    }
  } catch (error) {
    conn.reply(m.chat, `Error: ${error.message}`, m);
  }
};

handler.help = ["getpair", "getcode"];
handler.tags = ["tools"];
handler.command = ["getpair", "getcode", "paircode"];
handler.owner = false;
handler.private = true;

export default handler;
