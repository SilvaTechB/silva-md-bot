'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['gdrive', 'googledrive', 'gdl'],
    description: 'Get direct download link from Google Drive',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('drive.google.com')) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a Google Drive URL.\nExample: .gdrive https://drive.google.com/file/d/FILE_ID/view',
                contextInfo
            }, { quoted: message });
        }
        try {
            const idMatch = url.match(/[-\w]{25,}/);
            if (!idMatch) throw new Error('Could not extract file ID.');
            const fileId  = idMatch[0];
            const dlLink  = `https://drive.google.com/uc?export=download&id=${fileId}`;
            const confirm = `https://drive.google.com/uc?export=download&confirm=t&id=${fileId}`;
            const { headers } = await axios.head(dlLink, { timeout: 10000, maxRedirects: 3 });
            const fileName = (headers['content-disposition'] || '').match(/filename="?([^"]+)"?/)?.[1] || fileId;
            const size     = headers['content-length'] ? `${(parseInt(headers['content-length']) / 1024 / 1024).toFixed(2)} MB` : 'Unknown';
            await sock.sendMessage(sender, {
                text: `📁 *Google Drive File*\n\n📄 *Name:* ${fileName}\n📦 *Size:* ${size}\n🔗 *Download:* ${confirm}\n\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Google Drive failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
