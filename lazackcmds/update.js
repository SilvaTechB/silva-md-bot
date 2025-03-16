import { exec } from "child_process";
import path from "path";

let handler = async (m) => {
  const targetFolder = path.join(process.cwd(), "lazackcmds"); // Bot folder

  try {
    // Pull updates from the repository
    let output = await execPromise(`git -C ${targetFolder} pull`);
    
    if (output.includes("Already up to date.")) {
      return m.reply("✅ *Silva MD Bot is already up to date!* 🎉");
    }

    m.reply("✅ *Silva MD Bot has been successfully updated!* 🚀\nRestart your bot to apply changes.");

  } catch (error) {
    m.reply(`❌ *Update failed:* ${error.message}\nTry updating manually.`);
  }
};

// Helper function to execute shell commands
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
