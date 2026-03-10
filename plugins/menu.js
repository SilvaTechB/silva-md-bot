'use strict';

const fs     = require('fs');
const path   = require('path');
const config = require('../config');
const moment = require('moment-timezone');

const REPO    = 'https://github.com/SilvaTechB/silva-md-v4';
const WEBSITE = 'https://silvatech.co.ke';
const TZ      = 'Africa/Nairobi';

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
    {
        icon: '⬇️',
        name: 'Downloaders',
        cmds: ['yt', 'tiktok', 'instagram', 'facebook', 'apk', 'catbox']
    },
    {
        icon: '🎵',
        name: 'Music & Audio',
        cmds: ['play', 'shazam', 'lyrics', 'toaudio']
    },
    {
        icon: '🤖',
        name: 'AI & Intelligence',
        cmds: ['ai', 'imagine', 'translate', 'define', 'tts', 'calc', 'shorten', 'gitclone', 'anime', 'manga']
    },
    {
        icon: '🌍',
        name: 'Search & Info',
        cmds: ['wiki', 'country', 'ip', 'currency', 'time', 'weather', 'numberfact', 'lyrics']
    },
    {
        icon: '🖼️',
        name: 'Media & Stickers',
        cmds: ['sticker', 'vv', 'ascii', 'qrcode', 'react']
    },
    {
        icon: '👥',
        name: 'Group Management',
        cmds: ['kick', 'promote', 'demote', 'ban', 'unban', 'banlist', 'tagall', 'hidetag', 'poll', 'lock', 'unlock', 'link', 'revoke', 'setname', 'setdesc', 'broadcast']
    },
    {
        icon: '👋',
        name: 'Welcome & Events',
        cmds: ['welcome', 'goodbye', 'setwelcome', 'setgoodbye']
    },
    {
        icon: '🛡️',
        name: 'Protection',
        cmds: ['antidemote', 'antidelete', 'antilink', 'anticall', 'antivv', 'autoreply', 'blocklist', 'afk']
    },
    {
        icon: '😄',
        name: 'Fun & Entertainment',
        cmds: ['joke', 'fact', 'riddle', 'meme', 'quote', 'advice', 'compliment', 'flip', 'bible', 'hello']
    },
    {
        icon: '🔒',
        name: 'Privacy & Utilities',
        cmds: ['password', 'morse', 'base64', 'tempmail', 'virus', 'eval']
    },
    {
        icon: '📊',
        name: 'Status & Profile',
        cmds: ['save', 'spp', 'presence', 'autojoin']
    },
    {
        icon: '📰',
        name: 'Channels',
        cmds: ['newsletter', 'followchannel', 'unfollowchannel', 'channelinfo']
    },
    {
        icon: 'ℹ️',
        name: 'Bot Info',
        cmds: ['ping', 'uptime', 'owner', 'getjid', 'repo', 'remind']
    },
];

// ── Box-drawing helpers ──────────────────────────────────────────────────────
const TOP    = '╭';
const MID    = '│';
const BOT    = '╰';
const LINE   = '─';
const DOT    = '◆';
const THIN   = '┄';

function box(title, lines) {
    const header = `${TOP}${LINE.repeat(2)}「 ${title} 」${LINE.repeat(2)}`;
    const body   = lines.map(l => `${MID}  ${l}`).join('\n');
    const footer = `${BOT}${THIN.repeat(22)}`;
    return `${header}\n${body}\n${footer}`;
}

module.exports = {
    commands:    ['menu', 'help', 'list'],
    description: 'Show all available commands in a categorized menu',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { prefix, contextInfo } = ctx;
        const jid = message.key.remoteJid;

        const plugins  = loadPlugins();
        const allCmds  = new Set(plugins.flatMap(p => p.commands || []));
        const assigned = new Set();

        const now       = moment().tz(TZ);
        const dateStr   = now.format('dddd, D MMMM YYYY');
        const timeStr   = now.format('hh:mm A');
        const botName   = config.BOT_NAME   || 'Silva MD';
        const ownerNum  = `+${(config.OWNER_NUMBER || '').replace(/\D/g, '')}`;
        const mode      = (config.MODE || 'public').toUpperCase();
        const pfx       = prefix || '.';
        const modeEmoji = mode === 'PUBLIC' ? '🟢' : mode === 'PRIVATE' ? '🔒' : '🔵';
        const imgUrl    = config.ALIVE_IMG   || 'https://files.catbox.moe/5uli5p.jpeg';

        // ── Header ─────────────────────────────────────────────────────────────
        const header = [
            ``,
            `  ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦`,
            ``,
            `  ⚡  *${botName.toUpperCase()}*  ⚡`,
            `  _The Ultimate WhatsApp Bot_`,
            ``,
            `  ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦`,
            ``,
        ].join('\n');

        // ── Info panel ─────────────────────────────────────────────────────────
        const infoPanel = box(`📋 Bot Status`, [
            `${DOT} *Name* ❯  ${botName}`,
            `${DOT} *Number* ❯  ${ownerNum}`,
            `${DOT} *Prefix* ❯  \`${pfx}\``,
            `${DOT} *Mode* ❯  ${modeEmoji} ${mode}`,
            `${DOT} *Plugins* ❯  ${plugins.length} loaded`,
            `${DOT} *Date* ❯  ${dateStr}`,
            `${DOT} *Time* ❯  ${timeStr}`,
        ]);

        // ── Category blocks ────────────────────────────────────────────────────
        const catBlocks = [];
        for (const { icon, name, cmds } of CATEGORIES) {
            const found = [...new Set(cmds.filter(c => allCmds.has(c)))];
            if (!found.length) continue;
            found.forEach(c => assigned.add(c));

            const rows = found.map(c => `◈  \`${pfx}${c}\``);
            catBlocks.push(box(`${icon} ${name}`, rows));
        }

        // ── Overflow bucket ─────────────────────────────────────────────────────
        const rest = [...allCmds].filter(c => !assigned.has(c) && !['menu','help','list'].includes(c));
        if (rest.length) {
            const rows = rest.map(c => `◈  \`${pfx}${c}\``);
            catBlocks.push(box(`🔧 Other`, rows));
        }

        // ── Footer ─────────────────────────────────────────────────────────────
        const footer = [
            ``,
            `╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮`,
            `${MID}  💡 \`${pfx}help <command>\`   ${MID}`,
            `╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯`,
            ``,
            `  🌐 *Web:*  ${WEBSITE}`,
            `  📂 *Repo:* ${REPO}`,
            ``,
            `> ⚡ _Powered by *Silva Tech Inc* © ${now.year()}_`,
        ].join('\n');

        const fullText = `${header}${infoPanel}\n\n${catBlocks.join('\n\n')}\n${footer}`;

        // ── Send with image + rich link-preview card ───────────────────────────
        const richContext = {
            ...contextInfo,
            externalAdReply: {
                title:                 `${botName} — Official Command Menu`,
                body:                  `${plugins.length} plugins  •  Prefix: ${pfx}  •  ${mode} mode`,
                thumbnailUrl:          imgUrl,
                sourceUrl:             WEBSITE,
                mediaType:             1,
                renderLargerThumbnail: true
            }
        };

        try {
            await sock.sendMessage(jid, {
                image:       { url: imgUrl },
                caption:     fullText,
                contextInfo: richContext
            }, { quoted: message });
        } catch {
            // Fallback: text with card
            await sock.sendMessage(jid, {
                text:        fullText,
                contextInfo: richContext
            }, { quoted: message });
        }
    }
};

// ── Plugin loader ─────────────────────────────────────────────────────────────
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
