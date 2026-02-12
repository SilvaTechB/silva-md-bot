const https = require('https');
const fs = require('fs');
const path = require('path');

const REPO_OWNER = 'SilvaTechB';
const REPO_NAME = 'silva-md-bot';
const BRANCH = 'main';
const PLUGINS_DIR = path.join(__dirname, '..', 'silvaxlab');
const LIB_DIR = path.join(__dirname);
const CHECK_INTERVAL = 30 * 60 * 1000;

let lastCheck = null;
let isUpdating = false;

function githubGet(apiPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.github.com',
            path: apiPath,
            headers: {
                'User-Agent': 'Silva-MD-Bot-Updater',
                'Accept': 'application/vnd.github.v3+json'
            },
            timeout: 15000
        };

        const req = https.get(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                if (res.statusCode === 200) {
                    try { resolve(JSON.parse(data)); }
                    catch (e) { reject(new Error('Failed to parse response')); }
                } else if (res.statusCode === 403) {
                    reject(new Error('GitHub API rate limit exceeded'));
                } else {
                    reject(new Error(`GitHub API error: ${res.statusCode}`));
                }
            });
            res.on('error', reject);
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    });
}

function githubGetRaw(filePath) {
    return new Promise((resolve, reject) => {
        const url = `https://raw.githubusercontent.com/${REPO_OWNER}/${REPO_NAME}/${BRANCH}/${filePath}`;
        const req = https.get(url, {
            headers: { 'User-Agent': 'Silva-MD-Bot-Updater' },
            timeout: 15000
        }, (res) => {
            if (res.statusCode === 200) {
                let data = '';
                res.on('data', chunk => data += chunk);
                res.on('end', () => resolve(data));
                res.on('error', reject);
            } else {
                reject(new Error(`HTTP ${res.statusCode}`));
            }
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Request timeout')); });
    });
}

async function getRemoteFileList(dirPath) {
    try {
        const data = await githubGet(`/repos/${REPO_OWNER}/${REPO_NAME}/contents/${dirPath}?ref=${BRANCH}`);
        if (Array.isArray(data)) {
            return data.filter(f => f.type === 'file').map(f => ({
                name: f.name,
                path: f.path,
                sha: f.sha,
                size: f.size
            }));
        }
        return [];
    } catch (e) {
        console.log(`[UPDATER] Failed to list ${dirPath}: ${e.message}`);
        return [];
    }
}

function getLocalFileSha(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf-8');
        const crypto = require('crypto');
        const header = `blob ${Buffer.byteLength(content)}\0`;
        const store = Buffer.concat([Buffer.from(header), Buffer.from(content)]);
        return crypto.createHash('sha1').update(store).digest('hex');
    } catch (e) {
        return null;
    }
}

async function checkForUpdates(logMessage) {
    if (isUpdating) {
        logMessage('INFO', '[UPDATER] Update already in progress, skipping');
        return { updated: [], added: [] };
    }

    isUpdating = true;
    const updated = [];
    const added = [];

    try {
        logMessage('INFO', '[UPDATER] Checking for updates from GitHub...');

        const remotePlugins = await getRemoteFileList('silvaxlab');

        for (const remoteFile of remotePlugins) {
            if (!remoteFile.name.endsWith('.js')) continue;

            const localPath = path.join(PLUGINS_DIR, remoteFile.name);
            const localExists = fs.existsSync(localPath);

            if (!localExists) {
                try {
                    const content = await githubGetRaw(remoteFile.path);
                    fs.writeFileSync(localPath, content, 'utf-8');
                    added.push(remoteFile.name);
                    logMessage('SUCCESS', `[UPDATER] New plugin added: ${remoteFile.name}`);
                } catch (e) {
                    logMessage('ERROR', `[UPDATER] Failed to download ${remoteFile.name}: ${e.message}`);
                }
                continue;
            }

            const localSha = getLocalFileSha(localPath);
            if (localSha && localSha !== remoteFile.sha) {
                try {
                    const content = await githubGetRaw(remoteFile.path);
                    const backupPath = localPath + '.bak';
                    fs.copyFileSync(localPath, backupPath);
                    fs.writeFileSync(localPath, content, 'utf-8');
                    updated.push(remoteFile.name);
                    logMessage('SUCCESS', `[UPDATER] Updated plugin: ${remoteFile.name}`);
                    try { fs.unlinkSync(backupPath); } catch (e) {}
                } catch (e) {
                    logMessage('ERROR', `[UPDATER] Failed to update ${remoteFile.name}: ${e.message}`);
                    const backupPath = localPath + '.bak';
                    if (fs.existsSync(backupPath)) {
                        fs.copyFileSync(backupPath, localPath);
                        try { fs.unlinkSync(backupPath); } catch (e) {}
                    }
                }
            }
        }

        const remoteLibs = await getRemoteFileList('lib');
        for (const remoteFile of remoteLibs) {
            if (!remoteFile.name.endsWith('.js')) continue;
            if (remoteFile.name === 'updater.js') continue;

            const localPath = path.join(LIB_DIR, remoteFile.name);
            const localExists = fs.existsSync(localPath);

            if (!localExists) {
                try {
                    const content = await githubGetRaw(remoteFile.path);
                    fs.writeFileSync(localPath, content, 'utf-8');
                    added.push(`lib/${remoteFile.name}`);
                    logMessage('SUCCESS', `[UPDATER] New lib added: ${remoteFile.name}`);
                } catch (e) {
                    logMessage('ERROR', `[UPDATER] Failed to download lib/${remoteFile.name}: ${e.message}`);
                }
            } else {
                const localSha = getLocalFileSha(localPath);
                if (localSha && localSha !== remoteFile.sha) {
                    try {
                        const content = await githubGetRaw(remoteFile.path);
                        fs.copyFileSync(localPath, localPath + '.bak');
                        fs.writeFileSync(localPath, content, 'utf-8');
                        updated.push(`lib/${remoteFile.name}`);
                        logMessage('SUCCESS', `[UPDATER] Updated lib: ${remoteFile.name}`);
                        try { fs.unlinkSync(localPath + '.bak'); } catch (e) {}
                    } catch (e) {
                        logMessage('ERROR', `[UPDATER] Failed to update lib/${remoteFile.name}: ${e.message}`);
                    }
                }
            }
        }

        lastCheck = new Date();

        if (updated.length > 0 || added.length > 0) {
            logMessage('SUCCESS', `[UPDATER] Update complete: ${updated.length} updated, ${added.length} new`);
        } else {
            logMessage('INFO', '[UPDATER] Everything is up to date');
        }

    } catch (e) {
        logMessage('ERROR', `[UPDATER] Update check failed: ${e.message}`);
    } finally {
        isUpdating = false;
    }

    return { updated, added };
}

function startAutoUpdate(logMessage, pluginManager) {
    logMessage('INFO', `[UPDATER] Auto-update enabled, checking every ${CHECK_INTERVAL / 60000} minutes`);

    setTimeout(async () => {
        const result = await checkForUpdates(logMessage);
        if ((result.updated.length > 0 || result.added.length > 0) && pluginManager) {
            logMessage('INFO', '[UPDATER] Reloading plugins after update...');
            await pluginManager.loadPlugins('silvaxlab');
        }
    }, 30000);

    setInterval(async () => {
        const result = await checkForUpdates(logMessage);
        if ((result.updated.length > 0 || result.added.length > 0) && pluginManager) {
            logMessage('INFO', '[UPDATER] Reloading plugins after update...');
            await pluginManager.loadPlugins('silvaxlab');
        }
    }, CHECK_INTERVAL);
}

function getStatus() {
    return {
        lastCheck,
        isUpdating,
        repo: `${REPO_OWNER}/${REPO_NAME}`,
        branch: BRANCH,
        interval: `${CHECK_INTERVAL / 60000} minutes`
    };
}

module.exports = { checkForUpdates, startAutoUpdate, getStatus };
