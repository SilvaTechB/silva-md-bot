const axios = require('axios');

module.exports = {
    commands: ['ytmp3', 'song', 'music'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        if (!args[0]) {
            return sock.sendMessage(sender, {
                text: '❌ Usage: .ytmp3 <YouTube URL>',
                contextInfo
            }, { quoted: m });
        }

        const link = args[0];
        const apis = [
            `https://apis.davidcyriltech.my.id/youtube/mp3?url=${link}`,
            `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${link}`
        ];

        let audioUrl = null;
        let title = 'Unknown';
        let thumb = null;

        for (let api of apis) {
            try {
                const res = await axios.get(api, { timeout: 10000 });
                if (res.data && (res.data.result || res.data.data)) {
                    const data = res.data.result || res.data.data;
                    audioUrl = data.audio || data.download_url || data.url;
                    title = data.title || 'YouTube Audio';
                    thumb = data.thumbnail || data.thumb || null;
                    break;
                }
            } catch (err) {
                console.log(`API failed: ${api}`);
            }
        }

        if (!audioUrl) {
            return sock.sendMessage(sender, {
                text: '❌ Failed to fetch the audio. Try another link.',
                contextInfo
            }, { quoted: m });
        }

        const caption = `🎵 *Title:* ${title}\n🔗 *URL:* ${link}\n\n✅ Powered by Silva MD`;

        await sock.sendMessage(sender, {
            audio: { url: audioUrl },
            mimetype: 'audio/mpeg',
            ptt: false,
            contextInfo,
            caption
        }, { quoted: m });

        if (thumb) {
            await sock.sendMessage(sender, {
                image: { url: thumb },
                caption: `✅ Downloaded Successfully!\n${title}`,
                contextInfo
            }, { quoted: m });
        }
    }
};
