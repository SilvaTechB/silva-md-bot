'use strict';

const ffmpeg     = require('fluent-ffmpeg');
const { Readable } = require('stream');
const fs         = require('fs');
const path       = require('path');
const os         = require('os');

module.exports = {
    commands:    ['toaudio', 'tomp3', 'tovn', 'audio'],
    description: 'Convert a video or voice message to an audio file',
    usage:       '.toaudio (reply to a video or audio message)',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const msg = message.message;
        const hasVideo = msg?.videoMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
        const hasAudio = msg?.audioMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.audioMessage;

        if (!hasVideo && !hasAudio) {
            return sock.sendMessage(jid, {
                text: '❌ Reply to a *video* or *audio* message with `.toaudio`',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(jid, { text: '⏳ Converting to audio…', contextInfo }, { quoted: message });

        try {
            const buffer = await sock.downloadMediaMessage(message);
            const inputPath  = path.join(os.tmpdir(), `silva_in_${Date.now()}`);
            const outputPath = path.join(os.tmpdir(), `silva_out_${Date.now()}.mp3`);

            fs.writeFileSync(inputPath, buffer);

            await new Promise((resolve, reject) => {
                ffmpeg(inputPath)
                    .noVideo()
                    .audioCodec('libmp3lame')
                    .audioBitrate(128)
                    .output(outputPath)
                    .on('end', resolve)
                    .on('error', reject)
                    .run();
            });

            const audio = fs.readFileSync(outputPath);
            fs.unlinkSync(inputPath);
            fs.unlinkSync(outputPath);

            await sock.sendMessage(jid, {
                audio,
                mimetype: 'audio/mpeg',
                ptt:      false
            }, { quoted: message });

        } catch (e) {
            await sock.sendMessage(jid, { text: `❌ Conversion failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
