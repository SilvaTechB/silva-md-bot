'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['capcut', 'capcutdl'],
    description: 'Download CapCut videos',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('capcut')) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a valid CapCut URL.\nExample: .capcut https://www.capcut.com/share/...',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Downloading CapCut video...', contextInfo }, { quoted: message });
        try {
            const api = `https://api.nexoracle.com/downloaders/capcut?url=${encodeURIComponent(url)}&apikey=free_for_use`;
            const { data } = await axios.get(api, { timeout: 25000, headers: { 'User-Agent': 'Mozilla/5.0' } });
            const result   = data?.result || data?.data;
            const videoUrl = result?.video || result?.url || result?.download;
            if (!videoUrl) throw new Error('No video found.');
            await sock.sendMessage(sender, {
                video:   { url: videoUrl },
                caption: `✂️ *CapCut Download*\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ CapCut download failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
