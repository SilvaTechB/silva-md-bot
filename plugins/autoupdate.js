'use strict';
const https   = require('https');
const { execSync, exec } = require('child_process');
const { fmt } = require('../lib/theme');

const REPO_API = 'https://api.github.com/repos/SilvaTechB/silva-md-bot/commits/main';
const CHECK_INTERVAL_MS = 24 * 60 * 60 * 1000; // 24 hours

// ── Fetch the latest remote commit SHA via GitHub API ──────────────────────
function getRemoteSha() {
    return new Promise((resolve, reject) => {
        const opts = {
            hostname: 'api.github.com',
            path:     '/repos/SilvaTechB/silva-md-bot/commits/main',
            headers:  { 'User-Agent': 'silva-md-bot' }
        };
        https.get(opts, res => {
            let data = '';
            res.on('data', d => (data += d));
            res.on('end', () => {
                try { resolve(JSON.parse(data).sha); }
                catch (e) { reject(new Error('Could not parse GitHub API response')); }
            });
        }).on('error', reject);
    });
}

// ── Get the current local commit SHA ──────────────────────────────────────
function getLocalSha() {
    try { return execSync('git rev-parse HEAD', { encoding: 'utf8' }).trim(); }
    catch { return null; }
}

// ── Run a shell command and return output ──────────────────────────────────
function run(cmd) {
    return new Promise((resolve, reject) => {
        exec(cmd, { timeout: 120000 }, (err, stdout, stderr) => {
            if (err) reject(new Error(stderr || err.message));
            else resolve(stdout.trim());
        });
    });
}

// ── Auto-update check (background, non-blocking) ──────────────────────────
async function checkForUpdate(sock) {
    const ownerJid = `${global.botNum || require('../config').OWNER_NUMBER}@s.whatsapp.net`;

    let remoteSha, localSha;
    try {
        remoteSha = await getRemoteSha();
        localSha  = getLocalSha();
    } catch (e) {
        console.log('[AutoUpdate] Check failed:', e.message);
        return;
    }

    if (!remoteSha || !localSha || remoteSha === localSha) {
        console.log('[AutoUpdate] ✅ Already on latest commit:', localSha?.slice(0, 7));
        return;
    }

    console.log(`[AutoUpdate] 🔄 Update found! local=${localSha?.slice(0, 7)} remote=${remoteSha.slice(0, 7)}`);

    try {
        await sock.sendMessage(ownerJid, {
            text: fmt(
                `🔄 *Silva MD Update Available!*\n\n` +
                `📌 *Current:* \`${localSha?.slice(0, 7)}\`\n` +
                `🆕 *Latest:*  \`${remoteSha.slice(0, 7)}\`\n\n` +
                `⏳ Pulling update and restarting...`
            )
        });
    } catch { /* non-fatal */ }

    try {
        await run('git pull origin main --ff-only');
        await run('npm install --omit=dev');

        try {
            await sock.sendMessage(ownerJid, {
                text: fmt('✅ *Update applied!* Bot is restarting now...')
            });
        } catch { /* non-fatal */ }

        // Give the message a moment to send before exiting
        setTimeout(() => process.exit(1), 3000);

    } catch (pullErr) {
        console.error('[AutoUpdate] git pull failed:', pullErr.message);
        try {
            await sock.sendMessage(ownerJid, {
                text: fmt(
                    `⚠️ *Auto-update failed.*\n\n` +
                    `_${pullErr.message}_\n\n` +
                    `Please redeploy manually from:\n` +
                    `https://github.com/SilvaTechB/silva-md-bot`
                )
            });
        } catch { /* non-fatal */ }
    }
}

// ── Plugin definition ──────────────────────────────────────────────────────
let _updateTimer = null;

module.exports = {
    commands:    ['checkupdate', 'autoupdate', 'update'],
    description: 'Check for bot updates from GitHub and auto-deploy if available',
    usage:       '.checkupdate',
    permission:  'owner',
    group:       false,
    private:     true,

    // Called once when the plugin is loaded — starts the background 24h checker
    onLoad: (sock) => {
        if (_updateTimer) return;
        // First check after 5 minutes (allow full startup), then every 24 hours
        setTimeout(() => {
            checkForUpdate(sock);
            _updateTimer = setInterval(() => checkForUpdate(sock), CHECK_INTERVAL_MS);
        }, 5 * 60 * 1000);

        console.log('[AutoUpdate] ✅ 24-hour update checker scheduled.');
    },

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        await reply('🔍 Checking for updates from GitHub...');

        let remoteSha, localSha;
        try {
            remoteSha = await getRemoteSha();
            localSha  = getLocalSha();
        } catch (e) {
            return reply(`❌ Could not reach GitHub: ${e.message}`);
        }

        if (!localSha) {
            return reply('⚠️ Cannot read local git commit. Is git installed/initialized?');
        }

        if (remoteSha === localSha) {
            return reply(
                `✅ *Bot is up to date!*\n\n` +
                `📌 *Commit:* \`${localSha.slice(0, 7)}\`\n` +
                `🌐 *Repo:* github.com/SilvaTechB/silva-md-bot`
            );
        }

        await reply(
            `🔄 *Update found!*\n\n` +
            `📌 *Current:* \`${localSha.slice(0, 7)}\`\n` +
            `🆕 *Latest:*  \`${remoteSha.slice(0, 7)}\`\n\n` +
            `⏳ Pulling update and restarting...`
        );

        try {
            await run('git pull origin main --ff-only');
            await run('npm install --omit=dev');
            await reply('✅ *Update applied!* Bot is restarting now...');
            setTimeout(() => process.exit(1), 3000);
        } catch (e) {
            return reply(
                `⚠️ *Pull failed:* ${e.message}\n\n` +
                `Please redeploy manually:\n` +
                `https://github.com/SilvaTechB/silva-md-bot`
            );
        }
    }
};
