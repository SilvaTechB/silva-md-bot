'use strict';

const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { extractMessageText } = require('../lib/message-utils');

const API_ORIGIN = 'https://downloader.silvatechs.com';
const API_PATH = '/api/public/download';
const SUPPORTED_HOSTS = /(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com)/i;
const MAX_URL_LENGTH = 2048;
const MAX_QUERY_LENGTH = 200;
const AUTO_DOWNLOAD_FILE = path.join(__dirname, '..', 'data', 'auto-download.json');
const autoDownloadChats = new Set();

try {
    const saved = JSON.parse(fs.readFileSync(AUTO_DOWNLOAD_FILE, 'utf8'));
    for (const [jid, enabled] of Object.entries(saved || {})) if (enabled) autoDownloadChats.add(jid);
} catch { /* first run */ }

function saveAutoDownloadSettings() {
    try {
        fs.mkdirSync(path.dirname(AUTO_DOWNLOAD_FILE), { recursive: true });
        fs.writeFileSync(AUTO_DOWNLOAD_FILE, JSON.stringify(Object.fromEntries([...autoDownloadChats].map(jid => [jid, true])), null, 2));
    } catch (error) { console.warn(`[AutoDownload] settings save failed: ${error.message}`); }
}

function extractUrl(text) {
    const match = String(text || '').match(/(?:https?:\/\/)?(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com)\/[^\s<>]*/i);
    if (!match) return '';
    const value = match[0].replace(/[),.!?]+$/, '');
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}

function quotedInput(message) {
    const quoted = message?.message?.extendedTextMessage?.contextInfo?.quotedMessage
        || message?.message?.imageMessage?.contextInfo?.quotedMessage
        || message?.message?.videoMessage?.contextInfo?.quotedMessage;
    return extractMessageText(quoted) || message?.message?.extendedTextMessage?.contextInfo?.externalAdReply?.sourceUrl || '';
}

function absoluteStreamUrl(value) {
    if (!value || typeof value !== 'string') return '';
    try {
        return new URL(value, API_ORIGIN).toString();
    } catch {
        return '';
    }
}

function platformLabel(platform) {
    return (platform || 'social media').replace(/^./, c => c.toUpperCase());
}

function apiErrorMessage(error) {
    const status = error?.response?.status;
    if (status === 429) return 'The downloader is busy. Please wait a moment and try again.';
    if (status === 408) return 'The download timed out. Please try again shortly.';
    if (status === 422) return 'That post could not be resolved. Try a public post or a more specific link.';
    if (status === 424) return 'The source could not be fetched right now. Try another link later.';
    return error?.response?.data?.error || 'The downloader API is temporarily unavailable.';
}

