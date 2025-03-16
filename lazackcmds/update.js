import { exec } from "child_process";
import fs from "fs";
import path from "path";

let handler = async (m, { text }) => {
  const repoUrl = "https://github.com/SilvaTechB/silva-md-bot";
  const targetFolder = path.join(process.cwd(), "lazackcmds"); // Ensure correct path usage

  // Ensure the target directory exists
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  // Check if the directory is a Git repository
  let isGitRepo = fs.existsSync(path.join(targetFolder, ".git"));
  if (!isGitRepo) {
    try {
      await execPromise(`git clone ${repoUrl} ${targetFolder}`);
      m.reply("✅ *Silva MD Bot has been successfully cloned!* 🚀");
    } catch (error) {
      return m.reply(`❌ *Failed to clone the repository:* ${error.message}`);
    }
  }

  // Pull updates from the repository
  try {
    await execPromise(`git -C ${targetFolder} pull`);
    m.reply("✅ *Silva MD Bot is up to date! 🎉*");
  } catch (error) {
    m.reply(`⚠️ *Update failed:* ${error.message}\nTry updating manually.`);
  }
};

// Helper function to execute shell commands with better error handling
const execPromise = (command) =>
  new Promise((resolve, reject) => {
    exec(command, (err, stdout, stderr) => {
      if (err) return reject(new Error(stderr.trim() || err.message));
      resolve(stdout.trim());
    });
  });

handler.help = ["update"];
handler.tags = ["system"];
handler.command = /^update$/i;
handler.owner = true;

export default handler;
