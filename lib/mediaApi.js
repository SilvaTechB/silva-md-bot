const express = require('express');
const ytSearch = require('yt-search');
const https = require('https');
const http = require('http');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const app = express();
const API_PORT = 3001;

const tmpDir = path.join(os.tmpdir(), 'silva-media');
if (!fs.existsSync(tmpDir)) fs.mkdirSync(tmpDir, { recursive: true });

function cleanOldFiles() {
    try {
        const files = fs.readdirSync(tmpDir);
        const now = Date.now();
        for (const file of files) {
            const fp = path.join(tmpDir, file);
            const stat = fs.statSync(fp);
            if (now - stat.mtimeMs > 10 * 60 * 1000) {
                fs.unlinkSync(fp);
            }
        }
    } catch (e) {}
}
setInterval(cleanOldFiles, 5 * 60 * 1000);

function downloadFile(url) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const request = mod.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' }, timeout: 30000 }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return downloadFile(res.headers.location).then(resolve).catch(reject);
            }
            if (res.statusCode !== 200) return reject(new Error(`HTTP ${res.statusCode}`));
            const chunks = [];
            res.on('data', chunk => chunks.push(chunk));
            res.on('end', () => resolve(Buffer.concat(chunks)));
            res.on('error', reject);
        });
        request.on('error', reject);
        request.on('timeout', () => { request.destroy(); reject(new Error('Timeout')); });
    });
}

function ytdlpDownload(url, format) {
    return new Promise((resolve, reject) => {
        const id = Date.now() + '_' + Math.random().toString(36).substr(2, 6);
        const ext = format === 'audio' ? 'mp3' : 'mp4';
        const outFile = path.join(tmpDir, `${id}.${ext}`);

        let args;
        if (format === 'audio') {
            args = `-x --audio-format mp3 --audio-quality 128K --no-playlist --max-filesize 25M -o "${outFile}" "${url}"`;
        } else {
            args = `-f "best[height<=720][filesize<50M]/best[height<=480]" --no-playlist --max-filesize 50M -o "${outFile}" "${url}"`;
        }

        exec(`yt-dlp ${args}`, { timeout: 120000, maxBuffer: 1024 * 1024 * 10 }, (err, stdout, stderr) => {
            if (err) {
                if (fs.existsSync(outFile)) fs.unlinkSync(outFile);
                return reject(new Error(stderr || err.message));
            }

            const finalFile = outFile.replace('.mp3', '.mp3').replace('.mp4', '.mp4');
            const possibleFiles = [outFile];
            const dir = fs.readdirSync(tmpDir);
            for (const f of dir) {
                if (f.startsWith(id)) possibleFiles.push(path.join(tmpDir, f));
            }

            for (const fp of possibleFiles) {
                if (fs.existsSync(fp) && fs.statSync(fp).size > 0) {
                    return resolve(fp);
                }
            }
            reject(new Error('Download completed but file not found'));
        });
    });
}