module.exports = {
    commands: ['download', 'dl', 'socialdl', 'universal', 'autodl'],
    description: 'Download social media and optionally auto-send MP4 video plus MP3 audio',
    usage: '.download <url> [mp3|mp4] | .autodl on|off|status',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { sender, contextInfo, prefix = '.', reply, jid, isGroup, isAdmin, isOwner, silent } = ctx;
        const command = String(ctx.command || '').toLowerCase();
        if (command === 'autodl') {
            if (isGroup ? (!isAdmin && !isOwner) : !isOwner) {
                return reply('⛔ Only group admins or the owner can change auto-download settings.');
            }
            const action = String(args[0] || 'status').toLowerCase();
            if (action === 'on' || action === 'enable') {
                autoDownloadChats.add(jid); saveAutoDownloadSettings();
                return reply('✅ Auto-download enabled. Public social links will receive both MP4 video and MP3 audio.');
            }
            if (action === 'off' || action === 'disable') {
                autoDownloadChats.delete(jid); saveAutoDownloadSettings();
                return reply('⏸️ Auto-download disabled for this chat.');
            }
            return reply(`📥 Auto-download is *${autoDownloadChats.has(jid) ? 'ON' : 'OFF'}* for this chat.\n\nUse ".autodl on" or ".autodl off".`);
        }
        const argumentInput = args.join(' ').trim().replace(/^(?:download|dl|socialdl|universal)\s+/i, '');
        const quoted = quotedInput(message);
        const input = (argumentInput || quoted).trim();
        const searchMode = /^search\s+/i.test(input);
        const searchText = searchMode
            ? input.replace(/^search\s+/i, '').replace(/\s+(?:mp3|mp4)$/i, '').trim()
            : '';
        const url = searchMode ? '' : (extractUrl(input) || extractUrl(quoted));
        const formatArg = (args.at(-1) || '').toLowerCase();
        const format = formatArg === 'mp3' || formatArg === 'mp4' ? formatArg : 'mp4';

        if ((!url && !searchText) || (url && url.length > MAX_URL_LENGTH) || (searchText && searchText.length > MAX_QUERY_LENGTH)) {
            return reply([
                `📥 *Universal Downloader*`,
                '',
                `Usage: ${prefix}download <url> [mp3|mp4]`,
                `YouTube search: ${prefix}download search <name> [mp3|mp4]`,
                '',
                'Supported by this API: YouTube, TikTok, Instagram, Facebook, and X.',
                'Only public, accessible posts can be downloaded.'
            ].join('\n'));
        }

        if (url && !SUPPORTED_HOSTS.test(url)) {
            return reply('❌ Unsupported link. This API currently supports YouTube, TikTok, Instagram, Facebook, and X links.');
        }

        if (!silent) await reply(`⏳ Resolving ${searchMode ? 'YouTube search' : 'media'} as ${format.toUpperCase()}...`);

        const params = { format };
        if (url) params.url = url;
        else params.q = searchText;

        let payload;
        try {
            const response = await axios.get(`${API_ORIGIN}${API_PATH}`, {
                params,
                timeout: 45000,
                headers: { Accept: 'application/json', 'User-Agent': 'Silva-MD-Bot/1.0' }
            });
            payload = response.data;
        } catch (error) {
            console.warn(`[UniversalDownloader] API failed: ${error.message}`);
            return reply(`❌ ${apiErrorMessage(error)}`);
        }

        if (!payload?.status || !payload.result) {
            return reply(`❌ ${payload?.error || 'No downloadable media was returned.'}`);
        }

        const result = payload.result;
        const fileUrl = absoluteStreamUrl(result.download_url);
        if (!fileUrl) return reply('❌ The API returned an invalid temporary download link.');

        const title = result.title || 'Downloaded media';
        const platform = platformLabel(result.platform);
        const caption = [
            `📥 *${title}*`,
            `Platform: ${platform}`,
            `Format: ${(result.format || format).toUpperCase()}`,
            result.quality ? `Quality: ${result.quality}` : '',
            '',
            'Powered by Silva Tech Nexus downloader.'
        ].filter(Boolean).join('\n');

        try {
            if (result.type === 'audio' || result.format === 'mp3') {
                await sock.sendMessage(sender, {
                    audio: { url: fileUrl },
                    mimetype: 'audio/mpeg',
                    fileName: `${title.replace(/[^a-z0-9-_]+/gi, '_').slice(0, 80) || 'audio'}.mp3`,
                    contextInfo
                }, { quoted: message });
            } else if (result.type === 'image') {
                await sock.sendMessage(sender, { image: { url: fileUrl }, caption, contextInfo }, { quoted: message });
            } else {
                await sock.sendMessage(sender, { video: { url: fileUrl }, caption, contextInfo }, { quoted: message });
            }
        } catch (error) {
            console.warn(`[UniversalDownloader] media send failed: ${error.message}`);
            return reply('❌ The temporary media link expired or WhatsApp could not fetch it. Please retry the command.');
        }
    },

    onMessage: async (sock, message, text, ctx) => {
        if (!ctx?.jid || !autoDownloadChats.has(ctx.jid) || message?.key?.fromMe) return;
        const input = String(text || '').trim();
        // Explicit commands are handled by the normal downloader path and must
        // not trigger a second automatic video/audio pair.
        if (!input || /^[^a-zA-Z0-9]/.test(input) || /^(?:hey\s+)?(?:silva|agent|download|dl|autodl)\b/i.test(input)) return;
        const url = extractUrl(input);
        if (!url) return;
        if (typeof ctx.reply === 'function') await ctx.reply('⏳ Auto-download detected. Fetching MP4 video and MP3 audio...');
        await module.exports.run(sock, message, [url, 'mp4'], { ...ctx, silent: true, command: 'download' });
        await module.exports.run(sock, message, [url, 'mp3'], { ...ctx, silent: true, command: 'download' });
    },

    isAutoDownloadEnabled: jid => autoDownloadChats.has(jid)
};
