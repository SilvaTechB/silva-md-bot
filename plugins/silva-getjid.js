'use strict';

const { fmt, getStr } = require('../lib/theme');
const { jidDecode, jidNormalizedUser } = require('@whiskeysockets/baileys');

// ─── Phone-number → country lookup ───────────────────────────────────────────
const COUNTRY_CODES = {
    '1':   '🇺🇸 United States / Canada',  '7':   '🇷🇺 Russia / Kazakhstan',
    '20':  '🇪🇬 Egypt',                    '27':  '🇿🇦 South Africa',
    '30':  '🇬🇷 Greece',                   '31':  '🇳🇱 Netherlands',
    '32':  '🇧🇪 Belgium',                  '33':  '🇫🇷 France',
    '34':  '🇪🇸 Spain',                    '36':  '🇭🇺 Hungary',
    '39':  '🇮🇹 Italy',                    '40':  '🇷🇴 Romania',
    '41':  '🇨🇭 Switzerland',              '43':  '🇦🇹 Austria',
    '44':  '🇬🇧 United Kingdom',           '45':  '🇩🇰 Denmark',
    '46':  '🇸🇪 Sweden',                   '47':  '🇳🇴 Norway',
    '48':  '🇵🇱 Poland',                   '49':  '🇩🇪 Germany',
    '51':  '🇵🇪 Peru',                     '52':  '🇲🇽 Mexico',
    '53':  '🇨🇺 Cuba',                     '54':  '🇦🇷 Argentina',
    '55':  '🇧🇷 Brazil',                   '56':  '🇨🇱 Chile',
    '57':  '🇨🇴 Colombia',                 '58':  '🇻🇪 Venezuela',
    '60':  '🇲🇾 Malaysia',                 '61':  '🇦🇺 Australia',
    '62':  '🇮🇩 Indonesia',                '63':  '🇵🇭 Philippines',
    '64':  '🇳🇿 New Zealand',              '65':  '🇸🇬 Singapore',
    '66':  '🇹🇭 Thailand',                 '81':  '🇯🇵 Japan',
    '82':  '🇰🇷 South Korea',              '84':  '🇻🇳 Vietnam',
    '86':  '🇨🇳 China',                    '90':  '🇹🇷 Turkey',
    '91':  '🇮🇳 India',                    '92':  '🇵🇰 Pakistan',
    '93':  '🇦🇫 Afghanistan',              '94':  '🇱🇰 Sri Lanka',
    '95':  '🇲🇲 Myanmar',                  '98':  '🇮🇷 Iran',
    '212': '🇲🇦 Morocco',                  '213': '🇩🇿 Algeria',
    '216': '🇹🇳 Tunisia',                  '218': '🇱🇾 Libya',
    '220': '🇬🇲 Gambia',                   '221': '🇸🇳 Senegal',
    '223': '🇲🇱 Mali',                     '224': '🇬🇳 Guinea',
    '225': '🇨🇮 Côte d\'Ivoire',           '226': '🇧🇫 Burkina Faso',
    '227': '🇳🇪 Niger',                    '228': '🇹🇬 Togo',
    '229': '🇧🇯 Benin',                    '230': '🇲🇺 Mauritius',
    '231': '🇱🇷 Liberia',                  '232': '🇸🇱 Sierra Leone',
    '233': '🇬🇭 Ghana',                    '234': '🇳🇬 Nigeria',
    '235': '🇹🇩 Chad',                     '236': '🇨🇫 Central African Republic',
    '237': '🇨🇲 Cameroon',                 '238': '🇨🇻 Cape Verde',
    '240': '🇬🇶 Equatorial Guinea',        '241': '🇬🇦 Gabon',
    '242': '🇨🇬 Congo',                    '243': '🇨🇩 DR Congo',
    '244': '🇦🇴 Angola',                   '245': '🇬🇼 Guinea-Bissau',
    '248': '🇸🇨 Seychelles',               '249': '🇸🇩 Sudan',
    '250': '🇷🇼 Rwanda',                   '251': '🇪🇹 Ethiopia',
    '252': '🇸🇴 Somalia',                  '253': '🇩🇯 Djibouti',
    '254': '🇰🇪 Kenya',                    '255': '🇹🇿 Tanzania',
    '256': '🇺🇬 Uganda',                   '257': '🇧🇮 Burundi',
    '258': '🇲🇿 Mozambique',               '260': '🇿🇲 Zambia',
    '261': '🇲🇬 Madagascar',               '263': '🇿🇼 Zimbabwe',
    '264': '🇳🇦 Namibia',                  '265': '🇲🇼 Malawi',
    '266': '🇱🇸 Lesotho',                  '267': '🇧🇼 Botswana',
    '268': '🇸🇿 Eswatini',                 '269': '🇰🇲 Comoros',
    '290': '🇸🇭 Saint Helena',             '291': '🇪🇷 Eritrea',
    '297': '🇦🇼 Aruba',                    '298': '🇫🇴 Faroe Islands',
    '299': '🇬🇱 Greenland',
    '350': '🇬🇮 Gibraltar',                '351': '🇵🇹 Portugal',
    '352': '🇱🇺 Luxembourg',               '353': '🇮🇪 Ireland',
    '354': '🇮🇸 Iceland',                  '355': '🇦🇱 Albania',
    '356': '🇲🇹 Malta',                    '357': '🇨🇾 Cyprus',
    '358': '🇫🇮 Finland',                  '359': '🇧🇬 Bulgaria',
    '370': '🇱🇹 Lithuania',                '371': '🇱🇻 Latvia',
    '372': '🇪🇪 Estonia',                  '373': '🇲🇩 Moldova',
    '374': '🇦🇲 Armenia',                  '375': '🇧🇾 Belarus',
    '376': '🇦🇩 Andorra',                  '377': '🇲🇨 Monaco',
    '380': '🇺🇦 Ukraine',                  '381': '🇷🇸 Serbia',
    '382': '🇲🇪 Montenegro',               '385': '🇭🇷 Croatia',
    '386': '🇸🇮 Slovenia',                 '387': '🇧🇦 Bosnia & Herzegovina',
    '389': '🇲🇰 North Macedonia',          '420': '🇨🇿 Czech Republic',
    '421': '🇸🇰 Slovakia',                 '423': '🇱🇮 Liechtenstein',
    '502': '🇬🇹 Guatemala',                '503': '🇸🇻 El Salvador',
    '504': '🇭🇳 Honduras',                 '505': '🇳🇮 Nicaragua',
    '506': '🇨🇷 Costa Rica',               '507': '🇵🇦 Panama',
    '509': '🇭🇹 Haiti',                    '591': '🇧🇴 Bolivia',
    '592': '🇬🇾 Guyana',                   '593': '🇪🇨 Ecuador',
    '595': '🇵🇾 Paraguay',                 '597': '🇸🇷 Suriname',
    '598': '🇺🇾 Uruguay',                  '880': '🇧🇩 Bangladesh',
    '886': '🇹🇼 Taiwan',                   '960': '🇲🇻 Maldives',
    '961': '🇱🇧 Lebanon',                  '962': '🇯🇴 Jordan',
    '963': '🇸🇾 Syria',                    '964': '🇮🇶 Iraq',
    '965': '🇰🇼 Kuwait',                   '966': '🇸🇦 Saudi Arabia',
    '967': '🇾🇪 Yemen',                    '968': '🇴🇲 Oman',
    '970': '🇵🇸 Palestine',                '971': '🇦🇪 UAE',
    '972': '🇮🇱 Israel',                   '973': '🇧🇭 Bahrain',
    '974': '🇶🇦 Qatar',                    '975': '🇧🇹 Bhutan',
    '976': '🇲🇳 Mongolia',                 '977': '🇳🇵 Nepal',
    '992': '🇹🇯 Tajikistan',               '993': '🇹🇲 Turkmenistan',
    '994': '🇦🇿 Azerbaijan',               '995': '🇬🇪 Georgia',
    '996': '🇰🇬 Kyrgyzstan',               '998': '🇺🇿 Uzbekistan',
};

