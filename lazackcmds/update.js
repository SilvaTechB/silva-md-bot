import { exec } from "child_process";
import fs from "fs";
import path from "path";

let handler = async (m) => {
  const repoUrl = "https://github.com/SilvaTechB/silva-md-bot";
  const targetFolder = path.join(process.cwd(), "lazackcmds"); // Ensure correct path usage
  const gitFolder = path.join(targetFolder, ".git"); // Git folder path

  // Check if the target folder exists
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true });
  }

  try {
    // Check if the folder is a Git repository
    if (!fs.existsSync(gitFolder)) {
      m.reply("⚠️ *Existing folder detected, but it's not a Git repository.*\n🔄 *Resetting...*");
      await execPromise(`rm -rf ${targetFolder}`); // Remove non-git folder
      await execPromise(`git clone ${repoUrl} ${targetFolder}`);
      return m.reply("✅ *Silva MD Bot successfully cloned and ready!* 🚀");
    }

    // Pull updates if it's already a Git repository
    await execPromise(`git -C ${targetFolder} pull`);
    m.reply("✅ *Silva MD Bot is up to date! 🎉*");

  } catch (error) {
    m.reply(`❌ *Update failed:* ${error.message}\nTry updating manually.`);
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
