'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['github', 'gh', 'gituser', 'gitrepo'],
    description: 'Look up a GitHub user profile or repository info',
    usage:       '.github [username]  |  .gitrepo [owner/repo]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const rawCmd = (
            message.message?.extendedTextMessage?.text ||
            message.message?.conversation || ''
        ).trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const query = args.join(' ').trim();
        if (!query) return reply('❌ *Usage:*\n• `.github [username]` — user profile\n• `.gitrepo [owner/repo]` — repository info');

        try {
            // ── Repo lookup ────────────────────────────────────────────────────
            if (rawCmd === 'gitrepo' || query.includes('/')) {
                const slug = query.replace(/^https?:\/\/github\.com\//, '').replace(/\/$/, '');
                const res  = await axios.get(`https://api.github.com/repos/${slug}`, { timeout: 10000 });
                const r    = res.data;

                const lines = [
                    `📦 *GitHub Repository*`,
                    ``,
                    `📌 *Name:* ${r.full_name}`,
                    `📝 *Description:* ${r.description || 'No description'}`,
                    `🌐 *URL:* ${r.html_url}`,
                    ``,
                    `⭐ Stars: ${(r.stargazers_count || 0).toLocaleString()}`,
                    `🍴 Forks: ${(r.forks_count || 0).toLocaleString()}`,
                    `👁️ Watchers: ${(r.watchers_count || 0).toLocaleString()}`,
                    `🐛 Open Issues: ${(r.open_issues_count || 0).toLocaleString()}`,
                    ``,
                    `💻 Language: ${r.language || 'N/A'}`,
                    `📄 License: ${r.license?.name || 'None'}`,
                    `🔒 Private: ${r.private ? 'Yes' : 'No'}`,
                    `📅 Created: ${new Date(r.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                    `🔄 Last Push: ${new Date(r.pushed_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
                ];

                if (r.topics?.length) lines.push(`🏷️ Topics: ${r.topics.slice(0, 6).join(', ')}`);

                return reply(lines.join('\n'));
            }

            // ── User profile lookup ────────────────────────────────────────────
            const [userRes, reposRes] = await Promise.allSettled([
                axios.get(`https://api.github.com/users/${query}`, { timeout: 10000 }),
                axios.get(`https://api.github.com/users/${query}/repos?sort=stars&per_page=5`, { timeout: 10000 })
            ]);

            if (userRes.status === 'rejected') {
                if (userRes.reason?.response?.status === 404) return reply(`❌ GitHub user *"${query}"* not found.`);
                throw userRes.reason;
            }

            const u    = userRes.value.data;
            const repos = reposRes.status === 'fulfilled' ? reposRes.value.data : [];

            const lines = [
                `👤 *GitHub Profile*`,
                ``,
                `📛 *Name:* ${u.name || u.login}`,
                `🔗 *Username:* @${u.login}`,
                `🌐 *URL:* ${u.html_url}`,
            ];

            if (u.bio)      lines.push(`📝 *Bio:* ${u.bio}`);
            if (u.company)  lines.push(`🏢 *Company:* ${u.company}`);
            if (u.location) lines.push(`📍 *Location:* ${u.location}`);
            if (u.blog)     lines.push(`🔗 *Website:* ${u.blog}`);

            lines.push(
                ``,
                `📦 Public Repos: ${u.public_repos || 0}`,
                `👥 Followers: ${(u.followers || 0).toLocaleString()}`,
                `➡️ Following: ${(u.following || 0).toLocaleString()}`,
                `📅 Joined: ${new Date(u.created_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}`,
            );

            if (repos.length > 0) {
                lines.push('', `🌟 *Top Repositories:*`);
                for (const r of repos) {
                    lines.push(`  • ${r.name} — ⭐${r.stargazers_count} | ${r.language || 'N/A'}`);
                }
            }

            return reply(lines.join('\n'));

        } catch (e) {
            if (e.response?.status === 404) return reply(`❌ Not found on GitHub: *"${query}"*`);
            if (e.response?.status === 403) return reply('⚠️ GitHub rate limit reached. Try again in a minute.');
            return reply(`❌ GitHub lookup failed: ${e.message}`);
        }
    }
};
