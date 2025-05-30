// Increase EventEmitter limit to prevent MaxListenersExceededWarning
import { EventEmitter } from 'events';
EventEmitter.defaultMaxListeners = 20;

import chalk from 'chalk';
import { spawn } from 'child_process';
import express from 'express';
import figlet from 'figlet';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { promises as fsp } from 'fs';

// Clear temporary files on startup
async function clearTmp() {
  const tmpDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'tmp');
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

async function start(file) {
  if (isRunning) return;
  isRunning = true;

  // Clean temporary files before starting
  await clearTmp();

  const currentFilePath = new URL(import.meta.url).pathname;
  const args = [path.join(path.dirname(currentFilePath), file), ...process.argv.slice(2)];
  
  // Start the bot process
  const p = spawn(process.argv[0], args, {
    stdio: ['inherit', 'inherit', 'inherit', 'ipc'],
  });
  
  currentProcess = p;

  p.on('message', (data) => {
    console.log(chalk.cyan(`📩 Received IPC: ${data}`));
    switch (data) {
      case 'reset':
        console.log(chalk.yellow('🔄 Restarting bot...'));
        p.kill();
        isRunning = false;
        start.apply(this, arguments);
        break;
      case 'uptime':
        p.send(process.uptime());
        break;
    }
  });

  p.on('exit', (code) => {
    isRunning = false;
    console.error(chalk.red(`❌ Process exited with code: ${code}`));

    // Restart after delay instead of watching files
    setTimeout(() => {
      start('sylivanus.js');
    }, 5000);
  });

  p.on('error', (err) => {
    console.error(chalk.red(`❌ Process error: ${err}`));
    p.kill();
    isRunning = false;
    setTimeout(() => {
      start('sylivanus.js');
    }, 5000);
  });

  // List installed plugins
  const pluginsFolder = path.join(path.dirname(currentFilePath), 'SilvaXlab');
  
  try {
    const files = await fsp.readdir(pluginsFolder);
    console.log(chalk.yellow(`🧩 Installed ${files.length} plugins`));
  } catch (err) {
    console.error(chalk.red(`❌ Error reading plugins folder: ${err.message}`));
  }
}

// Start the bot after 2 seconds (allows time for cleanup)
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
  process.exit(0);
});