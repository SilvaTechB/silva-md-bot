const { spawnSync } = require('child_process');
const fs   = require('fs');
const path = require('path');
const https = require('https');

const _repoOwner = 'silvatechnexusinc';
const _repoName  = 'silva-md-data';
const _uri = `https://github.com/${_repoOwner}/${_repoName}.git`;
const _tarUrl = `https://github.com/${_repoOwner}/${_repoName}/archive/refs/heads/main.tar.gz`;
const _dir = path.join(__dirname, '.cache_src');

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

function hasGit() {
    const r = spawnSync('git', ['--version'], { shell: true });
    return r.status === 0;
}

/** Download repo as tarball and extract into _dir (no git needed) */
function downloadTarball() {
    return new Promise((resolve, reject) => {
        console.log('[Bootstrap] git not found — downloading tarball instead...');
        const tmpTar = path.join(__dirname, '_silva_data.tar.gz');
        const file = fs.createWriteStream(tmpTar);

        function get(url, redirects) {
            if (redirects > 5) return reject(new Error('Too many redirects'));
            https.get(url, { headers: { 'User-Agent': 'silva-md-bot' } }, (res) => {
                if (res.statusCode === 301 || res.statusCode === 302) {
                    return get(res.headers.location, redirects + 1);
                }
                if (res.statusCode !== 200) {
                    return reject(new Error(`HTTP ${res.statusCode} fetching tarball`));
                }
                res.pipe(file);
                file.on('finish', () => {
                    file.close(() => {
                        ensureDir(_dir);
                        // Extract: strip the top-level directory created by GitHub
                        const r = spawnSync(
                            `tar -xzf "${tmpTar}" -C "${_dir}" --strip-components=1`,
                            { shell: true, stdio: 'inherit' }
                        );
                        try { fs.unlinkSync(tmpTar); } catch {}
                        if (r.status !== 0) return reject(new Error('tar extraction failed'));
                        resolve();
                    });
                });
            }).on('error', reject);
        }

        get(_tarUrl, 0);
    });
}

async function fetchAssets() {
    if (hasGit()) {
        // Git is available — clone or pull as before
        if (!fs.existsSync(path.join(_dir, '.git'))) {
            console.log('[Bootstrap] Cloning silva-md-data (first run)...');
            const r = run(`git clone --depth=1 "${_uri}" "${_dir}"`);
            if (r.status !== 0) {
                console.warn('[Bootstrap] git clone failed — falling back to tarball...');
                await downloadTarball();
            }
        } else {
            console.log('[Bootstrap] Pulling latest silva-md-data...');
            run(`git -C "${_dir}" pull --depth=1 --rebase`);
        }
    } else {
        // No git (e.g. Heroku) — use tarball download
        if (!fs.existsSync(path.join(_dir, 'handler.js'))) {
            await downloadTarball();
        } else {
            console.log('[Bootstrap] Using cached assets (no git available).');
        }
    }
}

async function bootstrap() {
    console.log('\x1b[36m[Bootstrap] Checking assets repo...\x1b[0m');

    await fetchAssets();

    // Sync directories (full overwrite — these are pure code, not runtime state)
    for (const dir of SYNC_DIRS) {
        const src = path.join(_dir, dir);
        const dst = path.join(__dirname, dir);
        if (fs.existsSync(src)) {
            run(`cp -rf "${src}" "${path.dirname(dst)}"`);
        }
    }

    // Sync individual files
    for (const file of SYNC_FILES) {
        const src = path.join(_dir, file);
        const dst = path.join(__dirname, file);
        if (fs.existsSync(src)) fs.copyFileSync(src, dst);
    }

    // Copy runtime-adjacent files only if they don't exist yet
    ensureDir(path.join(__dirname, 'data'));
    for (const { src, dst } of COPY_IF_MISSING) {
        const srcPath = path.join(_dir, src);
        const dstPath = path.join(__dirname, dst);
        if (fs.existsSync(srcPath) && !fs.existsSync(dstPath)) {
            fs.copyFileSync(srcPath, dstPath);
        }
    }

    console.log('\x1b[32m[Bootstrap] ALL DATA LOADED — starting Silva MD...\x1b[0m\n');
    require('./silva.js');
}

bootstrap().catch(err => {
    console.error('[Bootstrap] Fatal error:', err.message);
    // Fallback: try to start anyway if local files are present
    try { require('./silva.js'); } catch { process.exit(1); }
});