function detectCountry(phone) {
    for (const len of [3, 2, 1]) {
        const prefix = phone.slice(0, len);
        if (COUNTRY_CODES[prefix]) return COUNTRY_CODES[prefix];
    }
    return '🌍 Unknown';
}

// ─── JID type decoder ─────────────────────────────────────────────────────────
function decodeJid(jid) {
    if (!jid) return { type: 'Unknown', server: '', user: '', device: null };
    const decoded = jidDecode(jid) || {};
    const server  = decoded.server || jid.split('@')[1] || '';
    const user    = decoded.user   || jid.split('@')[0]?.split(':')[0] || '';
    const device  = decoded.device ?? null;

    let type = 'Unknown';
    if (server === 'g.us')              type = '👥 Group';
    else if (server === 'lid')          type = '🔐 LID Account';
    else if (server === 's.whatsapp.net') type = '👤 User';
    else if (server === 'newsletter')   type = '📢 Newsletter / Channel';
    else if (server === 'broadcast')    type = '📡 Broadcast';
    else if (server === 'call')         type = '📞 Call';

    return { type, server, user, device };
}

// ─── Safe API wrappers ────────────────────────────────────────────────────────
async function safeProfilePic(sock, jid) {
    try { return await sock.profilePictureUrl(jid, 'image', 3000); } catch { return null; }
}
async function safeStatus(sock, jid) {
    try {
        const res = await sock.fetchStatus(jidNormalizedUser(jid));
        const entry = res?.[0];
        const status = entry?.status?.status || entry?.status || null;
        const ts     = entry?.status?.setAt || null;
        return { text: status || null, setAt: ts ? new Date(ts * 1000) : null };
    } catch { return { text: null, setAt: null }; }
}
async function safeBusinessProfile(sock, jid) {
    try { return await sock.getBusinessProfile(jidNormalizedUser(jid)) || null; } catch { return null; }
}
async function safeOnWhatsApp(sock, jid) {
    try {
        const res = await sock.onWhatsApp(jidNormalizedUser(jid));
        return res?.[0] || null;
    } catch { return null; }
}

