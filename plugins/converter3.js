'use strict';

const axios  = require('axios');
const { fmt } = require('../lib/theme');
const { dlBuffer } = require('../lib/dlmedia');

module.exports = {
    commands: ['toimg', 'toptt', 'tovideo', 'sendaudio', 'sendvideo', 'snack', 'play', 'ig', 'fb', 'video'],
    description: 'Additional converters and downloaders',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const cmd  = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const text = args.join(' ').trim();
        const send = (t) => sock.sendMessage(jid, { text: fmt(t), contextInfo }, { quoted: message });

        await sock.sendPresenceUpdate('composing', jid);

        if (cmd === 'toimg') {
            const msg    = message.message;
            const webpMsg = msg?.stickerMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.stickerMessage;
            const imgMsg  = msg?.imageMessage   || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;

            if (!webpMsg && !imgMsg) return send('❌ Reply to a *sticker* or *image* with `.toimg` to convert it.');
            const target = webpMsg || imgMsg;
            const type   = webpMsg ? 'sticker' : 'image';
            const buf    = await dlBuffer(target, type).catch(() => null);
            if (!buf) return send('❌ Could not download the file.');
            await sock.sendMessage(jid, { image: buf, caption: fmt('🖼️ Converted to Image'), contextInfo }, { quoted: message });
            return;
        }

        if (cmd === 'toptt') {
            const msg    = message.message;
            const audMsg = msg?.audioMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;
            if (!audMsg) return send('❌ Reply to an *audio* or *voice message* with `.toptt`\n\nSends any audio as a voice note (PTT).');
            const buf = await dlBuffer(audMsg, 'audio').catch(() => null);
            if (!buf) return send('❌ Could not download audio.');
            await sock.sendMessage(jid, { audio: buf, mimetype: 'audio/ogg; codecs=opus', ptt: true, contextInfo }, { quoted: message });
            return;
        }

        if (cmd === 'tovideo') {
            const msg    = message.message;
            const gifMsg = msg?.videoMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
            if (!gifMsg) return send('❌ Reply to a *video or GIF* with `.tovideo` to convert/send as video.');
            const buf = await dlBuffer(gifMsg, 'video').catch(() => null);
            if (!buf) return send('❌ Could not download video.');
            await sock.sendMessage(jid, { video: buf, mimetype: 'video/mp4', caption: fmt('🎥 Video'), contextInfo }, { quoted: message });
            return;
        }

        if (cmd === 'sendaudio') {
            if (!text) return send('❌ *Usage:* `.sendaudio <audio url>`\n\nSends any audio from URL as a voice note.');
            try {
                const res = await axios.get(text, { responseType: 'arraybuffer', timeout: 30000 });
                await sock.sendMessage(jid, { audio: Buffer.from(res.data), mimetype: 'audio/ogg; codecs=opus', ptt: true, contextInfo }, { quoted: message });
            } catch { return send('❌ Failed to download audio from URL.'); }
            return;
        }

        if (cmd === 'sendvideo') {
            if (!text) return send('❌ *Usage:* `.sendvideo <video url>`\n\nSends any video from URL.');
            try {
                const res = await axios.get(text, { responseType: 'arraybuffer', timeout: 60000 });
                await sock.sendMessage(jid, { video: Buffer.from(res.data), mimetype: 'video/mp4', caption: fmt('🎥 Video'), contextInfo }, { quoted: message });
            } catch { return send('❌ Failed to download video from URL.'); }
            return;
        }

        if (cmd === 'ig' || cmd === 'fb') {
            const url = text;
            if (!url || (!url.includes('instagram.com') && !url.includes('facebook.com') && !url.includes('fb.com') && !url.includes('fb.watch'))) {
                return send(`❌ *Usage:* \`.${cmd} <${cmd === 'ig' ? 'instagram' : 'facebook'} url>\``);
            }
            try {
                const apis = cmd === 'ig' ? [
                    `https://api.siputzx.my.id/api/d/igdl?url=${encodeURIComponent(url)}`,
                    `https://api.ryzendesu.vip/api/downloader/igdl?url=${encodeURIComponent(url)}`
                ] : [
                    `https://api.siputzx.my.id/api/d/fbdl?url=${encodeURIComponent(url)}`,
                    `https://api.ryzendesu.vip/api/downloader/fb?url=${encodeURIComponent(url)}`
                ];

                let dlUrl = null;
                for (const api of apis) {
                    try {
                        const res = await axios.get(api, { timeout: 15000 });
                        dlUrl = res.data?.data?.[0]?.url || res.data?.result?.url ||
                                res.data?.url || res.data?.data?.url || res.data?.video_url;
                        if (dlUrl) break;
                    } catch {}
                }

                if (!dlUrl) return send(`❌ Could not extract download link.\n\n_Try: https://snapsave.app_`);

                const vidBuf = await axios.get(dlUrl, { responseType: 'arraybuffer', timeout: 60000 });
                await sock.sendMessage(jid, {
                    video: Buffer.from(vidBuf.data),
                    mimetype: 'video/mp4',
                    caption: fmt(`📥 Downloaded from ${cmd === 'ig' ? 'Instagram' : 'Facebook'}`),
                    contextInfo
                }, { quoted: message });
            } catch { return send(`❌ Download failed.\n\n_Try: https://snapsave.app for Instagram or https://fbdown.net for Facebook_`); }
            return;
        }

        if (cmd === 'snack') {
            if (!text) return send('❌ *Usage:* `.snack <snackvideo url>`');
            return send('⚠️ Snack Video downloader requires paid API. Try SnapTik or SaveFrom.net for now.');
        }

        if (cmd === 'play') {
            if (!text) return send('❌ *Usage:* `.play <song name>`\n\nDownloads audio from YouTube.');
            try {
                const searchRes = await axios.get(`https://api.siputzx.my.id/api/search/youtube?q=${encodeURIComponent(text)}`, { timeout: 15000 });
                const first = searchRes.data?.data?.[0];
                if (!first) return send(`❌ No results for: *${text}*`);
                const ytUrl = first.url || `https://youtube.com/watch?v=${first.videoId}`;
                const dlRes = await axios.get(`https://api.siputzx.my.id/api/d/ytmp3?url=${encodeURIComponent(ytUrl)}`, { timeout: 30000 });
                const audioUrl = dlRes.data?.data?.url || dlRes.data?.url;
                if (!audioUrl) return send(`❌ Could not get audio for: *${first.title || text}*`);
                const audioBuf = await axios.get(audioUrl, { responseType: 'arraybuffer', timeout: 60000 });
                await sock.sendMessage(jid, {
                    audio: Buffer.from(audioBuf.data),
                    mimetype: 'audio/mpeg',
                    contextInfo
                }, { quoted: message });
                await send(`🎵 *${first.title || text}*\n⏱ ${first.duration || 'N/A'}`);
            } catch { return send(`❌ Failed to download audio for: *${text}*\n\nTry \`.ytmp3 <youtube url>\` with a direct URL.`); }
            return;
        }

        if (cmd === 'video') {
            if (!text) return send('❌ *Usage:* `.video <youtube url or search term>`\n\nDownloads video from YouTube.');
            try {
                let ytUrl = text;
                if (!text.includes('youtube.com') && !text.includes('youtu.be')) {
                    const searchRes = await axios.get(`https://api.siputzx.my.id/api/search/youtube?q=${encodeURIComponent(text)}`, { timeout: 15000 });
                    ytUrl = searchRes.data?.data?.[0]?.url || text;
                }
                const dlRes = await axios.get(`https://api.siputzx.my.id/api/d/ytmp4?url=${encodeURIComponent(ytUrl)}`, { timeout: 30000 });
                const videoUrl = dlRes.data?.data?.url || dlRes.data?.url;
                if (!videoUrl) return send(`❌ Could not get video. Try \`.ytmp4 <url>\` with a direct URL.`);
                const vidBuf = await axios.get(videoUrl, { responseType: 'arraybuffer', timeout: 120000 });
                await sock.sendMessage(jid, {
                    video: Buffer.from(vidBuf.data), mimetype: 'video/mp4',
                    caption: fmt(`🎥 ${text}`), contextInfo
                }, { quoted: message });
            } catch { return send(`❌ Failed to download video.\n\nUse \`.ytmp4 <youtube url>\` for a direct URL.`); }
            return;
        }
    }
};
