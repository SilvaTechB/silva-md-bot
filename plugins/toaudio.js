'use strict';

const ffmpeg       = require('fluent-ffmpeg');
const fs           = require('fs');
const path         = require('path');
const os           = require('os');
const { fmt }      = require('../lib/theme');
const { dlBuffer } = require('../lib/dlmedia');

module.exports = {
    commands:    ['toaudio', 'tomp3', 'tovn', 'audio'],
    description: 'Convert a video or voice message to an MP3 audio file',
    usage:       '.toaudio (reply to a video or audio message)',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        const msg    = message.message;
        const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

        // Detect the actual media source and type
        const vidDirect  = msg?.videoMessage;
        const audDirect  = msg?.audioMessage;
        const vidQuoted  = quoted?.videoMessage;
        const audQuoted  = quoted?.audioMessage;

        const target    = vidDirect || vidQuoted || audDirect || audQuoted;
        const mediaType = (vidDirect || vidQuoted) ? 'video' : (audDirect || audQuoted) ? 'audio' : null;

        if (!target || !mediaType) {
            return reply(fmt('❌ Reply to a *video* or *audio/voice* message with `.toaudio`'));
        }

        await sock.sendMessage(jid, { text: fmt('⏳ Converting to audio…'), contextInfo }, { quoted: message });

        const inputPath  = path.join(os.tmpdir(), `silva_in_${Date.now()}`);
        const outputPath = path.join(os.tmpdir(), `silva_out_${Date.now()}.mp3`);

        try {
            await sock.sendPresenceUpdate('composing', jid);

            const buffer = await dlBuffer(target, mediaType);
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

            await sock.sendMessage(jid, {
                audio,
                mimetype: 'audio/mpeg',
                ptt:      false
            }, { quoted: message });

            await sock.sendPresenceUpdate('paused', jid);

        } catch (err) {
            console.error('[ToAudio]', err.message);
            await reply(fmt(`❌ Conversion failed: ${err.message}`));
        } finally {
            if (fs.existsSync(inputPath))  try { fs.unlinkSync(inputPath);  } catch { /* ignore */ }
            if (fs.existsSync(outputPath)) try { fs.unlinkSync(outputPath); } catch { /* ignore */ }
        }
    }
};
