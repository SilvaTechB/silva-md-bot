'use strict';

const axios   = require('axios');
const { fmt, getStr } = require('../lib/theme');

function fmtNum(n) {
    if (n === undefined || n === null) return 'N/A';
    if (n >= 1_000_000_000) return (n / 1_000_000_000).toFixed(1) + 'B';
    if (n >= 1_000_000)     return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)         return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function barOf(value, max, len = 12) {
    if (!max) return '▱'.repeat(len);
    const filled = Math.round((value / max) * len);
    return '▰'.repeat(Math.min(filled, len)) + '▱'.repeat(Math.max(len - filled, 0));
}

module.exports = {
    commands:    ['tiktokstalk', 'ttstalk', 'tksearch', 'ttuser', 'tikstalk'],
    description: 'Stalk a TikTok profile — followers, videos, likes, bio and more',
    usage:       '.tiktokstalk <username>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        let username = args[0]?.replace(/^@/, '').trim();
        if (!username) {
            return reply(fmt('🎵 Please provide a TikTok username.\nExample: `.ttstalk charlidamelio`'));
        }

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { text: fmt(`⏳ Fetching TikTok profile for @${username}…`), contextInfo }, { quoted: message });

        let userData = null;
        const ENDPOINTS = [
            {
                name: 'TikWM',
                fetch: async () => {
                    const { data } = await axios.get(
                        `https://tikwm.com/api/user/info?unique_id=${encodeURIComponent(username)}`,
                        { timeout: 12000, headers: { 'User-Agent': 'Mozilla/5.0', 'Accept': 'application/json' } }
                    );
                    if (data?.code !== 0) throw new Error(data?.msg || 'TikWM error');
                    return data.data?.user;
                }
            },
        ];

        for (const ep of ENDPOINTS) {
            try {
                userData = await ep.fetch();
                if (userData) { console.log(`[TikTokStalk] Success via ${ep.name}`); break; }
            } catch (e) {
                console.warn(`[TikTokStalk] ${ep.name}: ${e.message}`);
            }
        }

        if (!userData) {
            return reply(fmt(`❌ TikTok user *@${username}* not found or profile is private.`));
        }

        const u = userData;

        // ── Derived stats ────────────────────────────────────────────────────
        const followers = u.fans  ?? u.followerCount  ?? 0;
        const following = u.following ?? u.followingCount ?? 0;
        const likes     = u.heart ?? u.heartCount ?? u.digg_count ?? 0;
        const videos    = u.video ?? u.videoCount ?? 0;
        const friends   = u.friend ?? u.friendCount ?? 0;
        const maxVal    = Math.max(followers, likes, 1);

        // ── Badge detection ──────────────────────────────────────────────────
        const badges = [];
        if (u.verified)              badges.push('✅ Verified');
        if (u.privateAccount)        badges.push('🔒 Private account');
        if (u.isUnderAge18)          badges.push('🔞 Under 18');
        if (u.openFavorite)          badges.push('⭐ Favorites public');
        if (u.commentSetting === 1)  badges.push('💬 Comments: Friends only');
        if (u.commentSetting === 2)  badges.push('💬 Comments: Off');
        if (!u.verified && followers > 1_000_000) badges.push('🚀 1M+ unverified mega creator');

        // ── Region ───────────────────────────────────────────────────────────
        const region = u.region || u.country || null;

        const lines = [];
        lines.push(`┌──────────────────────┐`);
        lines.push(`   🎵 *TikTok Profile Report*`);
        lines.push(`└──────────────────────┘`);
        lines.push('');

        lines.push(`*🆔 Identity*`);
        lines.push(`• *Username:* @${u.uniqueId || username}`);
        if (u.nickname)  lines.push(`• *Display Name:* ${u.nickname}`);
        if (u.id)        lines.push(`• *User ID:* \`${u.id}\``);
        if (region)      lines.push(`• *Region:* ${region}`);
        if (u.language)  lines.push(`• *Language:* ${u.language}`);
        lines.push('');

        if (u.signature) {
            lines.push(`*📝 Bio*`);
            lines.push(u.signature.slice(0, 300));
            lines.push('');
        }

        lines.push(`*📊 Stats*`);
        lines.push(`• *Followers:* ${fmtNum(followers)}  ${barOf(followers, maxVal)}`);
        lines.push(`• *Following:* ${fmtNum(following)}`);
        if (friends)    lines.push(`• *Friends:*   ${fmtNum(friends)}`);
        lines.push(`• *Likes (total received):* ❤️ ${fmtNum(likes)}  ${barOf(likes, maxVal)}`);
        lines.push(`• *Videos posted:* 🎬 ${fmtNum(videos)}`);
        if (followers && videos) {
            const ratio = Math.round(likes / videos);
            lines.push(`• *Avg likes/video:* ~${fmtNum(ratio)}`);
        }
        lines.push('');

        // ── Privacy & Settings ───────────────────────────────────────────────
        lines.push(`*⚙️ Account Settings*`);
        lines.push(`• *Private:* ${u.privateAccount ? '🔒 Yes' : '🔓 No'}`);
        lines.push(`• *Duet:* ${u.duetSetting === 0 ? '✅ Open' : u.duetSetting === 1 ? '👥 Friends' : '❌ Off'}`);
        lines.push(`• *Stitch:* ${u.stitchSetting === 0 ? '✅ Open' : u.stitchSetting === 1 ? '👥 Friends' : '❌ Off'}`);
        lines.push(`• *Comment:* ${u.commentSetting === 0 ? '✅ Everyone' : u.commentSetting === 1 ? '👥 Friends' : '❌ Off'}`);
        lines.push('');

        if (badges.length) {
            lines.push(`*🏷️ Badges*`);
            badges.forEach(b => lines.push(`• ${b}`));
            lines.push('');
        }

        lines.push(`• *Profile:* https://www.tiktok.com/@${u.uniqueId || username}`);
        lines.push(`_Powered by ${getStr('botName') || 'Silva MD'} · TikWM API_`);

        const avatarUrl = u.avatarLarger || u.avatarThumb || u.avatar || null;

        try {
            if (avatarUrl) {
                await sock.sendMessage(jid, {
                    image:      { url: avatarUrl },
                    caption:    fmt(lines.join('\n')),
                    contextInfo,
                }, { quoted: message });
            } else {
                await reply(fmt(lines.join('\n')));
            }
        } catch {
            await reply(fmt(lines.join('\n')));
        }

        await sock.sendPresenceUpdate('paused', jid);
    }
};
