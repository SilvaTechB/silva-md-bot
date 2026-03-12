'use strict';
const axios = require('axios');
const { fmt } = require('../lib/theme');

module.exports = {
    commands:    ['npm', 'npmpkg', 'package', 'pkg'],
    description: 'Look up any NPM package — version, downloads, links, dependencies',
    usage:       '.npm [package-name]',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const reply = (text) => sock.sendMessage(jid, { text: fmt(text), contextInfo }, { quoted: message });

        const pkg = args.join(' ').trim().toLowerCase();
        if (!pkg) return reply('❌ *Usage:* `.npm [package-name]`\n\nExamples:\n• `.npm axios`\n• `.npm @whiskeysockets/baileys`');

        try {
            const [regRes, dlRes] = await Promise.allSettled([
                axios.get(`https://registry.npmjs.org/${encodeURIComponent(pkg)}`, { timeout: 10000 }),
                axios.get(`https://api.npmjs.org/downloads/point/last-month/${encodeURIComponent(pkg)}`, { timeout: 8000 })
            ]);

            if (regRes.status === 'rejected') {
                if (regRes.reason?.response?.status === 404) return reply(`❌ Package *"${pkg}"* not found on NPM.`);
                throw regRes.reason;
            }

            const data    = regRes.value.data;
            const latest  = data['dist-tags']?.latest;
            const ver     = data.versions?.[latest] || {};
            const dl      = dlRes.status === 'fulfilled' ? dlRes.value.data?.downloads : null;

            const deps    = Object.keys(ver.dependencies || {});
            const devDeps = Object.keys(ver.devDependencies || {});

            const lines = [
                `📦 *NPM Package*`,
                ``,
                `🏷️ *Name:* ${data.name}`,
                `📌 *Version:* ${latest || 'N/A'}`,
                `📝 *Description:* ${data.description || 'No description'}`,
                ``,
                `👤 *Author:* ${typeof ver.author === 'object' ? ver.author?.name : ver.author || 'N/A'}`,
                `🔑 *License:* ${ver.license || 'N/A'}`,
            ];

            if (dl != null) lines.push(`📥 *Downloads (last 30d):* ${dl.toLocaleString()}`);

            const keywords = (data.keywords || []).slice(0, 8);
            if (keywords.length) lines.push(`🏷️ *Keywords:* ${keywords.join(', ')}`);

            if (deps.length) {
                lines.push('', `🔗 *Dependencies (${deps.length}):*`);
                lines.push(deps.slice(0, 8).map(d => `  • ${d}`).join('\n'));
                if (deps.length > 8) lines.push(`  ... and ${deps.length - 8} more`);
            }

            if (ver.homepage) lines.push('', `🌐 Homepage: ${ver.homepage}`);
            const repo = ver.repository?.url?.replace(/^git\+/, '').replace(/\.git$/, '');
            if (repo) lines.push(`📂 Repo: ${repo}`);

            lines.push('', `🔗 https://npmjs.com/package/${data.name}`);

            return reply(lines.join('\n'));

        } catch (e) {
            return reply(`❌ NPM lookup failed: ${e.message}`);
        }
    }
};
