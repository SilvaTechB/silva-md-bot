'use strict';

/**
 * BGM — Add background music to a video
 *
 * Usage:
 *   1. Send a video  + quote an audio/voice    → adds quoted audio as BGM
 *   2. Send an audio + quote a video           → adds current audio as BGM to quoted video
 *   3. Reply to a video with audio attached    → same as above
 *   4. .bgm --vol 40   to set BGM volume (default 30%)
 *   5. .bgm --replace  to fully replace original audio instead of mixing
 */

const ffmpeg      = require('fluent-ffmpeg');
const fs          = require('fs');
const path        = require('path');
const os          = require('os');
const { fmt }     = require('../lib/theme');
const { dlBuffer } = require('../lib/dlmedia');

// ─── Parse flags from args ───────────────────────────────────────────────────
function parseFlags(args) {
    let vol     = 30;       // BGM volume % (0–100)
    let replace = false;    // replace original audio entirely

    for (let i = 0; i < args.length; i++) {
        if (args[i] === '--vol' && args[i + 1]) {
            const v = parseInt(args[i + 1], 10);
            if (!isNaN(v) && v >= 0 && v <= 100) vol = v;
        }
        if (args[i] === '--replace') replace = true;
    }

    return { vol: vol / 100, replace };
}

// ─── Run ffmpeg and return the output path ───────────────────────────────────
function mergeMedia(videoPath, audioPath, outputPath, { vol, replace }) {
    return new Promise((resolve, reject) => {
        const cmd = ffmpeg()
            .input(videoPath)
            .input(audioPath);

        if (replace) {
            // Replace original audio entirely with BGM, loop BGM if shorter
            cmd
                .complexFilter([
                    `[1:a]volume=${vol}[bgm]`,
                ])
                .outputOptions([
                    '-map 0:v',
                    '-map [bgm]',
                    '-shortest',
                    '-c:v copy',
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                ]);
        } else {
            // Mix original audio with BGM
            cmd
                .complexFilter([
                    `[0:a]volume=1.0[orig]`,
                    `[1:a]volume=${vol}[bgm]`,
                    `[orig][bgm]amix=inputs=2:duration=first:dropout_transition=3[out]`,
                ])
                .outputOptions([
                    '-map 0:v',
                    '-map [out]',
                    '-shortest',
                    '-c:v copy',
                    '-c:a aac',
                    '-b:a 128k',
                    '-movflags +faststart',
                ]);
        }

        cmd
            .output(outputPath)
            .on('start', cmd => console.log('[BGM] ffmpeg:', cmd.slice(0, 120)))
            .on('end',   ()  => resolve(outputPath))
            .on('error', err => reject(err))
            .run();
    });
}

// ─── For silent videos (no audio track): just add BGM as the only track ──────
function addAudioToSilentVideo(videoPath, audioPath, outputPath, { vol }) {
    return new Promise((resolve, reject) => {
        ffmpeg()
            .input(videoPath)
            .input(audioPath)
            .complexFilter([`[1:a]volume=${vol}[bgm]`])
            .outputOptions([
                '-map 0:v',
                '-map [bgm]',
                '-shortest',
                '-c:v copy',
                '-c:a aac',
                '-b:a 128k',
                '-movflags +faststart',
            ])
            .output(outputPath)
            .on('end',   ()  => resolve(outputPath))
            .on('error', err => reject(err))
            .run();
    });
}

// ─── Check if a video file has an audio stream ───────────────────────────────
function hasAudioStream(videoPath) {
    return new Promise((resolve) => {
        ffmpeg.ffprobe(videoPath, (err, meta) => {
            if (err) return resolve(false);
            const hasAudio = meta?.streams?.some(s => s.codec_type === 'audio');
            resolve(!!hasAudio);
        });
    });
}