// ─── Format a date nicely ────────────────────────────────────────────────────
function fmtDate(d) {
    if (!d) return 'N/A';
    return d.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

// ─── Build USER card ─────────────────────────────────────────────────────────
async function buildUserCard(sock, targetJid, ctxJid, isOwner, isSelf) {
    const { type, server, user, device } = decodeJid(targetJid);
    const phone   = user.replace(/\D/g, '');
    const country = server === 's.whatsapp.net' ? detectCountry(phone) : 'N/A';

    const [pic, statusData, bizProfile, waResult] = await Promise.all([
        safeProfilePic(sock, targetJid),
        safeStatus(sock, targetJid),
        safeBusinessProfile(sock, targetJid),
        server === 's.whatsapp.net' ? safeOnWhatsApp(sock, targetJid) : Promise.resolve(null),
    ]);

    const exists  = waResult?.exists !== false;
    const lid     = waResult?.lid || null;
    const isBiz   = !!bizProfile;

    let lines = [];
    lines.push(`┌──────────────────────┐`);
    lines.push(`   🔍 *JID Intelligence Report*`);
    lines.push(`└──────────────────────┘`);
    lines.push('');

    // ── Identity ──────────────────────────────────────────────────────────────
    lines.push(`*🆔 Identity*`);
    lines.push(`• *JID:* \`${targetJid}\``);
    if (lid)    lines.push(`• *LID:* \`${lid}\` _(privacy alias)_`);
    if (device !== null) lines.push(`• *Device ID:* \`${device}\``);
    lines.push(`• *Server:* \`${server}\``);
    lines.push(`• *Type:* ${type}`);
    if (isBiz)  lines.push(`• *Account:* 🏢 Business Account`);
    else if (server === 's.whatsapp.net') lines.push(`• *Account:* 👤 Personal Account`);
    lines.push('');

    // ── Phone & Location ──────────────────────────────────────────────────────
    if (server === 's.whatsapp.net') {
        lines.push(`*📱 Phone Details*`);
        lines.push(`• *Number:* +${phone}`);
        lines.push(`• *Country:* ${country}`);
        lines.push(`• *On WhatsApp:* ${exists ? '✅ Yes' : '❌ No'}`);
        lines.push('');
    }

    // ── WhatsApp Status / Bio ─────────────────────────────────────────────────
    lines.push(`*💬 Status / Bio*`);
    if (statusData.text) {
        lines.push(`• ${statusData.text}`);
        if (statusData.setAt) lines.push(`• _Set: ${fmtDate(statusData.setAt)}_`);
    } else {
        lines.push(`• _No status set_`);
    }
    lines.push('');

    // ── Business Profile ──────────────────────────────────────────────────────
    if (isBiz) {
        lines.push(`*🏢 Business Profile*`);
        if (bizProfile.category)    lines.push(`• *Category:* ${bizProfile.category}`);
        if (bizProfile.description) lines.push(`• *Description:* ${bizProfile.description}`);
        if (bizProfile.address)     lines.push(`• *Address:* ${bizProfile.address}`);
        if (bizProfile.email)       lines.push(`• *Email:* ${bizProfile.email}`);
        if (bizProfile.website?.length) lines.push(`• *Website:* ${bizProfile.website.join(', ')}`);
        lines.push('');
    }

    // ── Flags ─────────────────────────────────────────────────────────────────
    const flags = [];
    if (isSelf)   flags.push('🤖 This bot');
    if (isOwner)  flags.push('👑 Bot owner');
    if (lid)      flags.push('🔐 LID-enabled (privacy mode)');
    if (isBiz)    flags.push('🏢 Business account');
    if (flags.length) {
        lines.push(`*🏷️ Flags*`);
        flags.forEach(f => lines.push(`• ${f}`));
        lines.push('');
    }

    // ── Technical ─────────────────────────────────────────────────────────────
    if (isOwner || isSelf) {
        lines.push(`*⚙️ Technical*`);
        lines.push(`• *JID format:* user:device@server`);
        lines.push(`• *User part:* \`${user}\``);
        lines.push(`• *Profile pic:* ${pic ? '✅ Available' : '🔒 Hidden / None'}`);
        lines.push('');
    }

    lines.push(`_Powered by Silva MD — Real-time WhatsApp intelligence_`);

    return { text: fmt(lines.join('\n')), pic };
}

// ─── Build GROUP card ─────────────────────────────────────────────────────────
async function buildGroupCard(sock, groupJid, isAdmin) {
    let meta = null;
    try { meta = await sock.groupMetadata(groupJid); } catch { /* ignore */ }
    if (!meta) return { text: fmt('❌ Could not fetch group metadata.'), pic: null };

    const participants = meta.participants || [];
    const superAdmins  = participants.filter(p => p.admin === 'superadmin');
    const admins       = participants.filter(p => p.admin === 'admin');
    const members      = participants.filter(p => !p.admin);
    const created      = meta.creation ? new Date(meta.creation * 1000) : null;

    let inviteCode = null;
    if (isAdmin) {
        try { inviteCode = await sock.groupInviteCode(groupJid); } catch { /* ignore */ }
    }

    const pic = await safeProfilePic(sock, groupJid);

    const restrictions = meta.announce ? '🔒 Admins only'      : '🔓 All members';
    const editInfo     = meta.restrict  ? '🔒 Admins only'      : '🔓 All members';
    const addMode      = meta.joinApprovalMode ? '✅ Approval needed' : '❌ Open join';
    const ephemeral    = meta.ephemeralDuration
        ? `⏳ ${meta.ephemeralDuration / 86400}d disappearing`
        : '❌ Off';

    const lines = [];
    lines.push(`┌──────────────────────┐`);
    lines.push(`   🔍 *Group Intelligence Report*`);
    lines.push(`└──────────────────────┘`);
    lines.push('');

    lines.push(`*🆔 Identity*`);
    lines.push(`• *Group JID:* \`${groupJid}\``);
    lines.push(`• *Group ID:* \`${groupJid.split('@')[0]}\``);
    lines.push(`• *Name:* ${meta.subject || 'N/A'}`);
    lines.push(`• *Owner:* @${(meta.owner || '').split('@')[0] || 'Unknown'}`);
    lines.push(`• *Created:* ${fmtDate(created)}`);
    lines.push('');

    lines.push(`*👥 Membership*`);
    lines.push(`• *Total:* ${participants.length} members`);
    lines.push(`• 👑 Super Admins: ${superAdmins.length}`);
    lines.push(`• 🛡️ Admins: ${admins.length}`);
    lines.push(`• 👤 Regular members: ${members.length}`);
    lines.push('');

    lines.push(`*⚙️ Group Settings*`);
    lines.push(`• *Send messages:* ${restrictions}`);
    lines.push(`• *Edit group info:* ${editInfo}`);
    lines.push(`• *Join approval:* ${addMode}`);
    lines.push(`• *Disappearing msgs:* ${ephemeral}`);
    lines.push('');

    if (meta.desc) {
        const desc = meta.desc.length > 300 ? meta.desc.slice(0, 300) + '…' : meta.desc;
        lines.push(`*📝 Description*`);
        lines.push(desc);
        lines.push('');
    }

    if (inviteCode) {
        lines.push(`*🔗 Invite Link*`);
        lines.push(`https://chat.whatsapp.com/${inviteCode}`);
        lines.push('');
    } else if (isAdmin) {
        lines.push(`*🔗 Invite Link:* _Could not fetch_`);
        lines.push('');
    } else {
        lines.push(`*🔗 Invite Link:* _Admins only_`);
        lines.push('');
    }

    lines.push(`• *Profile pic:* ${pic ? '✅ Available' : '🔒 Hidden / None'}`);
    lines.push('');
    lines.push(`_Powered by Silva MD — Real-time WhatsApp intelligence_`);

    return { text: fmt(lines.join('\n')), pic, mentions: meta.owner ? [meta.owner] : [] };
}

// ─── Plugin entry ─────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['getjid', 'jid', 'whois', 'userinfo', 'jidinfo', 'chatinfo'],
    description: 'Advanced JID & account intelligence — user, group, business, LID, country, bio and more',
    usage:       '.jid | .whois @user | .jidinfo +2547XXXXXXXX | .chatinfo',
    permission:  'member',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, from, isAdmin, isOwner, mentionedJid, contextInfo, reply } = ctx;
        const config = require('../config');

        // ── Resolve target ────────────────────────────────────────────────────
        const quotedParticipant = message.message?.extendedTextMessage?.contextInfo?.participant;
        const rawArg = args[0]?.replace(/[^0-9+]/g, '');

        let targetJid = null;
        let resolvedFrom = 'chat';

        if (quotedParticipant) {
            targetJid   = jidNormalizedUser(quotedParticipant);
            resolvedFrom = 'quoted message';
        } else if (mentionedJid?.length) {
            targetJid   = jidNormalizedUser(mentionedJid[0]);
            resolvedFrom = 'mention';
        } else if (rawArg && /^\+?\d{5,15}$/.test(rawArg)) {
            const num   = rawArg.replace('+', '');
            targetJid   = `${num}@s.whatsapp.net`;
            resolvedFrom = 'number';
        } else {
            targetJid   = jid;
            resolvedFrom = 'current chat';
        }

        const isGroup     = targetJid.endsWith('@g.us');
        const isSelf      = jidNormalizedUser(targetJid) === jidNormalizedUser(sock.user?.id || '');
        const isTargetOwner = !isGroup && targetJid.split('@')[0] === config.OWNER_NUMBER;

        try {
            await sock.sendPresenceUpdate('composing', jid);

            let card;
            if (isGroup) {
                card = await buildGroupCard(sock, targetJid, isAdmin);
            } else {
                card = await buildUserCard(sock, targetJid, jid, isTargetOwner, isSelf);
            }

            const sendOpts = { quoted: message };
            if (card.pic) {
                await sock.sendMessage(jid, {
                    image:      { url: card.pic },
                    caption:    card.text,
                    mentions:   card.mentions || [],
                    contextInfo,
                }, sendOpts);
            } else {
                await sock.sendMessage(jid, {
                    text:     card.text,
                    mentions: card.mentions || [],
                    contextInfo,
                }, sendOpts);
            }

            await sock.sendPresenceUpdate('paused', jid);

        } catch (err) {
            console.error('[JIDInfo]', err.message);
            await reply(fmt(`❌ Failed to fetch info.\n_Error: ${err.message}_`));
        }
    }
};
