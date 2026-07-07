'use strict';

const fs   = require('fs');
const path = require('path');
const { fmt } = require('../lib/theme');

const BAD_WORDS_FILE = path.join(__dirname, '../data/badwords.json');
function loadBadWords(jid) {
    try { const d = JSON.parse(fs.readFileSync(BAD_WORDS_FILE, 'utf8')); return d[jid] || []; } catch { return []; }
}
function saveBadWords(jid, words) {
    let d = {}; try { d = JSON.parse(fs.readFileSync(BAD_WORDS_FILE, 'utf8')); } catch {}
    d[jid] = words;
    fs.mkdirSync(path.dirname(BAD_WORDS_FILE), { recursive: true });
    fs.writeFileSync(BAD_WORDS_FILE, JSON.stringify(d, null, 2));
}

module.exports = {
    commands: [
        'accept', 'acceptall', 'reject', 'rejectall', 'listrequests',
        'add', 'everyone', 'gcdesc', 'gcpp', 'getgcpp', 'getlid',
        'groupname', 'groupsettings', 'killgc', 'link', 'del',
        'mute', 'newgroup', 'online', 'resetgroup', 'resetlink',
        'setantilink', 'tagadmins', 'vcf', 'antigroupmention', 'antipromote',
        'badwords', 'setantibad', 'setantigcmentionwarnlimit',
        'setgroupevents', 'welcomemessage', 'goodbyemessage',
        'disapp', 'left', 'antibadwarn', 'antilinkwarn', 'menus', 'list'
    ],
    description: 'Extended group management commands',
    permission:  'admin',
    group:       true,
    private:     false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isBotAdmin, contextInfo, groupMetadata, mentionedJid, theme, isOwner } = ctx;
        const participants = groupMetadata?.participants || [];

        const rawText = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim();
        const cmd = rawText.split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        const send = (text, extra = {}) =>
            sock.sendMessage(jid, { text: fmt(text), contextInfo, ...extra }, { quoted: message });

        const adminCheck = () => {
            if (!isAdmin) { send(theme.admin || '⛔ Only admins can use this command.'); return false; }
            return true;
        };
        const botAdminCheck = () => {
            if (!isBotAdmin) { send(theme.botAdmin || '⛔ I need to be an admin.'); return false; }
            return true;
        };

        if (cmd === 'link') {
            if (!adminCheck()) return;
            try {
                const link = await sock.groupInviteCode(jid);
                return send(`🔗 *Group Invite Link*\n\nhttps://chat.whatsapp.com/${link}\n\n_Use .resetlink to revoke this link_`);
            } catch { return send('❌ Failed to get invite link. Make sure I am an admin.'); }
        }

        if (cmd === 'resetlink') {
            if (!adminCheck() || !botAdminCheck()) return;
            try {
                await sock.groupRevokeInvite(jid);
                return send('🔄 *Invite link revoked!* A new link has been generated.');
            } catch { return send('❌ Failed to revoke invite link.'); }
        }

        if (cmd === 'groupname') {
            if (!adminCheck() || !botAdminCheck()) return;
            const name = args.join(' ').trim();
            if (!name) return send('❌ *Usage:* `.groupname <new name>`');
            try {
                await sock.groupUpdateSubject(jid, name);
                return send(`✅ Group name changed to *${name}*`);
            } catch { return send('❌ Failed to update group name.'); }
        }

        if (cmd === 'gcdesc') {
            if (!adminCheck() || !botAdminCheck()) return;
            const desc = args.join(' ').trim();
            if (!desc) return send('❌ *Usage:* `.gcdesc <new description>`');
            try {
                await sock.groupUpdateDescription(jid, desc);
                return send('✅ Group description updated!');
            } catch { return send('❌ Failed to update description.'); }
        }

        if (cmd === 'gcpp') {
            if (!adminCheck() || !botAdminCheck()) return;
            const msg    = message.message;
            const imgMsg = msg?.imageMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            if (!imgMsg) return send('❌ Reply to or send an image with `.gcpp`');
            try {
                const { dlBuffer } = require('../lib/dlmedia');
                const buf = await dlBuffer(imgMsg, 'image');
                await sock.updateProfilePicture(jid, buf);
                return send('✅ Group photo updated!');
            } catch { return send('❌ Failed to update group photo.'); }
        }

        if (cmd === 'getgcpp') {
            try {
                const ppUrl = await sock.profilePictureUrl(jid, 'image');
                await sock.sendMessage(jid, { image: { url: ppUrl }, caption: fmt('🖼️ *Group Profile Picture*'), contextInfo }, { quoted: message });
            } catch { return send('❌ Could not fetch group photo.'); }
            return;
        }

        if (cmd === 'getlid') {
            const target = mentionedJid?.[0]
                || message.message?.extendedTextMessage?.contextInfo?.participant;
            if (!target) return send('❌ Reply to or mention a user.\n\n*Usage:* `.getlid @user`');
            const p = participants.find(x => x.id === target || x.lid === target);
            return send(`🆔 *LID Info*\n\n👤 Phone: @${target.split('@')[0]}\n🔖 LID: ${p?.lid || 'N/A'}`, { mentions: [target] });
        }

        if (cmd === 'add') {
            if (!adminCheck() || !botAdminCheck()) return;
            const nums = args.join(' ').replace(/[^0-9,\s]/g, '').split(/[\s,]+/).filter(Boolean);
            if (!nums.length) return send('❌ *Usage:* `.add <number(s)>`\n\nExample: `.add 254712345678`');
            const jids  = nums.map(n => `${n}@s.whatsapp.net`);
            const res   = await sock.groupParticipantsUpdate(jid, jids, 'add').catch(() => null);
            const added = res ? jids.map(j => `+${j.split('@')[0]}`).join(', ') : '(unknown)';
            return send(`✅ Added: ${added}`);
        }

        if (cmd === 'del') {
            if (!adminCheck() || !botAdminCheck()) return;
            const key = message.message?.extendedTextMessage?.contextInfo?.stanzaId;
            const participant = message.message?.extendedTextMessage?.contextInfo?.participant;
            if (!key) return send('❌ Reply to the message you want to delete.');
            try {
                await sock.sendMessage(jid, { delete: { remoteJid: jid, fromMe: false, id: key, participant } });
                return send('🗑️ Message deleted.');
            } catch { return send('❌ Failed to delete message. Make sure I am an admin.'); }
        }

        if (cmd === 'mute') {
            if (!adminCheck() || !botAdminCheck()) return;
            try {
                await sock.groupSettingUpdate(jid, 'announcement');
                return send('🔇 *Group muted!* Only admins can send messages.');
            } catch { return send('❌ Failed to mute group.'); }
        }

        if (cmd === 'unmute' || (cmd === 'open' && args.length === 0)) {
            if (!adminCheck() || !botAdminCheck()) return;
            try {
                await sock.groupSettingUpdate(jid, 'not_announcement');
                return send('🔊 *Group unmuted!* Everyone can send messages.');
            } catch { return send('❌ Failed to unmute group.'); }
        }

        if (cmd === 'disapp') {
            if (!adminCheck() || !botAdminCheck()) return;
            const secs = parseInt(args[0]) || 0;
            const valid = [0, 86400, 604800, 7776000];
            const v     = valid.includes(secs) ? secs : (secs === 0 ? 0 : 604800);
            try {
                await sock.groupToggleEphemeral(jid, v);
                const label = v === 0 ? 'OFF' : v === 86400 ? '24 hours' : v === 604800 ? '7 days' : '90 days';
                return send(`⏳ Disappearing messages set to: *${label}*`);
            } catch { return send('❌ Failed to set disappearing messages.'); }
        }

        if (cmd === 'groupsettings') {
            const p     = participants;
            const admins = p.filter(x => x.admin).length;
            const ephem  = groupMetadata?.ephemeralDuration;
            const label  = ephem ? (ephem === 86400 ? '24h' : ephem === 604800 ? '7 days' : '90 days') : 'OFF';
            return send(
                `⚙️ *Group Settings*\n\n` +
                `👥 Members: *${p.length}*\n` +
                `👑 Admins: *${admins}*\n` +
                `🔒 Locked: *${groupMetadata?.announce ? 'Yes' : 'No'}*\n` +
                `⏳ Disappear: *${label}*\n` +
                `📝 Description: ${groupMetadata?.desc ? groupMetadata.desc.slice(0, 80) : 'None'}`
            );
        }

        if (cmd === 'killgc') {
            if (!isOwner) return send('⛔ Owner only.');
            if (!botAdminCheck()) return;
            await send('💀 *Goodbye!* The bot is leaving this group...');
            try { await sock.groupLeave(jid); } catch {}
            return;
        }

        if (cmd === 'newgroup') {
            if (!isOwner) return send('⛔ Owner only.');
            const name = args.join(' ').trim();
            if (!name) return send('❌ *Usage:* `.newgroup <group name>`');
            try {
                const created = await sock.groupCreate(name, []);
                return send(`✅ Group *${name}* created!\nJID: ${created.id}`);
            } catch { return send('❌ Failed to create group.'); }
        }

        if (cmd === 'everyone') {
            if (!adminCheck()) return;
            const text = args.join(' ').trim() || '👋 Attention everyone!';
            const mentions = participants.map(p => p.id);
            const names    = mentions.map(j => `@${j.split('@')[0]}`).join(' ');
            return sock.sendMessage(jid, { text: fmt(`📢 ${text}\n\n${names}`), mentions, contextInfo }, { quoted: message });
        }

        if (cmd === 'tagadmins') {
            if (!adminCheck()) return;
            const admins  = participants.filter(p => p.admin).map(p => p.id);
            if (!admins.length) return send('❌ No admins found.');
            const text = args.join(' ').trim() || '👑 Admins, your attention please!';
            const names = admins.map(j => `@${j.split('@')[0]}`).join(' ');
            return sock.sendMessage(jid, { text: fmt(`${text}\n\n${names}`), mentions: admins, contextInfo }, { quoted: message });
        }

        if (cmd === 'listrequests') {
            if (!adminCheck()) return;
            try {
                const reqs = await sock.groupRequestParticipantsList(jid);
                if (!reqs?.length) return send('📋 *Join Requests*\n\nNo pending join requests.');
                const list = reqs.slice(0, 20).map((r, i) => `*${i + 1}.* +${r.jid?.split('@')[0]}`).join('\n');
                return send(`📋 *Join Requests (${reqs.length})*\n\n${list}\n\nUse \`.accept all\` or \`.reject all\``);
            } catch { return send('❌ Failed to fetch join requests.'); }
        }

        if (cmd === 'accept') {
            if (!adminCheck() || !botAdminCheck()) return;
            try {
                const reqs = await sock.groupRequestParticipantsList(jid);
                if (!reqs?.length) return send('📋 No pending join requests.');
                const sub = args[0]?.toLowerCase();
                if (sub === 'all') {
                    await sock.groupRequestParticipantsUpdate(jid, reqs.map(r => r.jid), 'approve');
                    return send(`✅ Approved all *${reqs.length}* pending requests.`);
                }
                const target = mentionedJid?.[0] || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);
                if (!target) return send('❌ Mention or provide number, or use `.accept all`');
                await sock.groupRequestParticipantsUpdate(jid, [target], 'approve');
                return send(`✅ Approved @${target.split('@')[0]}'s join request.`, { mentions: [target] });
            } catch { return send('❌ Failed to accept request.'); }
        }

        if (cmd === 'acceptall') {
            if (!adminCheck() || !botAdminCheck()) return;
            try {
                const reqs = await sock.groupRequestParticipantsList(jid);
                if (!reqs?.length) return send('📋 No pending join requests.');
                await sock.groupRequestParticipantsUpdate(jid, reqs.map(r => r.jid), 'approve');
                return send(`✅ Approved all *${reqs.length}* pending requests.`);
            } catch { return send('❌ Failed to accept all requests.'); }
        }

        if (cmd === 'reject') {
            if (!adminCheck() || !botAdminCheck()) return;
            try {
                const reqs = await sock.groupRequestParticipantsList(jid);
                if (!reqs?.length) return send('📋 No pending join requests.');
                const sub = args[0]?.toLowerCase();
                if (sub === 'all') {
                    await sock.groupRequestParticipantsUpdate(jid, reqs.map(r => r.jid), 'reject');
                    return send(`❌ Rejected all *${reqs.length}* pending requests.`);
                }
                const target = mentionedJid?.[0] || (args[0] ? `${args[0].replace(/\D/g, '')}@s.whatsapp.net` : null);
                if (!target) return send('❌ Mention a user or use `.reject all`');
                await sock.groupRequestParticipantsUpdate(jid, [target], 'reject');
                return send(`❌ Rejected @${target.split('@')[0]}'s join request.`, { mentions: [target] });
            } catch { return send('❌ Failed to reject request.'); }
        }

        if (cmd === 'rejectall') {
            if (!adminCheck() || !botAdminCheck()) return;
            try {
                const reqs = await sock.groupRequestParticipantsList(jid);
                if (!reqs?.length) return send('📋 No pending join requests.');
                await sock.groupRequestParticipantsUpdate(jid, reqs.map(r => r.jid), 'reject');
                return send(`❌ Rejected all *${reqs.length}* pending requests.`);
            } catch { return send('❌ Failed to reject all requests.'); }
        }

        if (cmd === 'online') {
            const text = participants.map((p, i) => `*${i + 1}.* @${p.id.split('@')[0]}`).join('\n');
            return sock.sendMessage(jid, {
                text: fmt(`👥 *Group Members (${participants.length})*\n\n${text}`),
                mentions: participants.map(p => p.id),
                contextInfo
            }, { quoted: message });
        }

        if (cmd === 'left') {
            if (!global.leftMembers) global.leftMembers = new Map();
            const lefts = (global.leftMembers.get(jid) || []).slice(-20);
            if (!lefts.length) return send('📤 *Left Members*\n\nNo one has left this group recently.');
            const list = lefts.map((j, i) => `*${i + 1}.* +${j.split('@')[0]}`).join('\n');
            return send(`📤 *Recently Left Members (${lefts.length})*\n\n${list}`);
        }

        if (cmd === 'vcf') {
            if (!adminCheck()) return;
            const lines = participants.map(p => {
                const num = p.id.split('@')[0];
                return `BEGIN:VCARD\nVERSION:3.0\nFN:+${num}\nTEL;TYPE=CELL:+${num}\nEND:VCARD`;
            }).join('\n');
            const buf = Buffer.from(lines, 'utf8');
            await sock.sendMessage(jid, {
                document: buf,
                mimetype: 'text/vcard',
                fileName: `${groupMetadata?.subject || 'group'}_contacts.vcf`,
                caption:  fmt(`📇 Exported *${participants.length}* contacts`)
            }, { quoted: message });
            return;
        }

        if (cmd === 'badwords') {
            const words = loadBadWords(jid);
            if (!words.length) return send('🚫 *Bad Words Filter*\n\nNo bad words set.\n\nUse `.setantibad <word1, word2>` to add words.');
            return send(`🚫 *Bad Words (${words.length})*\n\n${words.map(w => `• ${w}`).join('\n')}`);
        }

        if (cmd === 'setantibad') {
            if (!adminCheck()) return;
            const words = args.join(' ').split(/[,\s]+/).map(w => w.trim().toLowerCase()).filter(Boolean);
            if (!words.length) return send('❌ *Usage:* `.setantibad <word1, word2, ...>`');
            const existing = loadBadWords(jid);
            const merged   = [...new Set([...existing, ...words])];
            saveBadWords(jid, merged);
            return send(`✅ Added *${words.length}* word(s) to bad word filter.\nTotal: *${merged.length}* words`);
        }

        if (cmd === 'setantilink') {
            if (!adminCheck()) return;
            if (!global.antilinkGroups) global.antilinkGroups = new Set();
            const sub = (args[0] || 'on').toLowerCase();
            if (sub === 'on' || sub === 'enable') {
                global.antilinkGroups.add(jid);
                return send('🔗 *Anti-Link ON* — Links will be deleted and sender warned.');
            }
            global.antilinkGroups.delete(jid);
            return send('🔗 *Anti-Link OFF*');
        }

        if (cmd === 'antigroupmention') {
            if (!adminCheck()) return;
            if (!global.antiGcMention) global.antiGcMention = new Set();
            const sub = (args[0] || 'on').toLowerCase();
            if (sub === 'on') { global.antiGcMention.add(jid); return send('🔕 *Anti-Group Mention ON*'); }
            global.antiGcMention.delete(jid);
            return send('🔕 *Anti-Group Mention OFF*');
        }

        if (cmd === 'antipromote') {
            if (!adminCheck()) return;
            if (!global.antiPromote) global.antiPromote = new Set();
            const sub = (args[0] || 'on').toLowerCase();
            if (sub === 'on') { global.antiPromote.add(jid); return send('⬆️ *Anti-Promote ON* — Non-admin promotions will be reversed.'); }
            global.antiPromote.delete(jid);
            return send('⬆️ *Anti-Promote OFF*');
        }

        if (cmd === 'antibadwarn') {
            if (!adminCheck()) return;
            return send('⚠️ *Anti-Bad Word Warn*\n\nMembers who use bad words are automatically warned.\n\nManage words with `.setantibad <words>` and `.badwords`');
        }

        if (cmd === 'antilinkwarn') {
            if (!adminCheck()) return;
            return send('⚠️ *Anti-Link Warn*\n\nMembers who post links get warned.\n\nToggle with `.setantilink on/off`');
        }

        if (cmd === 'setantigcmentionwarnlimit') {
            if (!adminCheck()) return;
            const limit = parseInt(args[0]);
            if (!limit || limit < 1) return send('❌ *Usage:* `.setantigcmentionwarnlimit <number>`\n\nExample: `.setantigcmentionwarnlimit 3`');
            if (!global.antiGcMentionLimits) global.antiGcMentionLimits = new Map();
            global.antiGcMentionLimits.set(jid, limit);
            return send(`✅ Anti-group-mention warn limit set to *${limit}* warnings.`);
        }

        if (cmd === 'setgroupevents') {
            if (!adminCheck()) return;
            const sub = (args[0] || 'on').toLowerCase();
            if (!global.groupEventsDisabled) global.groupEventsDisabled = new Set();
            if (sub === 'off') { global.groupEventsDisabled.add(jid); return send('📢 *Group Events OFF* — Join/leave messages will be suppressed.'); }
            global.groupEventsDisabled.delete(jid);
            return send('📢 *Group Events ON* — Join/leave messages will be sent.');
        }

        if (cmd === 'welcomemessage') {
            if (!global.welcomeSettings) return send('❌ Welcome plugin not loaded.');
            const s = global.welcomeSettings.get(jid) || {};
            const status = s.welcome ? '✅ ON' : '❌ OFF';
            const msg    = s.customWelcome || '(default)';
            return send(`👋 *Welcome Message*\n\nStatus: *${status}*\nMessage: ${msg}\n\nEdit with \`.setwelcome <message>\``);
        }

        if (cmd === 'goodbyemessage') {
            if (!global.welcomeSettings) return send('❌ Welcome plugin not loaded.');
            const s = global.welcomeSettings.get(jid) || {};
            const status = s.goodbye ? '✅ ON' : '❌ OFF';
            const msg    = s.customGoodbye || '(default)';
            return send(`👋 *Goodbye Message*\n\nStatus: *${status}*\nMessage: ${msg}\n\nEdit with \`.setgoodbye <message>\``);
        }

        if (cmd === 'resetgroup') {
            if (!isOwner) return send('⛔ Owner only.');
            if (!botAdminCheck()) return;
            try {
                await sock.groupSettingUpdate(jid, 'not_announcement');
                await sock.groupToggleEphemeral(jid, 0);
                return send('🔄 Group settings reset to defaults.');
            } catch { return send('❌ Failed to reset group settings.'); }
        }

        if (cmd === 'menus') {
            const menuPlugin = require('./menu');
            if (menuPlugin?.run) return menuPlugin.run(sock, message, args, ctx);
            return send('❌ Menu plugin not found.');
        }

        if (cmd === 'list') {
            const { loadPlugins: lp } = require('../handler');
            const pl = lp ? lp() : null;
            const allCmds = [];
            const dir = path.join(__dirname);
            fs.readdirSync(dir).filter(f => f.endsWith('.js')).forEach(f => {
                try {
                    const p = require(path.join(dir, f));
                    const mods = Array.isArray(p) ? p : [p];
                    mods.forEach(m => { if (m?.commands) allCmds.push(...m.commands); });
                } catch {}
            });
            const sorted = [...new Set(allCmds)].sort();
            const chunks = [];
            for (let i = 0; i < sorted.length; i += 40) chunks.push(sorted.slice(i, i + 40));
            for (const chunk of chunks) {
                await sock.sendMessage(jid, {
                    text: fmt(`📋 *Command List*\n\n${chunk.map(c => `• .${c}`).join('\n')}`),
                    contextInfo
                }, { quoted: message });
            }
            return;
        }
    }
};
