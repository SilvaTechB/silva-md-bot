'use strict';

const fs = require('fs');
const os = require('os');
const path = require('path');
const ffmpeg = require('fluent-ffmpeg');
const { dlBuffer } = require('../lib/dlmedia');

function mediaTarget(message) {
    const msg = message?.message || {};
    const quoted = msg?.extendedTextMessage?.contextInfo?.quotedMessage || {};
    const direct = msg.videoMessage || msg.audioMessage || msg.imageMessage;
    const quotedMedia = quoted.videoMessage || quoted.audioMessage || quoted.imageMessage;
    const target = direct || quotedMedia;
    if (!target) return null;
    return {
        target,
        type: msg.videoMessage || quoted.videoMessage ? 'video'
            : msg.audioMessage || quoted.audioMessage ? 'audio' : 'image'
    };
}

function runFfmpeg(input, output, configure) {
    return new Promise((resolve, reject) => {
        const command = configure(ffmpeg(input));
        command.on('end', resolve).on('error', reject).save(output);
    });
}

async function processMedia(sock, message, ctx, options) {
    const { jid, contextInfo, reply } = ctx;
    const source = mediaTarget(message);
    if (!source || (options.types && !options.types.includes(source.type))) {
        return reply(options.usage);
    }

    const id = `${process.pid}_${Date.now()}_${Math.random().toString(16).slice(2)}`;
    const input = path.join(os.tmpdir(), `silva_media_${id}.input`);
    const output = path.join(os.tmpdir(), `silva_media_${id}.${options.outputExt}`);
    try {
        await sock.sendMessage(jid, { text: `⏳ ${options.progress}`, contextInfo }, { quoted: message });
        fs.writeFileSync(input, await dlBuffer(source.target, source.type));
        await runFfmpeg(input, output, options.configure);
        const data = fs.readFileSync(output);
        const payload = options.output === 'audio'
            ? { audio: data, mimetype: 'audio/mpeg', ptt: false, contextInfo }
            : { video: data, mimetype: 'video/mp4', caption: options.caption, contextInfo };
        await sock.sendMessage(jid, payload, { quoted: message });
    } catch (error) {
        console.error(`[MediaEffects:${options.name}]`, error.message);
        await reply(`❌ ${options.name} failed: ${error.message}`);
    } finally {
        for (const file of [input, output]) {
            try { if (fs.existsSync(file)) fs.unlinkSync(file); } catch { /* best effort */ }
        }
    }
}

const videoTypes = ['video'];

module.exports = {
    commands: ['mp3crusher', 'mp4image', 'mp4reverse', 'slowmo', 'spectrum', 'x2mp4', 'x4mp4'],
    description: 'Video and audio effects adapted from the legacy plugin archive',
    usage: '.mp4reverse / .slowmo / .spectrum / .x2mp4 / .x4mp4 (reply to media)',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const cmd = String(ctx.command || '').toLowerCase();
        const common = { sock, message, ctx };
        if (cmd === 'mp3crusher') return processMedia(sock, message, ctx, {
            ...common, name: 'Audio crusher', output: 'audio', outputExt: 'mp3',
            types: ['video', 'audio'], progress: 'Applying an audio crusher effect…',
            usage: '🎛️ Reply to a video or audio with `.mp3crusher`.',
            configure: input => input.noVideo().audioCodec('libmp3lame').audioFilters('acrusher=level_in=8:level_out=18:bits=8:mode=log:aa=1').audioBitrate(128)
        });
        if (cmd === 'mp4image') return processMedia(sock, message, ctx, {
            ...common, name: 'Photo-to-video', output: 'video', outputExt: 'mp4',
            types: ['image'], progress: 'Converting the image to a short video…',
            usage: '🖼️ Reply to an image with `.mp4image`.', caption: '🎞️ Image converted to video',
            configure: input => input.inputOptions(['-loop', '1']).duration(4).videoCodec('libx264').outputOptions(['-pix_fmt', 'yuv420p', '-movflags', 'faststart'])
        });
        if (cmd === 'mp4reverse') return processMedia(sock, message, ctx, {
            ...common, name: 'Reverse video', output: 'video', outputExt: 'mp4', types: videoTypes,
            progress: 'Reversing the video…', usage: '↩️ Reply to a video with `.mp4reverse`.', caption: '↩️ Reversed video',
            configure: input => input.videoFilters('reverse').audioFilters('areverse').videoCodec('libx264').audioCodec('aac').outputOptions('-movflags', 'faststart')
        });
        if (cmd === 'slowmo') return processMedia(sock, message, ctx, {
            ...common, name: 'Slow motion', output: 'video', outputExt: 'mp4', types: videoTypes,
            progress: 'Creating slow motion…', usage: '🐢 Reply to a video with `.slowmo`.', caption: '🐢 Slow-motion video',
            configure: input => input.videoFilters('setpts=2*PTS').audioFilters('atempo=0.5').videoCodec('libx264').audioCodec('aac')
        });
        if (cmd === 'spectrum') return processMedia(sock, message, ctx, {
            ...common, name: 'Audio spectrum', output: 'video', outputExt: 'mp4', types: ['video', 'audio'],
            progress: 'Rendering the audio spectrum…', usage: '📊 Reply to audio or video with `.spectrum`.', caption: '📊 Audio spectrum',
            configure: input => input.videoFilters('showspectrum=s=720x720:mode=combined:color=rainbow,format=yuv420p').audioCodec('aac').videoCodec('libx264')
        });
        const scale = cmd === 'x4mp4' ? 'trunc(iw*0.25/2)*2:trunc(ih*0.25/2)*2' : 'trunc(iw*0.5/2)*2:trunc(ih*0.5/2)*2';
        if (cmd === 'x2mp4' || cmd === 'x4mp4') return processMedia(sock, message, ctx, {
            ...common, name: cmd === 'x4mp4' ? '25% video resize' : '50% video resize', output: 'video', outputExt: 'mp4', types: videoTypes,
            progress: 'Resizing the video…', usage: `📉 Reply to a video with ".${cmd}".`, caption: `📉 ${cmd === 'x4mp4' ? '25%' : '50%'} resized video`,
            configure: input => input.videoFilters(`scale=${scale}`).videoCodec('libx264').audioCodec('aac').outputOptions('-movflags', 'faststart')
        });
        return ctx.reply('❌ Unknown media effect. Try `.mp4reverse`, `.slowmo`, `.spectrum`, `.mp3crusher`, `.x2mp4`, or `.x4mp4`.');
    }
};
