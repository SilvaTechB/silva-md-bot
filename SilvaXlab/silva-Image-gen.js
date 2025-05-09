/*
Code is written by shizo techie
and this code belongs from channel Shizo devs
 https://whatsapp.com/channel/0029VaCkzkr3wtb1uYWiRz2o

Warning ⚠️ Do Not Remove Credits
*/

import fetch from "node-fetch";
const shizoaigen = async (m, { conn, usedPrefix, command }) => {
  const shizokey = "shizo"
  let text = m.text
  if (!text)
    return m.reply(
      `Wrong!!\n${usedPrefix + command} A girl on street with his handsome boyfriend`,
    );
  m.react("⏳️");
  try {
  let shizoart = `https://api.shizo.top/api/ai/imagine?apikey=${shizokey}&prompt=${text}`
    if (shizoart) {
      const tag = `@${m.sender.split("@")[0]}`;
      await conn.sendMessage(m.chat, { image: { url: shizoart }, caption: `🎨 *Generated Art* 🖌️\n\n📝 *Prompt:* ${text}\n\n👤 Requested by: ${tag}`, mentions: [m.sender], }, { quoted: m, });
    } else console.log("No response from ShizoApi");
  } catch (error) {
    console.error("There is an error :", error), m.react("🐞");
  }
};

shizoaigen.help = ["aigen <prompt>"];
shizoaigen.tags = ["ai", "image"];
shizoaigen.command = /^(aigen|aimage|aiart)$/i;

export default shizoaigen;
