'use strict';
const axios = require('axios');

// meme-api.com is dead (500 errors / no response) — removed.
// Using imgflip.com/get_memes (confirmed working 2026-06) as primary.
// Reddit JSON fallback secondary.

async function getImgflipMeme() {
    const res = await axios.get('https://api.imgflip.com/get_memes', {
        headers: { 'User-Agent': 'SilvaMD-Bot/2.0' },
        timeout: 8000
    });
    const memes = res.data?.data?.memes;
    if (!memes?.length) throw new Error('no memes');
    return memes[Math.floor(Math.random() * Math.min(memes.length, 50))];
}

async function getRedditMeme(sub) {
    const res = await axios.get(
        `https://www.reddit.com/r/${encodeURIComponent(sub)}/random/.json`,
        {
            headers: { 'User-Agent': 'SilvaMD-Bot/2.0' },
            timeout: 10000
        }
    );
    const posts = res.data?.[0]?.data?.children || res.data?.data?.children;
    const post  = Array.isArray(posts) ? posts[0]?.data : null;
    if (!post?.url || !post.url.match(/\.(jpg|jpeg|png|gif|webp)$/i)) throw new Error('no image');
    return {
        url:       post.url,
        title:     post.title,
        author:    post.author,
        subreddit: post.subreddit,
        ups:       post.ups,
    };
}

module.exports = {
    commands:    ['meme', 'memes'],
    description: 'Get a random meme image',
    usage:       '.meme [subreddit]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;
        const sub = args[0] || 'memes';

        await sock.sendPresenceUpdate('composing', jid);

        // 1. Try Reddit JSON (community subreddits)
        try {
            const meme = await getRedditMeme(sub);
            await sock.sendMessage(jid, {
                image:   { url: meme.url },
                caption: `😂 *${meme.title.slice(0, 150)}*\n\n👤 u/${meme.author}  •  r/${meme.subreddit}  •  👍 ${(meme.ups || 0).toLocaleString()}`,
                contextInfo
            }, { quoted: message });
            return;
        } catch {}

        // 2. Imgflip template thumbnails (always works, not a "meme" per se but an image)
        try {
            const meme = await getImgflipMeme();
            await sock.sendMessage(jid, {
                image:   { url: meme.url },
                caption: `😂 *${meme.name}*\n\n_Template from Imgflip_`,
                contextInfo
            }, { quoted: message });
            return;
        } catch {}

        await sock.sendMessage(jid, {
            text: `😂 Couldn't fetch a meme right now. Try again or check r/memes:\nhttps://www.reddit.com/r/memes`,
            contextInfo
        }, { quoted: message });
    }
};
