'use strict';

const fs     = require('fs');
const path   = require('path');
const config = require('../config');

const CATEGORIES = [
    { icon: '⬇️',  name: 'Downloaders',   cmds: ['yt', 'tiktok', 'instagram', 'facebook', 'apk'] },
    { icon: '🎵',  name: 'Music',          cmds: ['play', 'shazam'] },
    { icon: '🤖',  name: 'AI & Tools',    cmds: ['ai', 'shorten', 'gitclone', 'scanurl', 'tourl'] },
    { icon: '🖼️',  name: 'Media',          cmds: ['sticker', 'vv'] },
    { icon: '🛡️',  name: 'Group Tools',   cmds: ['antidemote', 'antidelete', 'antilink', 'afk', 'autoreply', 'anticall', 'blocklist', 'antidemote'] },
    { icon: '📰',  name: 'Newsletter',     cmds: ['newsletter', 'followchannel', 'unfollowchannel', 'channelinfo'] },
    { icon: '📊',  name: 'Status',         cmds: ['save'] },
    { icon: 'ℹ️',  name: 'Info & Misc',    cmds: ['ping', 'uptime', 'owner', 'weather', 'getjid', 'spp', 'repo'] },
    { icon: '🎮',  name: 'Fun',            cmds: ['hello', 'test'] },
    { icon: '📞',  name: 'Calls',          cmds: ['call'] },
];

module.exports = {
    commands:    ['menu', 'help', 'list'],
    description: 'Show all available commands',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { prefix, contextInfo } = ctx;
        const jid = message.key.remoteJid;

        const plugins  = loadPlugins();
        const allCmds  = new Set(plugins.flatMap(p => p.commands || []));
        const assigned = new Set();

        const now = new Date().toLocaleString('en-US', {
            weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
            hour: '2-digit', minute: '2-digit', hour12: true,
            timeZone: 'Africa/Nairobi'
        });

        const botNum  = `+${(config.OWNER_NUMBER || '').replace(/\D/g, '')}`;
        const botName = config.BOT_NAME || 'Silva MD';
        const pfx     = prefix;

        // ── Build category blocks ──────────────────────────────────────────
        const catBlocks = [];
        for (const { icon, name, cmds } of CATEGORIES) {
            const found = [...new Set(cmds.filter(c => allCmds.has(c)))];
            if (!found.length) continue;
            found.forEach(c => assigned.add(c));

            const rows = found.map(c => `│  ${icon} \`${pfx}${c}\``).join('\n');
            catBlocks.push(
                `╭──「 ${icon} *${name}* 」\n${rows}\n╰──────────────────`
            );
        }

        // ── Overflow bucket ────────────────────────────────────────────────
        const rest = [...allCmds].filter(c => !assigned.has(c) && !['menu','help','list'].includes(c));
        if (rest.length) {
            const rows = rest.map(c => `│  🔧 \`${pfx}${c}\``).join('\n');
            catBlocks.push(`╭──「 🔧 *Other* 」\n${rows}\n╰──────────────────`);
        }

        // ── Assemble full text ─────────────────────────────────────────────
        const header = [
            `┏━━━━━━━━━━━━━━━━━━━━━━━━┓`,
            `┃   ⚡ *${botName.toUpperCase()} COMMANDS*   ┃`,
            `┗━━━━━━━━━━━━━━━━━━━━━━━━┛`,
            ``,
            `🤖 *Bot:* ${botName}`,
            `📱 *Number:* ${botNum}`,
            `🔑 *Prefix:* \`${pfx}\``,
            `📦 *Plugins:* ${plugins.length}`,
            `🕐 *Time:* ${now}`,
            ``,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
        ].join('\n');

        const footer = [
            ``,
            `━━━━━━━━━━━━━━━━━━━━━━━━━━`,
            `💬 _Type \`${pfx}help <command>\` for details_`,
            `🌐 _silvatech.co.ke_`,
            `📢 _Follow our newsletter for updates!_`,
        ].join('\n');

        const fullText = `${header}\n\n${catBlocks.join('\n\n')}\n${footer}`;

        // ── Send with bot image ────────────────────────────────────────────
        const imgUrl = config.ALIVE_IMG || 'https://files.catbox.moe/5uli5p.jpeg';
        try {
            await sock.sendMessage(jid, {
                image:   { url: imgUrl },
                caption: fullText,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title:               `${botName} — Command List`,
                        body:                `${plugins.length} plugins • Prefix: ${pfx}`,
                        thumbnailUrl:        imgUrl,
                        sourceUrl:           'https://silvatech.co.ke',
                        mediaType:           1,
                        renderLargerThumbnail: false
                    }
                }
            }, { quoted: message });
        } catch {
            // Fallback to plain text if image fails
            await sock.sendMessage(jid, {
                text: fullText,
                contextInfo
            }, { quoted: message });
        }
    }
};

function loadPlugins() {
    const dir = path.join(__dirname);
    const out = [];
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
        try {
            const p = require(path.join(dir, f));
            if (Array.isArray(p.commands) && p.commands.length) out.push(p);
        } catch { }
    }
    return out;
}
