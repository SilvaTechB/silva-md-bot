'use strict';

const fs      = require('fs');
const path    = require('path');
const config  = require('../config');
const { getStr, getActiveTheme } = require('../lib/theme');
const moment  = require('moment-timezone');
const baileys = require('@whiskeysockets/baileys');
const { proto, generateMessageIDV2 } = baileys;

const REPO    = 'https://github.com/SilvaTechB/silva-md-v4';
const WEBSITE = 'https://silvatech.co.ke';
const TZ      = 'Africa/Nairobi';

// ── Category definitions ─────────────────────────────────────────────────────
const CATEGORIES = [
    { icon: '⬇️',  name: 'Downloaders',        cmds: ['yt','tiktok','instagram','facebook','apk','catbox'] },
    { icon: '🎵',  name: 'Music & Audio',       cmds: ['play','shazam','lyrics','toaudio'] },
    { icon: '🤖',  name: 'AI & Intelligence',   cmds: ['ai','imagine','translate','define','tts','calc','shorten','gitclone','anime','manga'] },
    { icon: '🌍',  name: 'Search & Info',       cmds: ['wiki','country','ip','currency','time','weather','numberfact'] },
    { icon: '🖼️', name: 'Media & Stickers',    cmds: ['sticker','vv','ascii','qrcode','react'] },
    { icon: '👥',  name: 'Group Management',    cmds: ['kick','promote','demote','ban','unban','banlist','tagall','hidetag','poll','lock','unlock','link','revoke','setname','setdesc','broadcast'] },
    { icon: '👋',  name: 'Welcome & Events',    cmds: ['welcome','goodbye','setwelcome','setgoodbye'] },
    { icon: '🛡️', name: 'Protection',          cmds: ['antidemote','antidelete','antilink','anticall','antivv','autoreply','blocklist','afk'] },
    { icon: '😄',  name: 'Fun & Entertainment', cmds: ['joke','fact','riddle','meme','quote','advice','compliment','flip','bible','hello'] },
    { icon: '🔒',  name: 'Privacy & Utilities', cmds: ['password','morse','base64','tempmail','virus','eval'] },
    { icon: '📊',  name: 'Status & Profile',    cmds: ['save','spp','presence','autojoin'] },
    { icon: '📰',  name: 'Channels',            cmds: ['newsletter','followchannel','unfollowchannel','channelinfo'] },
    { icon: 'ℹ️', name: 'Bot Info',            cmds: ['ping','uptime','owner','getjid','repo','remind'] },
];

function box(title, lines) {
    return `╭─「 ${title} 」\n${lines.map(l => `│  ${l}`).join('\n')}\n╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄`;
}

function buildMenuText(plugins, pfx, botName, ownerNum, mode) {
    const allCmds  = new Set(plugins.flatMap(p => p.commands || []));
    const assigned = new Set();
    const modeEmoji = mode === 'PUBLIC' ? '🟢' : mode === 'PRIVATE' ? '🔒' : '🔵';
    const now = moment().tz(TZ);

    const header = [
        ``,
        `✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦`,
        `  ⚡ *${botName.toUpperCase()}* ⚡`,
        `  _The Ultimate WhatsApp Bot_`,
        `✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦ ✦`,
        ``
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
    if (rest.length) catBlocks.push(box(`🔧 Other`, rest.map(c => `◈  \`${pfx}${c}\``)));

    const footer = [
        ``,
        `╭┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╮`,
        `│  💡 \`${pfx}help <cmd>\`     │`,
        `│  🌐 ${WEBSITE}  │`,
        `╰┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄┄╯`,
        ``,
        `> ⚡ _Powered by *Silva Tech Inc* © ${now.year()}_`
    ].join('\n');

    return `${header}${infoPanel}\n\n${catBlocks.join('\n\n')}\n${footer}`;
}

// ── Send call log then menu text quoting it ───────────────────────────────────
async function sendCallLogMenu(sock, jid, menuText, imgUrl) {
    const CallOutcome = proto.Message.CallLogMessage.CallOutcome;
    const callMsgId   = generateMessageIDV2(sock.user?.id);
    const botJid      = sock.user?.id || '';

    // Step 1: send a real MISSED-VOICE-CALL log bubble
    const callContent = proto.Message.fromObject({
        callLogMesssage: {
            isVideo:      false,
            callOutcome:  CallOutcome.MISSED,   // 1 — "Missed voice call"
            durationSecs: 0,
            callType:     0                     // REGULAR
        }
    });

    await sock.relayMessage(jid, callContent, { messageId: callMsgId });

    // Brief pause so the call bubble lands before the menu
    await new Promise(r => setTimeout(r, 400));

    // Step 2: send the menu as a reply quoting the call log bubble
    const quotedCallContent = {
        callLogMesssage: {
            isVideo:      false,
            callOutcome:  CallOutcome.MISSED,
            durationSecs: 0,
            callType:     0
        }
    };

    const quotedCtx = {
        stanzaId:       callMsgId,
        participant:    botJid,
        quotedMessage:  quotedCallContent,
        externalAdReply: {
            title:                 `Silva MD — Command Menu`,
            body:                  `Tap to view all commands`,
            thumbnailUrl:          imgUrl,
            sourceUrl:             WEBSITE,
            mediaType:             1,
            renderLargerThumbnail: false
        }
    };

    try {
        await sock.sendMessage(jid, {
            image:       { url: imgUrl },
            caption:     menuText,
            contextInfo: quotedCtx
        });
    } catch {
        await sock.sendMessage(jid, {
            text:        menuText,
            contextInfo: quotedCtx
        });
    }
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
        const botName  = getStr('botName') || config.BOT_NAME || 'Silva MD';
        const ownerNum = `+${(config.OWNER_NUMBER || '').replace(/\D/g, '')}`;
        const mode     = (config.MODE || 'public').toUpperCase();
        const pfx      = prefix || '.';
        const imgUrl   = getStr('pic1') || config.ALIVE_IMG || 'https://files.catbox.moe/5uli5p.jpeg';

        const menuText = buildMenuText(plugins, pfx, botName, ownerNum, mode);

        // ── Primary: call log bubble → menu reply ──────────────────────────────
        try {
            await sendCallLogMenu(sock, jid, menuText, imgUrl);
            return;
        } catch (err) {
            console.error('[Menu] callLogMesssage send failed:', err.message);
        }

        // ── Fallback: image + caption with rich card ───────────────────────────
        const fallbackCtx = {
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
                caption:     menuText,
                contextInfo: fallbackCtx
            }, { quoted: message });
        } catch {
            await sock.sendMessage(jid, { text: menuText, contextInfo }, { quoted: message });
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
