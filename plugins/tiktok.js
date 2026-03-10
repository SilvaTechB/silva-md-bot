'use strict';

const axios    = require('axios');
const { pipeline } = require('stream');
const { promisify } = require('util');
const streamPipeline = promisify(pipeline);
const fs       = require('fs');
const os       = require('os');
const path     = require('path');

const ENDPOINTS = [
    {
        name: 'TikWM',
        url:  (u) => `https://tikwm.com/api/?url=${encodeURIComponent(u)}`,
        parse: (data) => {
            if (!data?.data?.play) return null;
            return { videoUrl: data.data.play, author: data.data.author, likes: data.data.digg_count };
        }
    },
    {
        name: 'Tiklydown',
        url:  (u) => `https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(u)}`,
        parse: (data) => {
            if (!data?.videoUrl) return null;
            return { videoUrl: data.videoUrl, author: data.author, likes: data.stats?.digg_count };
        }
    }
];

module.exports = {
    commands:    ['tiktok', 'tt', 'ttdl', 'tiktokdl'],
    description: 'Download a TikTok video without watermark',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const raw = args[0];
        const url = raw?.match(/(https?:\/\/[^\s]+)/)?.[0];

        if (!url || !/tiktok\.com|vt\.tiktok\.com/.test(url)) {
            return sock.sendMessage(sender, {
                text: '❌ Invalid TikTok URL!\n\nExample: .tiktok https://vt.tiktok.com/ZS...',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(sender, {
            text: '⏳ Processing TikTok video... (may take ~20 seconds)',
            contextInfo
        }, { quoted: message });

        let result = null;
        for (const ep of ENDPOINTS) {
            try {
                const { data } = await axios.get(ep.url(url), {
                    timeout: 25000,
                    headers: { 'User-Agent': 'Mozilla/5.0', Accept: 'application/json' }
                });
                result = ep.parse(data);
                if (result) { console.log(`[TikTok] Success via ${ep.name}`); break; }
            } catch (e) {
                console.warn(`[TikTok] ${ep.name} failed: ${e.message}`);
            }
        }

        if (!result) {
            return sock.sendMessage(sender, {
                text: '❌ All download methods failed. The video may be private or restricted.',
                contextInfo
            }, { quoted: message });
        }

        const tempPath = path.join(os.tmpdir(), `tiktok_${Date.now()}.mp4`);
        try {
            const res = await axios({ method: 'get', url: result.videoUrl, responseType: 'stream', timeout: 30000 });
            await streamPipeline(res.data, fs.createWriteStream(tempPath));

            const stat = fs.statSync(tempPath);
            if (stat.size < 1024) throw new Error('Downloaded file is too small');

            const videoCaption = `🎵 *TikTok*  •  👤 ${result.author?.nickname || result.author?.name || 'Unknown'}  •  ❤️ ${result.likes ?? 'N/A'}`;
            await sock.sendMessage(sender, {
                video:   fs.readFileSync(tempPath),
                caption: videoCaption,
                contextInfo
            }, { quoted: message });
        } finally {
            if (fs.existsSync(tempPath)) try { fs.unlinkSync(tempPath); } catch { /* ignore */ }
        }
    }
};
