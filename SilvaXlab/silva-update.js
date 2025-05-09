import { exec } from "child_process";
import path from "path";
import process from "process";

let handler = async (m) => {
  const targetFolder = path.join(process.cwd(), "SilvaXlab"); // Your bot's folder

  try {
    // Pull updates from Git repository
    let output = await execPromise(`git -C ${targetFolder} pull`);

    if (output.includes("Already up to date.")) {
      return m.reply("✅ *Silva MD Bot is already up to date!* 🎉");
    }

    await m.reply("✅ *Silva MD Bot has been updated successfully!* 🔁\n\n♻️ Restarting now to apply changes...");

    // Restart the process
    restartBot();

  } catch (error) {
    m.reply(`❌ *Update failed:* ${error.message}\nPlease try updating manually.`);
  }
};

// Execute shell command with a promise
const execPromise = (command) =>
  new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr.trim() || err.message));
      resolve(stdout.trim());
    });
  });

// Restart the bot
const restartBot = () => {
  exec(`pm2 restart all`, (error, stdout, stderr) => {
    if (error) {
      console.error("Failed to restart bot using PM2:", stderr || error.message);
      process.exit(1); // Fallback exit if PM2 not available
    }
  });
};

handler.help = ["update"];
handler.tags = ["system"];
handler.command = /^update$/i;
handler.owner = true;

export default handler;
