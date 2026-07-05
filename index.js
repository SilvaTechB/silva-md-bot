// index.js — Asset bootstrapper for Silva MD Bot
// Clones (or updates) the public silva-md-data repo, then starts the bot.

const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');

const ASSETS_REPO = process.env.ASSETS_REPO;
const ASSETS_DIR  = path.join(__dirname, '_assets');

// Static code folders — always synced from the assets repo
const SYNC_DIRS  = ['plugins', 'lib', 'themes', 'smm'];

// Static files — always synced
const SYNC_FILES = ['handler.js', '_fix_agent.js'];

// Only copied if the destination file doesn't already exist (runtime data)
const COPY_IF_MISSING = [
    { src: path.join('data', 'silvamdboticon.png'), dst: path.join('data', 'silvamdboticon.png') }
];

function run(cmd) {
    return spawnSync(cmd, { shell: true, stdio: 'inherit' });
}

function ensureDir(dir) {
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

async function bootstrap() {
    if (!ASSETS_REPO) {
        console.error('[Bootstrap] ❌ ASSETS_REPO environment variable is not set.');
        console.error('[Bootstrap]    Set it in your deployment config vars and restart.');
        process.exit(1);
    }

    console.log('\x1b[36m[Bootstrap] Checking assets repo...\x1b[0m');

    // Clone or pull
    if (!fs.existsSync(path.join(ASSETS_DIR, '.git'))) {
        console.log('[Bootstrap] Cloning silva-md-data (first run)...');
        const r = run(`git clone --depth=1 "${ASSETS_REPO}" "${ASSETS_DIR}"`);
        if (r.status !== 0) {
            console.warn('[Bootstrap] Clone failed — will try to run with local files if present.');
        }
    } else {
        console.log('[Bootstrap] Pulling latest silva-md-data...');
        run(`git -C "${ASSETS_DIR}" pull --depth=1 --rebase`);
    }

    // Sync directories (full overwrite — these are pure code, not runtime state)
    for (const dir of SYNC_DIRS) {
        const src = path.join(ASSETS_DIR, dir);
        const dst = path.join(__dirname, dir);
        if (fs.existsSync(src)) {
            run(`cp -rf "${src}" "${path.dirname(dst)}"`);
        }
    }

    // Sync individual files
    for (const file of SYNC_FILES) {
        const src = path.join(ASSETS_DIR, file);
        const dst = path.join(__dirname, file);
        if (fs.existsSync(src)) fs.copyFileSync(src, dst);
    }

    // Copy runtime-adjacent files only if they don't exist yet
    ensureDir(path.join(__dirname, 'data'));
    for (const { src, dst } of COPY_IF_MISSING) {
        const srcPath = path.join(ASSETS_DIR, src);
        const dstPath = path.join(__dirname, dst);
        if (fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
            fs.copyFileSync(srcPath, dstPath);
        }
    }

    console.log('\x1b[32m[Bootstrap] Assets ready — starting Silva MD...\x1b[0m\n');
    require('./silva.js');
}

bootstrap().catch(err => {
    console.error('[Bootstrap] Fatal error:', err.message);
    // Fallback: try to start anyway if local files are present
    try { require('./silva.js'); } catch { process.exit(1); }
});
