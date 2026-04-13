'use strict';

const fs     = require('fs');
const path   = require('path');
const config = require('../config');
const { fmt } = require('../lib/theme');
const { jidNormalizedUser } = require('@whiskeysockets/baileys');

const SUDO_FILE = path.join(__dirname, '../data/sudo.json');
function loadSudo()       { try { return JSON.parse(fs.readFileSync(SUDO_FILE, 'utf8')); } catch { return []; } }
function saveSudo(list)   { fs.mkdirSync(path.dirname(SUDO_FILE), { recursive: true }); fs.writeFileSync(SUDO_FILE, JSON.stringify(list, null, 2)); }

function isRealOwner(ctx) {
    if (ctx.m?.key?.fromMe) return true;
    const fromNorm = jidNormalizedUser(ctx.from);
    const botLid = jidNormalizedUser(global.botLid || '');
    if (botLid && fromNorm === botLid) return true;
    const ownerNum = ((process.env.OWNER_NUMBER || '').trim()
        || (typeof config.OWNER_NUMBER === 'string' ? config.OWNER_NUMBER.trim() : '')
        || (global.botNum || '')).replace(/\D/g, '');
    const botNum = (global.botNum || '').replace(/\D/g, '');
    const fromNum = fromNorm.replace(/@.*/, '').replace(/\D/g, '');
    if (fromNum && ownerNum && fromNum === ownerNum) return true;
    if (fromNum && botNum && fromNum === botNum) return true;
    return false;
}

