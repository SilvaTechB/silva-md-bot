'use strict';

const fs     = require('fs');
const path   = require('path');
const config = require('../config');
const moment = require('moment-timezone');

// Baileys proto + ID helpers — imported at module level for reuse
const baileys           = require('@whiskeysockets/baileys');
const { proto, generateMessageIDV2 } = baileys;

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
        cmds: ['wiki', 'country', 'ip', 'currency', 'time', 'weather', 'numberfact']
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
function box(title, lines) {
    const body   = lines.map(l => `│  ${l}`).join('\n');
    return `╭─「 ${title} 」\n${body}\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`;
}

// ── Build the full menu text ──────────────────────────────────────────────────
function buildMenuText(plugins, prefix, botName, ownerNum, mode) {
    const allCmds  = new Set(plugins.flatMap(p => p.commands || []));
    const assigned = new Set();
    const pfx      = prefix || '.';
    const modeEmoji = mode === 'PUBLIC' ? '🟢' : mode === 'PRIVATE' ? '🔒' : '🔵';
    const now      = moment().tz(TZ);

    const header = [
        ``,
        `✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦`,
        ``,
        `  ⚡ *${botName.toUpperCase()}* ⚡`,
        `  _The Ultimate WhatsApp Bot_`,
        ``,
        `✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦`,
        ``,
    ].join('\n');

    const infoPanel = box(`📋 Bot Status`, [
        `◆ *Bot:*     ${botName}`,
        `◆ *Number:*  ${ownerNum}`,
        `◆ *Prefix:*  \`${pfx}\``,
        `◆ *Mode:*    ${modeEmoji} ${mode}`,
        `◆ *Plugins:* ${plugins.length} loaded`,
        `◆ *Date:*    ${now.format('ddd, D MMM YYYY')}`,
        `◆ *Time:*    ${now.format('hh:mm A')}`,
    ]);

    const catBlocks = [];
    for (const { icon, name, cmds } of CATEGORIES) {
        const found = [...new Set(cmds.filter(c => allCmds.has(c)))];
        if (!found.length) continue;
        found.forEach(c => assigned.add(c));
        catBlocks.push(box(`${icon} ${name}`, found.map(c => `◈  \`${pfx}${c}\``)));
    }

    const rest = [...allCmds].filter(c => !assigned.has(c) && !['menu','help','list'].includes(c));
    if (rest.length) {
        catBlocks.push(box(`🔧 Other`, rest.map(c => `◈  \`${pfx}${c}\``)));
    }

    const footer = [
        ``,
        `╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮`,
        `│  💡 \`${pfx}help <command>\`   │`,
        `╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯`,
        ``,
        `  🌐 ${WEBSITE}`,
        `  📂 ${REPO}`,
        ``,
        `> ⚡ _Powered by *Silva Tech Inc* © ${now.year()}_`,
    ].join('\n');

    return `${header}${infoPanel}\n\n${catBlocks.join('\n\n')}\n${footer}`;
}

// ── Send as BCall (call-ended appearance) ────────────────────────────────────
async function sendAsCallLog(sock, jid, text) {
    const inner = proto.Message.BCallMessage.create({
        caption:   text,
        mediaType: 1,                           // 1 = AUDIO → voice call style
        sessionId: 'silva_' + Date.now()
    });

    const msgContent = { bcallMessage: inner };
    const msgId      = generateMessageIDV2(sock.user?.id);

    await sock.relayMessage(jid, msgContent, { messageId: msgId });
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
        const botName  = config.BOT_NAME   || 'Silva MD';
        const ownerNum = `+${(config.OWNER_NUMBER || '').replace(/\D/g, '')}`;
        const mode     = (config.MODE || 'public').toUpperCase();
        const pfx      = prefix || '.';
        const imgUrl   = config.ALIVE_IMG  || 'https://files.catbox.moe/5uli5p.jpeg';

        const fullText = buildMenuText(plugins, pfx, botName, ownerNum, mode);

        // ── Primary: send as call-log style (BCallMessage) ──────────────────
        try {
            await sendAsCallLog(sock, jid, fullText);
            return;
        } catch (callErr) {
            console.error('[Menu] BCallMessage failed:', callErr.message);
        }

        // ── Fallback 1: image with caption + rich card ───────────────────────
        const richCtx = {
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
                contextInfo: richCtx
            }, { quoted: message });
        } catch {
            // ── Fallback 2: plain text ────────────────────────────────────────
            await sock.sendMessage(jid, { text: fullText, contextInfo }, { quoted: message });
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
