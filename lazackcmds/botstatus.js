import os from "os";
import { performance } from "perf_hooks";

let handler = async (m, { conn }) => {
  let uptime = process.uptime(); // Bot uptime in seconds
  let formattedUptime = formatUptime(uptime);
  
  let freeRAM = (os.freemem() / 1024 / 1024).toFixed(2); // Free RAM in MB
  let totalRAM = (os.totalmem() / 1024 / 1024).toFixed(2); // Total RAM in MB
  let usedRAM = (totalRAM - freeRAM).toFixed(2); // Used RAM in MB
  let ramUsage = ((usedRAM / totalRAM) * 100).toFixed(2); // RAM usage in %

  let start = performance.now();
  await m.reply("⏳ Checking Silva md bot status...");
  let end = performance.now();
  let speed = (end - start).toFixed(2); // Response speed in ms

  let message = `
🚀 *Silva MD - Bot Status*  
──────────────────────  
🟢 *Uptime:* ${formattedUptime}  
⚡ *Speed:* ${speed} ms  
💾 *RAM Usage:* ${usedRAM}GB / ${totalRAM}TB (${ramUsage}%)  
──────────────────────  
✅ *Bot is running smoothly!*  
  `;

  m.reply(message);
};

// Function to format uptime
function formatUptime(seconds) {
  let h = Math.floor(seconds / 3600);
  let m = Math.floor((seconds % 3600) / 60);
  let s = Math.floor(seconds % 60);
  return `${h}h ${m}m ${s}s`;
}

handler.help = ["botstatus"];
handler.tags = ["system"];
handler.command = /^botstatus$/i;

export default handler;
