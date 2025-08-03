const { writeFile } = require('fs').promises;
const { spawn } = require('child_process');
const path = require('path');

module.exports = {
    commands: ['sticker', 's'],
    handler: async ({ sock, m, sender, contextInfo }) => {
        if (!m.message.imageMessage) {
            return sock.sendMessage(sender, { text: '❌ Send an image with caption .sticker', contextInfo }, { quoted: m });
        }
        const buffer = await sock.downloadMediaMessage(m);
        const input = path.join(__dirname, 'input.jpg');
        const output = path.join(__dirname, 'output.webp');
        await writeFile(input, buffer);

        spawn('ffmpeg', ['-i', input, '-vf', 'scale=512:512:force_original_aspect_ratio=decrease', output])
            .on('close', async () => {
                await sock.sendMessage(sender, { sticker: { url: output }, contextInfo }, { quoted: m });
            });
    }
};