'use strict';

const axios = require('axios');

const API_ORIGIN = 'https://downloader.silvatechs.com';
const API_PATH = '/api/public/download';
const SUPPORTED_HOSTS = /(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com)/i;
const MAX_URL_LENGTH = 2048;
const MAX_QUERY_LENGTH = 200;

function extractUrl(text) {
    return text.match(/https?:\/\/[^\s<>]+/i)?.[0]?.replace(/[),.!?]+$/, '') || '';
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
    commands: ['download', 'dl', 'socialdl', 'universal'],
    description: 'Download public media from YouTube, TikTok, Instagram, Facebook, and X',
    usage: '.download <url> [mp3|mp4] | .download search <YouTube name> [mp3|mp4]',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { sender, contextInfo, prefix = '.', reply } = ctx;
        const input = args.join(' ').trim();
        const searchMode = /^search\s+/i.test(input);
        const searchText = searchMode
            ? input.replace(/^search\s+/i, '').replace(/\s+(?:mp3|mp4)$/i, '').trim()
            : '';
        const url = searchMode ? '' : extractUrl(input);
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

        await reply(`⏳ Resolving ${searchMode ? 'YouTube search' : 'media'} as ${format.toUpperCase()}...`);

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
    }
};
