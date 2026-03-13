'use strict';
const ytdl = require('ytdl-core');
const fs   = require('fs');
const path = require('path');
const os   = require('os');

module.exports = {
    commands:    ['ytmp3', 'ytsong', 'ytaudio', 'song'],
    description: 'Download YouTube audio as MP3',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !ytdl.validateURL(url)) {
            return sock.sendMessage(sender, {
                text: '🎵 Please provide a valid YouTube URL.\nExample: .ytmp3 https://youtu.be/dQw4w9WgXcQ',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Downloading audio...', contextInfo }, { quoted: message });
        const tmpPath = path.join(os.tmpdir(), `ytaudio_${Date.now()}.mp3`);
        try {
            const info    = await ytdl.getInfo(url);
            const details = info.videoDetails;
            await new Promise((resolve, reject) => {
                const stream = ytdl(url, { filter: 'audioonly', quality: 'highestaudio' });
                const out    = fs.createWriteStream(tmpPath);
                stream.pipe(out);
                stream.on('error', reject);
                out.on('finish', resolve);
                out.on('error', reject);
            });
            const stat = fs.statSync(tmpPath);
            if (stat.size < 1024) throw new Error('Audio file too small');
            await sock.sendMessage(sender, {
                audio:    fs.readFileSync(tmpPath),
                mimetype: 'audio/mpeg',
                ptt:      false,
                contextInfo
            }, { quoted: message });
            await sock.sendMessage(sender, {
                text: `🎵 *${details.title}*\n👤 ${details.author.name}  •  ⏱ ${Math.floor(details.lengthSeconds/60)}m ${details.lengthSeconds%60}s`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Audio download failed: ${e.message}`, contextInfo }, { quoted: message });
        } finally {
            if (fs.existsSync(tmpPath)) try { fs.unlinkSync(tmpPath); } catch {}
        }
    }
};
