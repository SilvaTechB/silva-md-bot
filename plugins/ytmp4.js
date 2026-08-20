'use strict';
const ytdl = require('ytdl-core');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

module.exports = {
    commands:    ['ytmp4', 'ytvideo', 'ytv'],
    description: 'Download YouTube video (360p/720p)',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url     = args[0];
        const quality = args[1] === '720' ? '136' : '18';
        if (!url || !ytdl.validateURL(url)) {
            return sock.sendMessage(sender, {
                text: '🎬 Please provide a valid YouTube URL.\nExample: .ytmp4 https://youtu.be/dQw4w9WgXcQ [720]\n_Default quality: 360p. Add 720 for HD._',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: `⏳ Downloading video (${args[1] === '720' ? '720p' : '360p'})...`, contextInfo }, { quoted: message });
        const tmpPath = path.join(os.tmpdir(), `ytvid_${Date.now()}.mp4`);
        try {
            const info    = await ytdl.getInfo(url);
            const details = info.videoDetails;
            if (details.lengthSeconds > 600) {
                return sock.sendMessage(sender, { text: '❌ Video too long (max 10 minutes). Use .ytmp3 for audio.', contextInfo }, { quoted: message });
            }
            await new Promise((resolve, reject) => {
                const stream = ytdl(url, { quality });
                const out    = fs.createWriteStream(tmpPath);
                stream.pipe(out);
                stream.on('error', reject);
                out.on('finish', resolve);
                out.on('error', reject);
            });
            await sock.sendMessage(sender, {
                video:   fs.readFileSync(tmpPath),
                caption: `▶️ *${details.title}*\n👤 ${details.author.name}  •  ⏱ ${Math.floor(details.lengthSeconds/60)}m ${details.lengthSeconds%60}s`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Video download failed: ${e.message}`, contextInfo }, { quoted: message });
        } finally {
            if (fs.existsSync(tmpPath)) try { fs.unlinkSync(tmpPath); } catch {}
        }
    }
};
