/*
Code is written by shizo techie
and this code belongs from channel Shizo devs
 https://whatsapp.com/channel/0029VaCkzkr3wtb1uYWiRz2o

Warning ⚠️ Do Not Remove Credits
*/

import fetch from "node-fetch";

const shizoaigen = async (m, { conn, usedPrefix, command }) => {
  const SHIZO_API_KEY = "shizo";
  const API_ENDPOINT = "https://api.shizo.top/api/ai/imagine";
  const TIMEOUT = 30000; // 30 seconds timeout

  const text = m.text?.trim();
  if (!text || text.split(" ").length < 3) {
    await m.reply(`❌ Invalid input!\nUsage: ${usedPrefix + command} [detailed prompt]\nExample: ${usedPrefix + command} A girl on street with her handsome boyfriend, cyberpunk style, 4k detailed`);
    return m.react("❌");
  }

  try {
    await m.react("⏳");
    const encodedPrompt = encodeURIComponent(text);
    const apiUrl = `${API_ENDPOINT}?apikey=${SHIZO_API_KEY}&prompt=${encodedPrompt}`;
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), TIMEOUT);
    
    const response = await fetch(apiUrl, {
      signal: controller.signal,
      headers: { "Accept": "application/json" }
    });
    
    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorBody = await response.text();
      throw new Error(`API Error ${response.status}: ${errorBody.slice(0, 100)}`);
    }

    const responseData = await response.json();
    if (!responseData?.url) {
      throw new Error("Invalid API response structure");
    }
    const mention = `@${m.sender.split("@")[0]}`;
    await conn.sendMessage(
      m.chat,
      { 
        image: { url: responseData.url }, 
        caption: `🎨 *Generated Art* 🖌️\n\n📝 *Prompt:* ${text}\n\n👤 Requested by: ${mention}`,
        mentions: [m.sender],
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true
        }
      },
      { quoted: m }
    );
    
    await m.react("✅");

  } catch (error) {
    console.error("Generation Error:", error);
    await m.react("❌");
    await conn.sendMessage(
      m.chat,
      { 
        text: `⚠️ Generation failed!\nReason: ${error.message.replace(SHIZO_API_KEY, "REDACTED")}\nPlease try again later.`
      },
      { quoted: m }
    );
  }
};

// Command
shizoaigen.help = ["aigen <prompt>"];
shizoaigen.tags = ["ai", "image"];
shizoaigen.command = /^(aigen|aimage|aiart)$/i;

export default shizoaigen;
