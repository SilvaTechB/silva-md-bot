// Increase EventEmitter limit to prevent MaxListenersExceededWarning
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 20;

import chalk from 'chalk';
import { spawn } from 'child_process';
import express from 'express';
import figlet from 'figlet';
import fs, { watch } from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';

// Clear temporary files on startup
async function clearTmp() {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const tmpDir = path.join(__dirname, 'tmp');
  
  try {
    const files = await fsp.readdir(tmpDir);
    for (const file of files) {
      await fsp.unlink(path.join(tmpDir, file));
    }
    console.log(chalk.green(`✔️ Cleared ${files.length} temporary files`));
  } catch (err) {
    if (err.code !== 'ENOENT') {
      console.error(chalk.red(`❌ Temporary file cleanup error: ${err.message}`));
    }
  }
}

// Display startup banners
figlet(
  'SILVA MD',
  {
    font: 'Ghost',
    horizontalLayout: 'default',
    verticalLayout: 'default',
  },
  (err, data) => {
    if (err) {
      console.error(chalk.red('Figlet error:', err));
      return;
    }
    console.log(chalk.yellow(data));
  }
);

figlet(
  'Silva Bot',
  {
    horizontalLayout: 'default',
    verticalLayout: 'default',
  },
  (err, data) => {
    if (err) {
      console.error(chalk.red('Figlet error:', err));
      return;
    }
    console.log(chalk.magenta(data));
  }
);

// Initialize Express server
const app = express();
const port = process.env.PORT || 5000;

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

app.use(express.static(path.join(__dirname, 'jusorts')));

app.get('/', (req, res) => {
  res.redirect('/silva.html');
});

app.listen(port, () => {
  console.log(chalk.green(`🌐 Server running on port ${port}`));
});

let isRunning = false;
let currentProcess = null;
let fileWatcher = null;

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  // Clean temporary files before starting
  await clearTmp();

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const botPath = path.join(__dirname, file);
  const args = [botPath, ...process.argv.slice(2)];
  
  // Start the bot process
  console.log(chalk.blue(`🚀 Starting bot: ${botPath}`));
  const p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });
  
  currentProcess = p;

  // Increase max listeners for critical emitters
  try {
    // For IPC channel
    if (p.channel) {
      p.channel.setMaxListeners(15);
      console.log(chalk.yellow('📈 Set IPC max listeners to 15'));
    }
    
    // For process stdio
    if (p.stdout) p.stdout.setMaxListeners(15);
    if (p.stderr) p.stderr.setMaxListeners(15);
  } catch (e) {
    console.error(chalk.yellow('⚠️ Listener adjustment failed:', e.message));
  }

  p.on('message', (data) => {
    console.log(chalk.cyan(`📩 Received IPC: ${data}`));
    switch (data) {
      case 'reset':
        console.log(chalk.yellow('🔄 Restarting bot...'));
        p.kill();
        isRunning = false;
        start(file);
        break;
      case 'uptime':
        p.send(process.uptime());
        break;
    }
  });

  p.on('exit', (code) => {
    isRunning = false;
    console.error(chalk.red(`❌ Process exited with code: ${code}`));

    // Clean up previous watcher if exists
    if (fileWatcher) {
      fileWatcher.close();
      fileWatcher = null;
    }

    // Create new file watcher with increased limit
    try {
      fileWatcher = watch(botPath, (eventType) => {
        if (eventType === 'change') {
          console.log(chalk.yellow('🔄 File change detected. Restarting...'));
          if (fileWatcher) fileWatcher.close();
          start(file);
        }
      });

      // Set max listeners specifically for this watcher
      fileWatcher.setMaxListeners(15);
      console.log(chalk.yellow('👀 Watching for file changes...'));
    } catch (watchErr) {
      console.error(chalk.red(`❌ File watch error: ${watchErr.message}`));
    }
  });

  p.on('error', (err) => {
    console.error(chalk.red(`❌ Process error: ${err}`));
    if (p.exitCode === null) p.kill();
    isRunning = false;
    setTimeout(() => {
      start(file);
    }, 5000);
  });

  // List installed plugins - FIXED SYNTAX ERROR HERE
  const pluginsFolder = path.join(__dirname, 'SilvaXlab');
  
  try {
    const files = await fsp.readdir(pluginsFolder);
    console.log(chalk.yellow(`🧩 Installed ${files.length} plugins`));
  } catch (err) {
    console.error(chalk.red(`❌ Error reading plugins folder: ${err.message}`));
  }
}

// Start the bot after cleanup
setTimeout(() => {
  start('sylivanus.js');
}, 2000);

// Handle uncaught errors
process.on('unhandledRejection', (reason) => {
  console.error(chalk.red(`⚠️ Unhandled Rejection: ${reason}`));
  if (currentProcess) {
    currentProcess.kill();
  }
  setTimeout(() => {
    start('sylivanus.js');
  }, 5000);
});

process.on('uncaughtException', (err) => {
  console.error(chalk.red(`⚠️ Uncaught Exception: ${err.stack || err}`));
  if (currentProcess) {
    currentProcess.kill();
  }
  setTimeout(() => {
    start('sylivanus.js');
  }, 5000);
});

process.on('SIGINT', () => {
  console.log(chalk.yellow('🚦 Received SIGINT. Graceful shutdown'));
  if (currentProcess) {
    currentProcess.kill();
  }
  if (fileWatcher) {
    fileWatcher.close();
  }
  process.exit(0);
});