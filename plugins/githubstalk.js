'use strict';

const axios   = require('axios');
const { fmt, getStr } = require('../lib/theme');

function fmtNum(n) {
    if (!n && n !== 0) return 'N/A';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

function fmtDate(str) {
    if (!str) return 'N/A';
    return new Date(str).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
}

function barOf(value, max, len = 10) {
    if (!max) return '▱'.repeat(len);
    const filled = Math.round((value / max) * len);
    return '▰'.repeat(Math.min(filled, len)) + '▱'.repeat(Math.max(len - filled, 0));
}

module.exports = {
    commands:    ['githubstalk', 'ghstalk', 'github', 'gh'],
    description: 'Stalk a GitHub profile — repos, stars, bio, activity and more',
    usage:       '.ghstalk <username>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { jid, contextInfo, reply }) => {
        const username = args[0]?.replace(/^@/, '').trim();
        if (!username) {
            return reply(fmt('🐙 Please provide a GitHub username.\nExample: `.ghstalk torvalds`'));
        }

        await sock.sendPresenceUpdate('composing', jid);

        const headers = {
            'User-Agent': 'SilvaMD-Bot/2.0',
            'Accept':     'application/vnd.github+json',
        };

        let user, repos = [], orgs = [];

        try {
            const [userRes, reposRes, orgsRes] = await Promise.allSettled([
                axios.get(`https://api.github.com/users/${encodeURIComponent(username)}`, { headers, timeout: 10000 }),
                axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/repos?sort=updated&per_page=5&type=owner`, { headers, timeout: 10000 }),
                axios.get(`https://api.github.com/users/${encodeURIComponent(username)}/orgs?per_page=5`, { headers, timeout: 10000 }),
            ]);

            if (userRes.status === 'rejected') {
                const status = userRes.reason?.response?.status;
                if (status === 404) return reply(fmt(`❌ GitHub user *${username}* not found.`));
                throw userRes.reason;
            }

            user  = userRes.value.data;
            repos = reposRes.status === 'fulfilled' ? reposRes.value.data : [];
            orgs  = orgsRes.status  === 'fulfilled' ? orgsRes.value.data  : [];

        } catch (err) {
            console.error('[GitHubStalk]', err.message);
            return reply(fmt(`❌ Failed to fetch GitHub profile: ${err.message}`));
        }

        // ── Stats ───────────────────────────────────────────────────────────
        const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
        const topLangs   = [...new Set(repos.map(r => r.language).filter(Boolean))].slice(0, 4).join(', ') || 'N/A';

        // ── Account type & badges ────────────────────────────────────────────
        const badges = [];
        if (user.site_admin)       badges.push('⭐ GitHub Staff');
        if (user.type === 'Organization') badges.push('🏢 Organization');
        if (user.hireable)         badges.push('💼 Open to work');
        if (user.twitter_username) badges.push(`🐦 @${user.twitter_username}`);

        // ── Build message ────────────────────────────────────────────────────
        const lines = [];
        lines.push(`┌──────────────────────┐`);
        lines.push(`   🐙 *GitHub Profile Report*`);
        lines.push(`└──────────────────────┘`);
        lines.push('');

        lines.push(`*👤 Identity*`);
        lines.push(`• *Username:* @${user.login}`);
        if (user.name)     lines.push(`• *Name:* ${user.name}`);
        if (user.company)  lines.push(`• *Company:* ${user.company.trim()}`);
        if (user.location) lines.push(`• *Location:* 📍 ${user.location}`);
        if (user.email)    lines.push(`• *Email:* ${user.email}`);
        if (user.blog)     lines.push(`• *Website:* ${user.blog}`);
        lines.push(`• *Type:* ${user.type}`);
        lines.push(`• *Joined:* ${fmtDate(user.created_at)}`);
        lines.push(`• *Updated:* ${fmtDate(user.updated_at)}`);
        lines.push('');

        if (user.bio) {
            lines.push(`*📝 Bio*`);
            lines.push(user.bio.slice(0, 300));
            lines.push('');
        }

        lines.push(`*📊 Stats*`);
        lines.push(`• *Followers:*  ${fmtNum(user.followers)}  ${barOf(user.followers, Math.max(user.followers, user.following))}`);
        lines.push(`• *Following:*  ${fmtNum(user.following)}  ${barOf(user.following, Math.max(user.followers, user.following))}`);
        lines.push(`• *Public Repos:* ${fmtNum(user.public_repos)}`);
        lines.push(`• *Public Gists:* ${fmtNum(user.public_gists)}`);
        lines.push(`• *⭐ Stars (top 5):* ${fmtNum(totalStars)}`);
        lines.push('');

        if (repos.length) {
            lines.push(`*📦 Latest Repos (top 5)*`);
            for (const r of repos) {
                const lang  = r.language ? ` · ${r.language}` : '';
                const stars = r.stargazers_count ? ` ⭐${fmtNum(r.stargazers_count)}` : '';
                const forks = r.forks_count       ? ` 🍴${fmtNum(r.forks_count)}`       : '';
                lines.push(`• *${r.name}*${lang}${stars}${forks}`);
                if (r.description) lines.push(`  _${r.description.slice(0, 80)}_`);
            }
            lines.push(`• *Top Languages:* ${topLangs}`);
            lines.push('');
        }

        if (orgs.length) {
            lines.push(`*🏢 Organizations*`);
            lines.push(orgs.map(o => `@${o.login}`).join('  •  '));
            lines.push('');
        }

        if (badges.length) {
            lines.push(`*🏷️ Badges*`);
            badges.forEach(b => lines.push(`• ${b}`));
            lines.push('');
        }

        lines.push(`• *Profile:* https://github.com/${user.login}`);
        lines.push(`_Powered by ${getStr('botName') || 'Silva MD'} · GitHub API_`);

        try {
            await sock.sendMessage(jid, {
                image:      { url: user.avatar_url },
                caption:    fmt(lines.join('\n')),
                contextInfo,
            }, { quoted: message });
        } catch {
            await reply(fmt(lines.join('\n')));
        }

        await sock.sendPresenceUpdate('paused', jid);
    }
};
