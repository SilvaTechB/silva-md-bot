'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['mediafire', 'mf', 'mfdl'],
    description: 'Get MediaFire direct download link',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('mediafire.com')) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a valid MediaFire URL.\nExample: .mf https://www.mediafire.com/file/abc/filename/file',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Extracting MediaFire link...', contextInfo }, { quoted: message });
        try {
            const { data } = await axios.get(url, {
                timeout: 15000,
                headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' }
            });
            const match = data.match(/href="(https:\/\/download\d+\.mediafire\.com[^"]+)"/);
            if (!match) throw new Error('Could not extract download link. File may be removed.');
            const dlUrl   = match[1];
            const nameMatch = data.match(/<div class="filename">([^<]+)<\/div>/) ||
                              data.match(/class="dl-btn-label[^"]*">([^<]+)<\/span>/);
            const fileName = nameMatch ? nameMatch[1].trim() : 'file';
            await sock.sendMessage(sender, {
                text: `📁 *MediaFire Download*\n\n📄 *File:* ${fileName}\n🔗 *Link:* ${dlUrl}\n\n_Powered by Silva MD_`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ MediaFire failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
