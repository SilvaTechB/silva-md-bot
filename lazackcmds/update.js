import { exec } from 'child_process';
import fs from 'fs';
import path from 'path';

let handler = async (m, { text, usedPrefix, command }) => {
  if (!text) throw `Please provide a repository URL`;

  // Define the repository URL
  const repoUrl = 'https://github.com/SilvaTechB/silva-md-bot.git'; 

  // Define the target folder
  const targetFolder = 'lazackcmds';

  // Check if the target folder exists, if not, create it
  if (!fs.existsSync(targetFolder)) {
    fs.mkdirSync(targetFolder); 
  }

  // Prepare the git command
  const gitCommand = fs.existsSync(`${targetFolder}/.git`)
    ? `git -C ${targetFolder} pull` // Pull updates if the folder is already a git repository
    : `git clone ${repoUrl} ${targetFolder}`; // Clone the repository if it's not already a git repository

  try {
    // Execute the git command
    await new Promise((resolve, reject) => {
      exec(gitCommand, (err, stdout, stderr) => {
        if (err) {
          reject(`Git command failed: ${stderr}`);
        } else {
          resolve(stdout);
        }
      });
    });

    // Send a success message
    m.reply('*✅ Silva MD Bot Update completed successfully!*');
  } catch (error) {
    // Handle errors
    console.error(error);
    m.reply(`*Error during update:* ${error.message}`);
  }
};

handler.help = ['update'];
handler.tags = ['system'];
handler.command = /^update$/i;

handler.owner = true;

export default handler;