app.get('/api/ytSearch', async (req, res) => {
    try {
        const q = req.query.q;
        if (!q) return res.status(400).json({ error: 'Missing query parameter q' });
        const results = await ytSearch(q);
        const videos = (results.videos || []).slice(0, 10).map(v => ({
            title: v.title,
            url: v.url,
            videoId: v.videoId,
            thumbnail: v.thumbnail,
            duration: v.timestamp,
            seconds: v.seconds,
            views: v.views,
            author: v.author?.name || 'Unknown',
            ago: v.ago
        }));
        res.json({ status: true, results: videos });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/ytAudio', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: 'Missing url parameter' });

        try {
            const filePath = await ytdlpDownload(url, 'audio');
            res.setHeader('Content-Type', 'audio/mpeg');
            res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            stream.on('end', () => {
                try { fs.unlinkSync(filePath); } catch (e) {}
            });
            return;
        } catch (e) {
            console.log('[API] yt-dlp audio failed:', e.message);
        }

        const externalApis = [
            `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(url)}`,
            `https://api.dreaded.site/api/ytdl/audio?url=${encodeURIComponent(url)}`,
            `https://api.giftedtech.web.id/api/download/dlmp3?url=${encodeURIComponent(url)}`
        ];

        for (const api of externalApis) {
            try {
                const axios = require('axios');
                const { data } = await axios.get(api, { timeout: 30000 });
                const audioUrl = data.result?.downloadUrl || data.result?.download_url || data.result?.url || data.url;
                if (audioUrl) {
                    const buffer = await downloadFile(audioUrl);
                    res.setHeader('Content-Type', 'audio/mpeg');
                    res.setHeader('Content-Disposition', 'attachment; filename="audio.mp3"');
                    return res.send(buffer);
                }
            } catch (e) { continue; }
        }

        res.status(500).json({ error: 'All download methods failed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/ytVideo', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: 'Missing url parameter' });

        try {
            const filePath = await ytdlpDownload(url, 'video');
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            stream.on('end', () => {
                try { fs.unlinkSync(filePath); } catch (e) {}
            });
            return;
        } catch (e) {
            console.log('[API] yt-dlp video failed:', e.message);
        }

        const externalApis = [
            `https://api.ryzendesu.vip/api/downloader/ytmp4?url=${encodeURIComponent(url)}`,
            `https://api.dreaded.site/api/ytdl/video?url=${encodeURIComponent(url)}`
        ];

        for (const api of externalApis) {
            try {
                const axios = require('axios');
                const { data } = await axios.get(api, { timeout: 30000 });
                const videoUrl = data.result?.downloadUrl || data.result?.download_url || data.result?.url || data.url;
                if (videoUrl) {
                    const buffer = await downloadFile(videoUrl);
                    res.setHeader('Content-Type', 'video/mp4');
                    res.setHeader('Content-Disposition', 'attachment; filename="video.mp4"');
                    return res.send(buffer);
                }
            } catch (e) { continue; }
        }

        res.status(500).json({ error: 'All download methods failed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/tiktok', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: 'Missing url parameter' });

        try {
            const filePath = await ytdlpDownload(url, 'video');
            res.setHeader('Content-Type', 'video/mp4');
            res.setHeader('Content-Disposition', 'attachment; filename="tiktok.mp4"');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            stream.on('end', () => {
                try { fs.unlinkSync(filePath); } catch (e) {}
            });
            return;
        } catch (e) {
            console.log('[API] yt-dlp tiktok failed:', e.message);
        }

        res.status(500).json({ error: 'Download failed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/instagram', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: 'Missing url parameter' });

        try {
            const filePath = await ytdlpDownload(url, 'video');
            res.setHeader('Content-Type', 'video/mp4');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            stream.on('end', () => {
                try { fs.unlinkSync(filePath); } catch (e) {}
            });
            return;
        } catch (e) {
            console.log('[API] yt-dlp instagram failed:', e.message);
        }

        res.status(500).json({ error: 'Download failed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/facebook', async (req, res) => {
    try {
        const url = req.query.url;
        if (!url) return res.status(400).json({ error: 'Missing url parameter' });

        try {
            const filePath = await ytdlpDownload(url, 'video');
            res.setHeader('Content-Type', 'video/mp4');
            const stream = fs.createReadStream(filePath);
            stream.pipe(res);
            stream.on('end', () => {
                try { fs.unlinkSync(filePath); } catch (e) {}
            });
            return;
        } catch (e) {
            console.log('[API] yt-dlp facebook failed:', e.message);
        }

        res.status(500).json({ error: 'Download failed' });
    } catch (e) {
        res.status(500).json({ error: e.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', uptime: process.uptime(), memory: process.memoryUsage().heapUsed });
});

function startApi() {
    app.listen(API_PORT, '127.0.0.1', () => {
        console.log(`🌐 Silva Media API running on port ${API_PORT}`);
    });
}

module.exports = { startApi, API_PORT, app };
