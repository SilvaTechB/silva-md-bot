'use strict';
const axios = require('axios');

module.exports = {
    commands:    ['reddit', 'rdl'],
    description: 'Download Reddit images and videos',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const url = args[0];
        if (!url || !url.includes('reddit.com')) {
            return sock.sendMessage(sender, {
                text: '❌ Please provide a valid Reddit URL.\nExample: .reddit https://reddit.com/r/sub/comments/abc/title/',
                contextInfo
            }, { quoted: message });
        }
        await sock.sendMessage(sender, { text: '⏳ Fetching Reddit media...', contextInfo }, { quoted: message });
        try {
            const jsonUrl = url.replace(/\/?$/, '') + '.json';
            const { data } = await axios.get(jsonUrl, {
                timeout: 20000,
                headers: { 'User-Agent': 'SilvaMD/1.0' }
            });
            const post = data?.[0]?.data?.children?.[0]?.data;
            if (!post) throw new Error('Could not fetch post data.');
            const title = post.title || 'Reddit Post';
            if (post.is_video && post.media?.reddit_video?.fallback_url) {
                const videoUrl = post.media.reddit_video.fallback_url.split('?')[0];
                await sock.sendMessage(sender, {
                    video: { url: videoUrl },
                    caption: `📤 *${title}*\n👍 ${post.ups} upvotes\n_Powered by Silva MD_`,
                    contextInfo
                }, { quoted: message });
            } else if (post.url && /\.(jpg|jpeg|png|gif|webp)$/i.test(post.url)) {
                await sock.sendMessage(sender, {
                    image: { url: post.url },
                    caption: `📤 *${title}*\n👍 ${post.ups} upvotes\n_Powered by Silva MD_`,
                    contextInfo
                }, { quoted: message });
            } else {
                await sock.sendMessage(sender, {
                    text: `📤 *${title}*\n\n${post.selftext ? post.selftext.slice(0, 500) : '(no text)'}\n\n👍 ${post.ups} upvotes`,
                    contextInfo
                }, { quoted: message });
            }
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Reddit fetch failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
