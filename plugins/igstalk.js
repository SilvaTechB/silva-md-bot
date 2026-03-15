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

// ─── Instagram profile fetchers (multiple approaches) ─────────────────────────
async function fetchViaWebProfileInfo(username) {
    const { data } = await axios.get(
        `https://i.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(username)}`,
        {
            timeout: 12000,
            headers: {
                'User-Agent':    'Instagram 275.0.0.27.98 Android (33/13; 420dpi; 1080x2400; samsung; SM-G991B; o1s; exynos2100; en_US; 458229258)',
                'Accept':        'application/json',
                'x-ig-app-id':   '936619743392459',
                'Accept-Language': 'en-US,en;q=0.9',
            }
        }
    );
    const u = data?.data?.user;
    if (!u) throw new Error('No user data');
    return u;
}

async function fetchViaOEmbed(username) {
    // oEmbed only works for specific post URLs, not profiles
    // But we can check if the profile exists via a known post
    throw new Error('oEmbed does not support profile lookups');
}

module.exports = {
    commands:    ['igstalk', 'instastalk', 'iginfo', 'instagramstalk'],
    description: 'Stalk an Instagram profile — followers, bio, posts and more',
    usage:       '.igstalk <username>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        let username = args[0]?.replace(/^@/, '').trim();
        if (!username) {
            return reply(fmt('📸 Please provide an Instagram username.\nExample: `.igstalk cristiano`'));
        }

        await sock.sendPresenceUpdate('composing', jid);
        await sock.sendMessage(jid, { text: fmt(`⏳ Fetching Instagram profile for @${username}…`), contextInfo }, { quoted: message });

        let rawUser = null;

        try {
            rawUser = await fetchViaWebProfileInfo(username);
        } catch (e) {
            console.warn('[IGStalk] web_profile_info:', e.message);

            if (e.response?.status === 404) {
                return reply(fmt(`❌ Instagram user *@${username}* not found.`));
            }

            if (e.response?.status === 429 || e.code === 'ECONNABORTED') {
                return reply(fmt(
                    `⏳ *Instagram is rate-limiting this request.*\n\n` +
                    `Instagram heavily restricts automated lookups from shared server IPs.\n\n` +
                    `💡 *Try:*\n` +
                    `• Wait a few minutes and try again\n` +
                    `• Check the profile directly: https://www.instagram.com/${username}/`
                ));
            }

            return reply(fmt(`❌ Failed to fetch Instagram profile: ${e.message}`));
        }

        const u = rawUser;

        const followers = u.edge_followed_by?.count ?? 0;
        const following = u.edge_follow?.count       ?? 0;
        const posts     = u.edge_owner_to_timeline_media?.count ?? 0;
        const maxVal    = Math.max(followers, following, 1);

        const isBiz     = u.is_business_account;
        const category  = u.business_category_name || u.category_name || null;

        const badges = [];
        if (u.is_verified)          badges.push('✅ Verified');
        if (u.is_private)           badges.push('🔒 Private account');
        if (isBiz)                  badges.push('🏢 Business account');
        if (u.is_joined_recently)   badges.push('🆕 Recently joined');
        if (u.is_professional_account) badges.push('💼 Professional');
        if (!u.is_verified && followers >= 1_000_000) badges.push('🚀 1M+ mega creator');

        const lines = [];
        lines.push(`┌──────────────────────┐`);
        lines.push(`   📸 *Instagram Profile Report*`);
        lines.push(`└──────────────────────┘`);
        lines.push('');

        lines.push(`*🆔 Identity*`);
        lines.push(`• *Username:* @${u.username}`);
        if (u.full_name)        lines.push(`• *Full Name:* ${u.full_name}`);
        if (u.id)               lines.push(`• *User ID:* \`${u.id}\``);
        if (category)           lines.push(`• *Category:* ${category}`);
        if (u.connected_fb_page) lines.push(`• *Facebook Page:* ${u.connected_fb_page}`);
        lines.push('');

        if (u.biography) {
            lines.push(`*📝 Bio*`);
            lines.push(u.biography.slice(0, 300));
            if (u.external_url) lines.push(`🔗 ${u.external_url}`);
            lines.push('');
        }

        lines.push(`*📊 Stats*`);
        lines.push(`• *Followers:* ${fmtNum(followers)}  ${barOf(followers, maxVal)}`);
        lines.push(`• *Following:* ${fmtNum(following)}  ${barOf(following, maxVal)}`);
        lines.push(`• *Posts:* 🖼️ ${fmtNum(posts)}`);
        if (followers && following) {
            const ratio = (followers / Math.max(following, 1)).toFixed(1);
            lines.push(`• *F/F Ratio:* ${ratio}x`);
        }
        lines.push('');

        if (isBiz && (u.business_email || u.business_phone_number || u.business_address_json)) {
            lines.push(`*🏢 Business Info*`);
            if (u.business_email)        lines.push(`• *Email:* ${u.business_email}`);
            if (u.business_phone_number) lines.push(`• *Phone:* ${u.business_phone_number}`);
            try {
                const addr = JSON.parse(u.business_address_json || '{}');
                if (addr.city_name) lines.push(`• *City:* ${addr.city_name}`);
            } catch { /* ignore */ }
            lines.push('');
        }

        lines.push(`*⚙️ Account Settings*`);
        lines.push(`• *Private:* ${u.is_private ? '🔒 Yes' : '🔓 No'}`);
        lines.push(`• *Business:* ${isBiz ? '🏢 Yes' : '👤 No'}`);
        lines.push(`• *Has Story:* ${u.has_stories ? '🟢 Active' : '⚪ None'}`);
        lines.push(`• *Highlight Count:* ${u.highlight_reel_count ?? 0}`);
        lines.push(`• *Profile pic:* ${u.profile_pic_url ? '✅ Set' : '❌ Default'}`);
        lines.push('');

        if (badges.length) {
            lines.push(`*🏷️ Badges*`);
            badges.forEach(b => lines.push(`• ${b}`));
            lines.push('');
        }

        lines.push(`• *Profile:* https://www.instagram.com/${u.username}/`);
        lines.push(`_Powered by ${getStr('botName') || 'Silva MD'} · Instagram API_`);

        const picUrl = u.profile_pic_url_hd || u.profile_pic_url || null;

        try {
            if (picUrl) {
                await sock.sendMessage(jid, {
                    image:   { url: picUrl },
                    caption: fmt(lines.join('\n')),
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
