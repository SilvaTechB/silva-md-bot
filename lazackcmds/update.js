import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

let handler = async (m, { text, usedPrefix, command }) => {
  // Define the repository URL
  const repoUrl = 'https://github.com/SilvaTechB/silva-md-bot';

  // Define the target folder
  const targetFolder = path.join(__dirname, 'lazackcmds'); // Ensure path compatibility

  // Check if the target folder exists; if not, create it
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder, { recursive: true }); // Create folders recursively if needed
  }

  // Determine the git command to use
  const gitCommand = fs.existsSync(path.join(targetFolder, '.git'))
    ? `git -C ${targetFolder} pull` // Pull updates if the folder is already a git repository
    : `git clone ${repoUrl} ${targetFolder}`; // Clone the repository if not already a git repository

  try {
    // Execute the git command
    await new Promise((resolve, reject) => {
      exec(gitCommand, (err, stdout, stderr) => {
        if (err) {
          reject(new Error(`Git command failed:\n${stderr}`)); // Include detailed error messages
        } else {
          resolve(stdout);
        }
      });
    });

    // Send a success message
    m.reply('*✅ Silva MD Bot Update completed successfully!*');
  } catch (error) {
    // Log and reply with error
    console.error('Update error:', error);
    m.reply(`*❌ Error during update:* ${error.message}`);
  }
};

handler.help = ['update'];
handler.tags = ['system'];
handler.command = /^update$/i;

handler.owner = true;

export default handler;
