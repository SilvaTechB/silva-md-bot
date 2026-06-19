'use strict';

const axios = require('axios');
const { fmt } = require('../lib/theme');

const GH_ORG   = 'SilvaTechB';
const GH_HDRS  = { 'User-Agent': 'SilvaMD-Bot/2.0', 'Accept': 'application/vnd.github+json' };

function fmtNum(n) {
    if (!n && n !== 0) return '0';
    if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + 'M';
    if (n >= 1_000)     return (n / 1_000).toFixed(1) + 'K';
    return String(n);
}

const WRITE_DENY_PATTERN = /\b(create|new\s+repo|init|push|commit|delete|remove|fork\s+to|transfer|rename|archive|unarchive|publish|release\s+new|deploy|write|update\s+file|edit\s+file)\b/i;

module.exports = {
    commands:    ['silvatech', 'silvarepos', 'silvafiles', 'svrepo'],
    description: 'Browse SilvaTechB GitHub repos (read-only) — list, stats, fetch files, download zip',
    usage:       '.silvatech [repo] [file path]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo, reply } = ctx;
        const input = args.join(' ').trim();

        // ── Block any write/mutate intent ───────────────────────────────────
        if (WRITE_DENY_PATTERN.test(input)) {
            return reply(fmt(
                `⛔ *Write Operations Denied*\n\n` +
                `This command only provides *read-only* access to the SilvaTechB GitHub.\n\n` +
                `Allowed:\n` +
                `• \`.silvatech\` — list all repos\n` +
                `• \`.silvatech <repo>\` — repo details & stats\n` +
                `• \`.silvatech <repo> <file>\` — fetch a file\n` +
                `• \`.silvatech zip <repo>\` — download link\n\n` +
                `_No write, create, delete, or push operations are permitted._`
            ));
        }

        await sock.sendPresenceUpdate('composing', jid);

        // ── .silvatech zip <repo> ───────────────────────────────────────────
        if (args[0]?.toLowerCase() === 'zip' && args[1]) {
            const repoName = args[1];
            const zipUrl = `https://github.com/${GH_ORG}/${repoName}/archive/refs/heads/main.zip`;
            const altUrl = `https://github.com/${GH_ORG}/${repoName}/archive/refs/heads/master.zip`;
            try {
                await axios.head(`https://api.github.com/repos/${GH_ORG}/${encodeURIComponent(repoName)}`, { headers: GH_HDRS, timeout: 8000 });
                return reply(fmt(
                    `📦 *Download: ${repoName}*\n\n` +
                    `🔗 *Main branch ZIP:*\n${zipUrl}\n\n` +
                    `🔗 *Master branch ZIP (alt):*\n${altUrl}\n\n` +
                    `_Tap the link to download the repository as a ZIP archive._`
                ));
            } catch (err) {
                if (err.response?.status === 404) return reply(fmt(`❌ Repository *${repoName}* not found in SilvaTechB.`));
                return reply(fmt(`❌ Could not verify repo: ${err.message}`));
            }
        }

        // ── .silvatech <repo> <file path> ────────────────────────────────────
        if (args.length >= 2 && args[0] && !args[0].startsWith('http')) {
            const repoName  = args[0];
            const filePath  = args.slice(1).join('/');
            try {
                const res = await axios.get(
                    `https://api.github.com/repos/${GH_ORG}/${encodeURIComponent(repoName)}/contents/${encodeURIComponent(filePath)}`,
                    { headers: GH_HDRS, timeout: 12000 }
                );
                const file = res.data;
                if (file.type === 'dir') {
                    const items = (Array.isArray(file) ? file : [file]);
                    const listing = items.map(f => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`).join('\n');
                    return reply(fmt(`📁 *${repoName}/${filePath}*\n\n${listing}`));
                }
                if (Array.isArray(res.data)) {
                    const listing = res.data.map(f => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`).join('\n');
                    return reply(fmt(`📁 *${repoName}/${filePath}*\n\n${listing || '_(empty)_'}`));
                }
                if (file.encoding === 'base64' && file.content) {
                    const content = Buffer.from(file.content, 'base64').toString('utf8');
                    const preview = content.length > 2000 ? content.slice(0, 2000) + '\n\n_...truncated (file is larger than 2000 chars)_' : content;
                    return reply(fmt(
                        `📄 *${repoName}/${filePath}*\n` +
                        `📏 Size: ${fmtNum(file.size)} bytes\n` +
                        `🔗 ${file.html_url}\n\n` +
                        `\`\`\`\n${preview}\n\`\`\``
                    ));
                }
                return reply(fmt(
                    `📄 *${repoName}/${filePath}*\n` +
                    `📏 Size: ${fmtNum(file.size)} bytes\n` +
                    `🔗 ${file.html_url}\n` +
                    `⬇️ Download: ${file.download_url || 'N/A'}`
                ));
            } catch (err) {
                if (err.response?.status === 404) return reply(fmt(`❌ File or repo not found:\n\`${repoName}/${filePath}\``));
                return reply(fmt(`❌ Could not fetch file: ${err.message}`));
            }
        }

        // ── .silvatech <repo> — repo details ─────────────────────────────────
        if (args.length === 1 && args[0]) {
            const repoName = args[0];
            try {
                const [repoRes, langRes, contRes] = await Promise.allSettled([
                    axios.get(`https://api.github.com/repos/${GH_ORG}/${encodeURIComponent(repoName)}`, { headers: GH_HDRS, timeout: 10000 }),
                    axios.get(`https://api.github.com/repos/${GH_ORG}/${encodeURIComponent(repoName)}/languages`, { headers: GH_HDRS, timeout: 8000 }),
                    axios.get(`https://api.github.com/repos/${GH_ORG}/${encodeURIComponent(repoName)}/contents`, { headers: GH_HDRS, timeout: 8000 }),
                ]);

                if (repoRes.status === 'rejected') {
                    if (repoRes.reason?.response?.status === 404) return reply(fmt(`❌ Repository *${repoName}* not found in SilvaTechB.`));
                    throw repoRes.reason;
                }

                const r    = repoRes.value.data;
                const langs = langRes.status === 'fulfilled' ? Object.keys(langRes.value.data).slice(0, 5) : [];
                const files  = contRes.status === 'fulfilled' ? contRes.value.data : [];

                const topFiles = Array.isArray(files)
                    ? files.slice(0, 8).map(f => `${f.type === 'dir' ? '📁' : '📄'} ${f.name}`).join('\n')
                    : '';

                const lines = [
                    `🐙 *${r.full_name}*`,
                    '',
                    r.description ? `📝 ${r.description}` : null,
                    '',
                    `*📊 Stats*`,
                    `• ⭐ Stars: *${fmtNum(r.stargazers_count)}*`,
                    `• 🍴 Forks: *${fmtNum(r.forks_count)}*`,
                    `• 👁️ Watchers: *${fmtNum(r.watchers_count)}*`,
                    `• 🐛 Issues: *${fmtNum(r.open_issues_count)}*`,
                    `• 🌿 Default branch: *${r.default_branch}*`,
                    `• 📅 Created: *${new Date(r.created_at).toLocaleDateString('en-GB')}*`,
                    `• 🔄 Updated: *${new Date(r.updated_at).toLocaleDateString('en-GB')}*`,
                    langs.length ? `• 💻 Languages: *${langs.join(', ')}*` : null,
                    r.license?.name ? `• 📜 License: *${r.license.name}*` : null,
                    '',
                    topFiles ? `*📁 Root Files*\n${topFiles}` : null,
                    '',
                    `*🔗 Links*`,
                    `• Repo: ${r.html_url}`,
                    `• ZIP: https://github.com/${GH_ORG}/${repoName}/archive/refs/heads/${r.default_branch}.zip`,
                    '',
                    `_Use \`.silvatech ${repoName} <filepath>\` to read a file_`,
                    `_Use \`.silvatech zip ${repoName}\` for download links_`,
                ].filter(l => l !== null);

                return reply(fmt(lines.join('\n')));
            } catch (err) {
                return reply(fmt(`❌ Error fetching repo: ${err.message}`));
            }
        }

        // ── .silvatech — list all repos ───────────────────────────────────────
        try {
            const [orgRes, reposRes] = await Promise.allSettled([
                axios.get(`https://api.github.com/users/${GH_ORG}`, { headers: GH_HDRS, timeout: 10000 }),
                axios.get(`https://api.github.com/users/${GH_ORG}/repos?sort=updated&per_page=30&type=owner`, { headers: GH_HDRS, timeout: 12000 }),
            ]);

            const org   = orgRes.status   === 'fulfilled' ? orgRes.value.data   : null;
            const repos = reposRes.status === 'fulfilled' ? reposRes.value.data : [];

            if (!repos.length) return reply(fmt(`📭 No public repositories found for *${GH_ORG}*.`));

            const totalStars = repos.reduce((s, r) => s + (r.stargazers_count || 0), 0);
            const totalForks = repos.reduce((s, r) => s + (r.forks_count || 0), 0);

            const lines = [
                `🐙 *SilvaTechB GitHub*`,
                `🔗 https://github.com/${GH_ORG}`,
                '',
            ];

            if (org) {
                if (org.bio)      lines.push(`📝 ${org.bio}`);
                if (org.location) lines.push(`📍 ${org.location}`);
                if (org.blog)     lines.push(`🌐 ${org.blog}`);
                lines.push('');
                lines.push(`*📊 Account Stats*`);
                lines.push(`• 👤 Followers: *${fmtNum(org.followers)}*`);
                lines.push(`• 📦 Public Repos: *${fmtNum(org.public_repos)}*`);
                lines.push(`• ⭐ Total Stars: *${fmtNum(totalStars)}*`);
                lines.push(`• 🍴 Total Forks: *${fmtNum(totalForks)}*`);
                lines.push('');
            }

            lines.push(`*📦 Repositories (${repos.length})*`);
            for (const r of repos.slice(0, 15)) {
                const lang  = r.language ? ` · ${r.language}` : '';
                const stars = r.stargazers_count ? ` ⭐${fmtNum(r.stargazers_count)}` : '';
                const forks = r.forks_count       ? ` 🍴${fmtNum(r.forks_count)}`       : '';
                lines.push(`• *${r.name}*${lang}${stars}${forks}`);
                if (r.description) lines.push(`  _${r.description.slice(0, 80)}_`);
            }

            lines.push('');
            lines.push(`*💡 Commands*`);
            lines.push(`• \`.silvatech <repo>\` — repo details & stats`);
            lines.push(`• \`.silvatech <repo> <file>\` — read a file`);
            lines.push(`• \`.silvatech zip <repo>\` — download links`);
            lines.push(`_Read-only access · No writes permitted_`);

            try {
                await sock.sendMessage(jid, {
                    image:      { url: org?.avatar_url || `https://avatars.githubusercontent.com/${GH_ORG}` },
                    caption:    fmt(lines.join('\n')),
                    contextInfo,
                }, { quoted: message });
            } catch {
                await reply(fmt(lines.join('\n')));
            }
        } catch (err) {
            reply(fmt(`❌ Could not fetch SilvaTechB repos: ${err.message}`));
        }

        await sock.sendPresenceUpdate('paused', jid);
    }
};
