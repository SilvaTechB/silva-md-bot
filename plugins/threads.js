'use strict';
const axios = require('axios');

// nexoracle.com returns bot-protection HTML — removed.
// Trying savethreads.com API and instasave approach as primary.

module.exports = {
    commands:    ['threads', 'threadsdl'],
    description: 'Download Threads videos and images',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('threads.net')) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a valid Threads URL.\nExample: `.threads https://www.threads.net/@user/post/abc`',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Fetching Threads media...', contextInfo }, { quoted: message });

        const strategies = [
            // Strategy 1: IG/Threads embed API
            async () => {
                const postId = url.match(/\/post\/([A-Za-z0-9_-]+)/)?.[1];
                if (!postId) throw new Error('no id');
                const res = await axios.get(
                    `https://www.threads.net/api/graphql`,
                    {
                        params: {
                            lsd: 'AVqbxe3J_YA',
                            fb_api_caller_class: 'RelayModern',
                            variables: JSON.stringify({ postID: postId }),
                            server_timestamps: 'true',
                            doc_id: '7448594591874178',
                        },
                        headers: {
                            'User-Agent': 'Mozilla/5.0',
                            'X-FB-LSD': 'AVqbxe3J_YA',
                            'Content-Type': 'application/x-www-form-urlencoded',
                        },
                        timeout: 12000,
                    }
                );
                const media = res.data?.data?.data?.edges?.[0]?.node?.thread_items?.[0]?.post?.carousel_media
                    || [res.data?.data?.data?.edges?.[0]?.node?.thread_items?.[0]?.post];
                if (!media?.length || !media[0]) throw new Error('no media');
                return media.map(m => ({
                    url:  m?.video_versions?.[0]?.url || m?.image_versions2?.candidates?.[0]?.url,
                    type: m?.video_versions?.length ? 'video' : 'image'
                })).filter(m => m.url);
            },
            // Strategy 2: saveinsta.app public scraper
            async () => {
                const res = await axios.post('https://v3.saveinsta.app/api/ajaxSearch',
                    `q=${encodeURIComponent(url)}&t=media`,
                    { headers: { 'Content-Type': 'application/x-www-form-urlencoded', 'User-Agent': 'Mozilla/5.0' }, timeout: 15000 }
                );
                const links = (res.data?.data || []).map(item => ({
                    url:  item?.url,
                    type: item?.type === 'mp4' ? 'video' : 'image'
                })).filter(m => m.url);
                if (!links.length) throw new Error('no media');
                return links;
            },
        ];

        let items = null;
        for (const strat of strategies) {
            try {
                const result = await strat();
                if (result?.length && result[0]?.url) { items = result; break; }
            } catch {}
        }

        if (!items?.length) {
            return sock.sendMessage(sender, {
                text:
                    `❌ *Threads Download Failed*\n\n` +
                    `Use one of these free tools:\n\n` +
                    `🔗 https://savethreads.io\n` +
                    `🔗 https://www.snapinsta.app/threads\n\n` +
                    `_Paste your Threads link there_`,
                contextInfo
            }, { quoted: message });
        }

        for (const item of items.slice(0, 3)) {
            const isVideo = item.type === 'video';
            try {
                await sock.sendMessage(sender, {
                    [isVideo ? 'video' : 'image']: { url: item.url },
                    caption: `🧵 *Threads Download*\n_Powered by Silva MD_`,
                    contextInfo
                }, { quoted: message });
            } catch {}
        }
    }
};