// ─── Main plugin ─────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['bgm', 'addmusic', 'videomusic', 'musicvideo', 'addbgm'],
    description: 'Add background music to a video. Reply to a video with audio (or vice versa).',
    usage: [
        '.bgm              → reply to video + send audio (or vice versa)',
        '.bgm --vol 50     → set BGM volume (0–100, default 30)',
        '.bgm --replace    → replace original audio instead of mixing',
    ].join('\n'),
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        const flags   = parseFlags(args);
        const msg     = message.message;
        const quoted  = msg?.extendedTextMessage?.contextInfo?.quotedMessage;

        // ── Detect video and audio sources ───────────────────────────────────
        //
        // We accept:
        //   current = video  →  quoted = audio
        //   current = audio  →  quoted = video
        //   current = video  →  args has nothing (show help)

        const curVid  = msg?.videoMessage;
        const curAud  = msg?.audioMessage;
        const qVid    = quoted?.videoMessage;
        const qAud    = quoted?.audioMessage;

        let videoMsg  = null;
        let audioMsg  = null;
        let videoSrc  = 'video';   // for dlBuffer
        let audioSrc  = 'audio';

        if (curVid && qAud) {
            videoMsg = curVid;
            audioMsg = qAud;
        } else if (curAud && qVid) {
            videoMsg = qVid;
            audioMsg = curAud;
        } else if (curVid && curAud) {
            // both in the same message — less common but handle it
            videoMsg = curVid;
            audioMsg = curAud;
        } else {
            return reply(fmt(
                `🎵 *BGM — Add Background Music to a Video*\n\n` +
                `*How to use:*\n` +
                `• Send a video and quote an audio/voice message with \`.bgm\`\n` +
                `• OR send an audio and quote a video with \`.bgm\`\n\n` +
                `*Options:*\n` +
                `• \`.bgm --vol 50\`   → BGM volume 50% (default: 30%)\n` +
                `• \`.bgm --replace\`  → replace original audio entirely\n\n` +
                `_Both video and audio must be present as quoted or attached._`
            ));
        }

        await sock.sendPresenceUpdate('composing', jid);

        const volPct    = Math.round(flags.vol * 100);
        const modeLabel = flags.replace ? '🔄 Replace mode' : `🎚️ Mix mode (BGM vol: ${volPct}%)`;
        const wait = await sock.sendMessage(jid, {
            text: fmt(`⏳ Processing BGM…\n${modeLabel}`),
            contextInfo
        }, { quoted: message });

        const tmpId      = Date.now();
        const videoPath  = path.join(os.tmpdir(), `bgm_vid_${tmpId}.mp4`);
        const audioPath  = path.join(os.tmpdir(), `bgm_aud_${tmpId}.mp3`);
        const outputPath = path.join(os.tmpdir(), `bgm_out_${tmpId}.mp4`);

        const cleanup = () => {
            for (const f of [videoPath, audioPath, outputPath]) {
                if (fs.existsSync(f)) try { fs.unlinkSync(f); } catch { /* ignore */ }
            }
        };

        try {
            // ── Download video and audio in parallel ─────────────────────────
            await sock.sendMessage(jid, { text: fmt('📥 Downloading media…'), contextInfo }, { quoted: message });

            const [vidBuf, audBuf] = await Promise.all([
                dlBuffer(videoMsg, 'video'),
                dlBuffer(audioMsg, 'audio'),
            ]);

            fs.writeFileSync(videoPath, vidBuf);
            fs.writeFileSync(audioPath, audBuf);

            // ── Probe for audio stream ────────────────────────────────────────
            await sock.sendMessage(jid, { text: fmt('🔧 Merging audio…'), contextInfo }, { quoted: message });

            const videoHasAudio = await hasAudioStream(videoPath);

            if (!videoHasAudio || flags.replace) {
                await addAudioToSilentVideo(videoPath, audioPath, outputPath, flags);
            } else {
                await mergeMedia(videoPath, audioPath, outputPath, flags);
            }

            const outBuf  = fs.readFileSync(outputPath);
            const sizeMB  = (outBuf.length / 1_048_576).toFixed(2);

            // ── Delete waiting messages ───────────────────────────────────────
            if (wait) await sock.sendMessage(jid, { delete: wait.key }).catch(() => {});

            // ── Send result ───────────────────────────────────────────────────
            await sock.sendMessage(jid, {
                video:   outBuf,
                caption: fmt(
                    `🎵 *BGM Applied!*\n\n` +
                    `🎚️ *Mode:* ${flags.replace ? 'Replace' : 'Mix'}\n` +
                    `🔊 *BGM Volume:* ${volPct}%\n` +
                    `📦 *File size:* ${sizeMB} MB`
                ),
                contextInfo,
            }, { quoted: message });

            await sock.sendPresenceUpdate('paused', jid);

        } catch (err) {
            console.error('[BGM]', err.message);
            if (wait) await sock.sendMessage(jid, { delete: wait.key }).catch(() => {});
            await reply(fmt(`❌ BGM failed: ${err.message}`));
        } finally {
            cleanup();
        }
    }
};