module.exports = {
    commands: [
        'block', 'unblock', 'forward', 'mygroups', 'pp', 'fullpp',
        'setbotname', 'setmode', 'setsudo', 'delsudo', 'getsudo', 'resetsudo',
        'setownername', 'setownernumber', 'join', 'cmd',
        'cachedmeta', 'report', 'save', 'tostatus', 'vv2', 'update',
        'return', 'setpmpermit', 'setpackname', 'setpackauthor',
        'setbotpic', 'setbotrepo', 'setcaption', 'setchatbot', 'setchatbotmode',
        'setdmpresence', 'setfooter', 'setgcjid', 'setgcpresence',
        'setnewsletterjid', 'setnewsletterurl', 'setstartmsg',
        'setstatusemojis', 'setstatusreplytext', 'settimezone', 'setytlink',
        'setautolikestatus', 'setautoreact', 'setautoread', 'setautoreadstatus',
        'setautoreplystatus', 'setautoblock', 'setautobio', 'setanticall',
        'setantidelete', 'setantiedit', 'getsetting', 'setsetting',
        'resetsetting', 'resetallsettings', 'resetdb', 'jid'
    ],
    description: 'Extended owner/admin control commands',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo, isOwner, mentionedJid, groupMetadata } = ctx;
        const cmd  = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const text = args.join(' ').trim();
        const send = (t) => sock.sendMessage(jid, { text: fmt(t), contextInfo }, { quoted: message });

        if (!isOwner) return send('⛔ This command is for the owner only.');

        if (cmd === 'block') {
            const target = mentionedJid?.[0]
                || message.message?.extendedTextMessage?.contextInfo?.participant
                || (text ? `${text.replace(/\D/g, '')}@s.whatsapp.net` : null);
            if (!target) return send('❌ *Usage:* `.block @user` or `.block <number>`');
            await sock.updateBlockStatus(target, 'block').catch(() => {});
            return send(`🚫 Blocked @${target.split('@')[0]}`, { mentions: [target] });
        }

        if (cmd === 'unblock') {
            const target = mentionedJid?.[0]
                || message.message?.extendedTextMessage?.contextInfo?.participant
                || (text ? `${text.replace(/\D/g, '')}@s.whatsapp.net` : null);
            if (!target) return send('❌ *Usage:* `.unblock @user` or `.unblock <number>`');
            await sock.updateBlockStatus(target, 'unblock').catch(() => {});
            return send(`✅ Unblocked @${target.split('@')[0]}`, { mentions: [target] });
        }

        if (cmd === 'forward') {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const stanzaId  = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
            const participant = message.message?.extendedTextMessage?.contextInfo?.participant;
            if (!quotedMsg) return send('❌ Reply to a message to forward it.\n\n*Usage:* `.forward <number or group JID>`');
            const dest = text.includes('@') ? text : `${text.replace(/\D/g, '')}@s.whatsapp.net`;
            await sock.sendMessage(dest, quotedMsg).catch(() => {});
            return send(`📤 Forwarded to ${dest.split('@')[0]}`);
        }

        if (cmd === 'mygroups') {
            try {
                const groups = await sock.groupFetchAllParticipating();
                const list   = Object.values(groups).map((g, i) => `*${i + 1}.* ${g.subject} (${g.participants.length} members)`).join('\n');
                const total  = Object.keys(groups).length;
                return send(`👥 *My Groups (${total})*\n\n${list || 'No groups found.'}`);
            } catch { return send('❌ Failed to fetch groups.'); }
        }

        if (cmd === 'pp') {
            const msg    = message.message;
            const imgMsg = msg?.imageMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            if (!imgMsg) return send('❌ Reply to or send an image with `.pp` to set bot profile picture.');
            try {
                const { dlBuffer } = require('../lib/dlmedia');
                const buf = await dlBuffer(imgMsg, 'image');
                await sock.updateProfilePicture(sock.user?.id || '', buf);
                return send('✅ Bot profile picture updated!');
            } catch { return send('❌ Failed to update profile picture.'); }
        }

        if (cmd === 'fullpp') {
            const target = mentionedJid?.[0]
                || message.message?.extendedTextMessage?.contextInfo?.participant
                || (text ? `${text.replace(/\D/g, '')}@s.whatsapp.net` : jid);
            try {
                const pp = await sock.profilePictureUrl(target, 'image');
                await sock.sendMessage(jid, { image: { url: pp }, caption: fmt(`🖼️ Profile Picture of @${target.split('@')[0]}`), contextInfo, mentions: [target] }, { quoted: message });
            } catch { return send('❌ Could not fetch profile picture. They may have privacy set.'); }
            return;
        }

        if (cmd === 'setbotname') {
            if (!text) return send('❌ *Usage:* `.setbotname <name>`');
            config.BOT_NAME = text;
            process.env.BOT_NAME = text;
            return send(`✅ Bot name set to *${text}*`);
        }

        if (cmd === 'setownername') {
            if (!text) return send('❌ *Usage:* `.setownername <name>`');
            config.OWNER_NAME = text;
            process.env.OWNER_NAME = text;
            return send(`✅ Owner name set to *${text}*`);
        }

        if (cmd === 'setownernumber') {
            const num = text.replace(/\D/g, '');
            if (!num) return send('❌ *Usage:* `.setownernumber <number>`');
            config.OWNER_NUMBER = num;
            process.env.OWNER_NUMBER = num;
            return send(`✅ Owner number set to *+${num}*`);
        }

        if (cmd === 'setmode') {
            const modes = ['public', 'private', 'group', 'inbox', 'both'];
            const mode  = args[0]?.toLowerCase();
            if (!mode || !modes.includes(mode)) return send(`❌ *Usage:* \`.setmode <mode>\`\n\nModes: ${modes.join(', ')}`);
            config.MODE = mode;
            process.env.MODE = mode;
            return send(`✅ Mode set to *${mode}*`);
        }

        if (cmd === 'setsudo') {
            if (!isRealOwner(ctx)) {
                return send('⛔ Only the real bot owner can manage sudo users.');
            }
            const target = mentionedJid?.[0] || (text ? `${text.replace(/\D/g, '')}@s.whatsapp.net` : null);
            if (!target) return send('❌ *Usage:* `.setsudo @user` or `.setsudo <number>`');
            const list = loadSudo();
            if (!list.includes(target)) list.push(target);
            saveSudo(list);
            if (!global.sudoUsers) global.sudoUsers = new Set();
            global.sudoUsers.add(target);
            return send(`✅ @${target.split('@')[0]} added as sudo user.`, { mentions: [target] });
        }

        if (cmd === 'delsudo') {
            if (!isRealOwner(ctx)) {
                return send('⛔ Only the real bot owner can manage sudo users.');
            }
            const target = mentionedJid?.[0] || (text ? `${text.replace(/\D/g, '')}@s.whatsapp.net` : null);
            if (!target) return send('❌ *Usage:* `.delsudo @user`');
            const list = loadSudo().filter(j => j !== target);
            saveSudo(list);
            if (global.sudoUsers) global.sudoUsers.delete(target);
            return send(`✅ @${target.split('@')[0]} removed from sudo.`, { mentions: [target] });
        }

        if (cmd === 'getsudo') {
            const list = loadSudo();
            if (!list.length) return send('👤 *Sudo Users*\n\nNo sudo users set.');
            const out = list.map((j, i) => `*${i + 1}.* +${j.split('@')[0]}`).join('\n');
            return send(`👤 *Sudo Users (${list.length})*\n\n${out}`);
        }

        if (cmd === 'resetsudo') {
            if (!isRealOwner(ctx)) {
                return send('⛔ Only the real bot owner can manage sudo users.');
            }
            saveSudo([]);
            if (global.sudoUsers) global.sudoUsers.clear();
            return send('✅ All sudo users cleared.');
        }

        if (cmd === 'join') {
            if (!text) return send('❌ *Usage:* `.join <invite link>`');
            try {
                const code = text.split('chat.whatsapp.com/').pop().split(/[?&]/)[0];
                await sock.groupAcceptInvite(code);
                return send(`✅ Joined group via invite!`);
            } catch { return send('❌ Failed to join group. Link may be invalid or expired.'); }
        }

        if (cmd === 'tostatus') {
            const msg    = message.message;
            const imgMsg = msg?.imageMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            const vidMsg = msg?.videoMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.videoMessage;
            const txtMsg = text;
            try {
                if (imgMsg) {
                    const { dlBuffer } = require('../lib/dlmedia');
                    const buf = await dlBuffer(imgMsg, 'image');
                    await sock.sendMessage('status@broadcast', { image: buf, caption: txtMsg || '' });
                    return send('✅ Posted image to status!');
                } else if (vidMsg) {
                    const { dlBuffer } = require('../lib/dlmedia');
                    const buf = await dlBuffer(vidMsg, 'video');
                    await sock.sendMessage('status@broadcast', { video: buf, caption: txtMsg || '' });
                    return send('✅ Posted video to status!');
                } else if (txtMsg) {
                    await sock.sendMessage('status@broadcast', { text: txtMsg });
                    return send('✅ Posted text to status!');
                } else {
                    return send('❌ Send/reply to text, image or video with `.tostatus`');
                }
            } catch (e) { return send(`❌ Failed to post to status: ${e.message}`); }
        }

        if (cmd === 'vv2') {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) return send('❌ Reply to a view-once message with `.vv2`');
            const vMsg = quotedMsg?.viewOnceMessageV2?.message || quotedMsg?.viewOnceMessage?.message || quotedMsg;
            await sock.sendMessage(jid, vMsg, { quoted: message }).catch(() => {});
            return;
        }

        if (cmd === 'save') {
            const quotedMsg = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            if (!quotedMsg) return send('❌ Reply to a message with `.save` to save it to yourself.');
            const botJid = `${(config.OWNER_NUMBER || '').replace(/\D/g, '')}@s.whatsapp.net`;
            await sock.sendMessage(botJid, quotedMsg).catch(() => {});
            return send('✅ Saved to your private chat!');
        }

        if (cmd === 'report') {
            if (!text) return send('❌ *Usage:* `.report <message>`');
            const ownerJid = `${(config.OWNER_NUMBER || '').replace(/\D/g, '')}@s.whatsapp.net`;
            const from     = message.key.participant || message.key.remoteJid;
            await sock.sendMessage(ownerJid, { text: fmt(`📢 *User Report*\n\nFrom: @${from.split('@')[0]}\nJID: ${from}\n\nMessage:\n${text}`), mentions: [from] }).catch(() => {});
            return send('✅ Report sent to owner!');
        }

        if (cmd === 'update') {
            return send(`🔄 *Bot Update*\n\nCurrent version running.\n\nTo update: restart the workflow or pull latest code from your repository.\n\n_Auto-update is not supported in this environment._`);
        }

        if (cmd === 'return') {
            return send('📤 *Return*\n\nBot is operational. All systems normal.');
        }

        if (cmd === 'cmd' || cmd === 'cachedmeta') {
            if (cmd === 'cachedmeta') {
                const { groupCache } = require('../handler');
                const size = groupCache ? groupCache.size : 'N/A';
                return send(`📦 *Cache Info*\n\n📁 Cached Groups: ${size}\n🕐 TTL: 5 minutes`);
            }
            return send('⚙️ *Cmd*\n\nUse `.eval <code>` to run JavaScript in the bot context.');
        }

        if (cmd === 'jid') {
            const target = mentionedJid?.[0]
                || message.message?.extendedTextMessage?.contextInfo?.participant
                || jid;
            return send(`🆔 *JID Info*\n\n📌 Chat JID: \`${jid}\`\n👤 Target JID: \`${target}\`\n🤖 Bot JID: \`${sock.user?.id || 'N/A'}\``);
        }

        if (cmd === 'setbotrepo') {
            if (!text) return send('❌ *Usage:* `.setbotrepo <github url>`');
            config.REPO_URL = text;
            return send(`✅ Repo URL set to ${text}`);
        }

        if (cmd === 'setpackname') {
            if (!text) return send('❌ *Usage:* `.setpackname <name>`');
            config.PACK_NAME = text;
            return send(`✅ Sticker pack name set to *${text}*`);
        }

        if (cmd === 'setpackauthor') {
            if (!text) return send('❌ *Usage:* `.setpackauthor <name>`');
            config.PACK_AUTHOR = text;
            return send(`✅ Sticker pack author set to *${text}*`);
        }

        if (cmd === 'setfooter') {
            if (!text) return send('❌ *Usage:* `.setfooter <footer text>`');
            config.FOOTER = text;
            return send(`✅ Footer set to: _${text}_`);
        }

        if (cmd === 'settimezone') {
            if (!text) return send('❌ *Usage:* `.settimezone <timezone>`\n\nExample: `.settimezone Africa/Nairobi`');
            process.env.TZ = text;
            config.TIMEZONE = text;
            return send(`✅ Timezone set to *${text}*`);
        }

        if (cmd === 'setstartmsg') {
            if (!text) return send('❌ *Usage:* `.setstartmsg <message>`');
            config.START_MSG = text;
            return send(`✅ Start message updated.`);
        }

        if (cmd === 'setstatusemojis') {
            if (!text) return send('❌ *Usage:* `.setstatusemojis <emoji1,emoji2,...>`');
            config.STATUS_EMOJIS = text.split(',').map(e => e.trim());
            return send(`✅ Status reaction emojis set: ${text}`);
        }

        if (cmd === 'setstatusreplytext') {
            if (!text) return send('❌ *Usage:* `.setstatusreplytext <text>`');
            config.STATUS_REPLY_TEXT = text;
            return send(`✅ Status reply text set.`);
        }

        if (cmd === 'setnewsletterjid') {
            if (!text) return send('❌ *Usage:* `.setnewsletterjid <jid>`');
            config.NEWSLETTER_JID = text;
            return send(`✅ Newsletter JID set to \`${text}\``);
        }

        if (cmd === 'setnewsletterurl') {
            if (!text) return send('❌ *Usage:* `.setnewsletterurl <url>`');
            config.NEWSLETTER_URL = text;
            return send(`✅ Newsletter URL set.`);
        }

        if (cmd === 'setytlink') {
            if (!text) return send('❌ *Usage:* `.setytlink <youtube channel url>`');
            config.YT_LINK = text;
            return send(`✅ YouTube link set.`);
        }

        if (cmd === 'setgcjid') {
            if (!text) return send('❌ *Usage:* `.setgcjid <group jid>`');
            config.GROUP_JID = text;
            return send(`✅ Group JID set to \`${text}\``);
        }

        if (['setgcpresence', 'setdmpresence'].includes(cmd)) {
            const types = ['available', 'unavailable', 'composing', 'recording', 'paused'];
            const type  = args[0]?.toLowerCase();
            if (!type || !types.includes(type)) return send(`❌ *Usage:* \`.${cmd} <type>\`\n\nTypes: ${types.join(', ')}`);
            config[cmd === 'setgcpresence' ? 'GC_PRESENCE' : 'DM_PRESENCE'] = type;
            return send(`✅ ${cmd === 'setgcpresence' ? 'Group' : 'DM'} presence set to *${type}*`);
        }

        if (cmd === 'setcaption') {
            config.CAPTION = text;
            return send(`✅ Caption set to: _${text || '(removed)'}_`);
        }

        if (['setchatbot', 'setchatbotmode'].includes(cmd)) {
            const sub = (args[0] || 'on').toLowerCase();
            config.CHATBOT = sub === 'on' || sub === 'enable';
            return send(`🤖 Chatbot *${config.CHATBOT ? 'ON' : 'OFF'}*`);
        }

        if (['setpmpermit', 'setautoblock', 'setautobio', 'setanticall', 'setantidelete',
             'setantiedit', 'setautolikestatus', 'setautoreact', 'setautoread',
             'setautoreadstatus', 'setautoreplystatus'].includes(cmd)) {
            const sub = (args[0] || 'on').toLowerCase();
            const val = sub === 'on' || sub === 'enable' || sub === 'true';
            const key = cmd.replace('set', '').toUpperCase();
            config[key] = val;
            return send(`✅ *${cmd}* → *${val ? 'ON' : 'OFF'}*`);
        }

        if (cmd === 'getsetting') {
            const key = args[0]?.toUpperCase();
            if (!key) return send('❌ *Usage:* `.getsetting <key>`');
            const val = config[key] ?? process.env[key] ?? 'not set';
            return send(`⚙️ *Setting: ${key}*\n\nValue: \`${val}\``);
        }

        if (cmd === 'setsetting') {
            const key = args[0]?.toUpperCase();
            const val = args.slice(1).join(' ');
            if (!key || !val) return send('❌ *Usage:* `.setsetting <KEY> <value>`');
            config[key] = val;
            process.env[key] = val;
            return send(`✅ Set \`${key}\` = \`${val}\``);
        }

        if (cmd === 'resetsetting') {
            const key = args[0]?.toUpperCase();
            if (!key) return send('❌ *Usage:* `.resetsetting <KEY>`');
            delete config[key];
            delete process.env[key];
            return send(`✅ Setting \`${key}\` reset to default.`);
        }

        if (cmd === 'resetallsettings') {
            return send('⚠️ This would reset ALL config. Restart the bot with a fresh config file to fully reset settings.');
        }

        if (cmd === 'resetdb') {
            const dataDir = path.join(__dirname, '../data');
            if (fs.existsSync(dataDir)) {
                const files = fs.readdirSync(dataDir).filter(f => f.endsWith('.json'));
                files.forEach(f => { try { fs.writeFileSync(path.join(dataDir, f), '{}'); } catch {} });
                return send(`✅ Cleared *${files.length}* data file(s).`);
            }
            return send('✅ No data files to clear.');
        }

        if (cmd === 'setbotpic') {
            const msg    = message.message;
            const imgMsg = msg?.imageMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            if (!imgMsg) return send('❌ Reply to or send an image with `.setbotpic`');
            try {
                const { dlBuffer } = require('../lib/dlmedia');
                const buf = await dlBuffer(imgMsg, 'image');
                await sock.updateProfilePicture(sock.user?.id || '', buf);
                return send('✅ Bot profile picture updated!');
            } catch { return send('❌ Failed to update bot profile picture.'); }
        }
    }
};
