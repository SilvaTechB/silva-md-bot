'use strict';

const { getCountry, resolvePhoneJid } = require('../lib/phone-utils');

function phoneNum(jid) {
    return jid ? jid.split('@')[0] : '?';
}

// ─── Plugin ───────────────────────────────────────────────────────────────────
module.exports = {
    commands:    ['device', 'devicecheck', 'checkdevice', 'wainfo'],
    description: 'Check WhatsApp account type, linked devices, status and more',
    usage:       '.device @user  |  reply a message  |  .device 2547XXXXXXXX',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, contextInfo, mentionedJid }) => {

        // ── Resolve target JID ──────────────────────────────────────────────
        let targetJid   = null;
        let lidNotCached = false;

        const ctxInfo    = message.message?.extendedTextMessage?.contextInfo;
        const rawQuoted  = ctxInfo?.participant || ctxInfo?.remoteJid;

        if (rawQuoted) {
            targetJid = resolvePhoneJid(rawQuoted);
            if (!targetJid && rawQuoted.endsWith('@lid')) lidNotCached = true;
        }
        if (!targetJid && mentionedJid?.length) {
            targetJid = resolvePhoneJid(mentionedJid[0]);
        }
        if (!targetJid && args[0]) {
            const digits = args[0].replace(/\D/g, '');
            if (digits.length >= 7) targetJid = `${digits}@s.whatsapp.net`;
        }
        if (!targetJid) {
            const from = message.key.participant || message.key.remoteJid;
            targetJid  = resolvePhoneJid(from);
        }

        if (!targetJid) {
            return sock.sendMessage(sender, {
                text: lidNotCached
                    ? '⚠️ That user\'s phone number isn\'t cached yet — ask them to send a message first, then retry.'
                    : '❌ Provide a number, mention someone, or reply to their message.',
                contextInfo
            }, { quoted: message });
        }

        const number = phoneNum(targetJid);

        await sock.sendMessage(sender, {
            text: `🔍 Fetching info for +${number}…`,
            contextInfo
        }, { quoted: message });

        // ── Parallel queries ───────────────────────────────────────────────
        const [
            bizResult,
            devResult,
            statusResult,
            picResult,
        ] = await Promise.allSettled([
            sock.getBusinessProfile(targetJid),
            // getUSyncDevices is the same internal function used when sending messages
            typeof sock.getUSyncDevices === 'function'
                ? sock.getUSyncDevices([targetJid], false, false)
                : Promise.resolve([]),
            sock.fetchStatus(targetJid),
            sock.profilePictureUrl(targetJid, 'preview', 5000),
        ]);

        // ── Parse ──────────────────────────────────────────────────────────
        const biz      = bizResult.status    === 'fulfilled' ? bizResult.value    : null;
        const devJids  = devResult.status     === 'fulfilled' ? (devResult.value || []) : [];
        const statusL  = statusResult.status  === 'fulfilled' ? (statusResult.value || []) : [];
        const picUrl   = picResult.status     === 'fulfilled' ? picResult.value   : null;

        // Device count: devJids = [{user, device}, ...]
        // device 0 = primary phone, 1+ = companions
        const companions  = devJids.filter(d => d.device !== 0).length;
        const totalDev    = devJids.length; // includes the primary phone

        // Status text
        const statusEntry = statusL.find(e => e.status)?.status;
        const statusText  = statusEntry?.status || null;

        // Push name
        const pushName = global.pushNameCache?.get(number)
                      || global.pushNameCache?.get(targetJid)
                      || null;

        // Account type
        const isBiz = !!(biz?.wid);

        // ── Build device line ──────────────────────────────────────────────
        let deviceLine;
        if (totalDev === 0) {
            deviceLine = '📱 Unknown (query returned no data)';
        } else if (companions === 0) {
            deviceLine = '📱 Phone only';
        } else {
            deviceLine = `📱 Phone + ${companions} companion${companions > 1 ? 's' : ''} (Web/Desktop)`;
        }

        // ── Account type ───────────────────────────────────────────────────
        let accountLine, platformLine;
        if (biz?.wid) {
            accountLine  = '🏢 WhatsApp Business';
            platformLine = '📲 WhatsApp Business App';
        } else {
            accountLine  = '👤 Personal (WhatsApp)';
            platformLine = '📲 WhatsApp (Android / iPhone)';
        }

        // ── Country ────────────────────────────────────────────────────────
        const country = getCountry(number);

        // ── Business details ───────────────────────────────────────────────
        let bizBlock = '';
        if (biz?.wid) {
            const rows = [];
            if (biz.description) rows.push(`📝 *About:*    ${biz.description.slice(0, 100)}${biz.description.length > 100 ? '…' : ''}`);
            if (biz.email)        rows.push(`📧 *Email:*    ${biz.email}`);
            if (biz.website?.[0]) rows.push(`🌐 *Website:*  ${biz.website[0]}`);
            if (biz.address)      rows.push(`📍 *Address:*  ${biz.address}`);
            if (rows.length)      bizBlock = '\n│\n│ ' + rows.join('\n│ ');
        }

        // ── Compose reply ──────────────────────────────────────────────────
        const lines = [
            `╭────────────────────────────`,
            `│ 🔎 *WhatsApp Info*`,
            `│ ───────────────────────────`,
            `│ 📞 *Number:*    +${number}`,
        ];
        if (pushName)    lines.push(`│ 👤 *Name:*      ${pushName}`);
        lines.push(
            `│ 🌍 *Country:*   ${country}`,
            `│ ${accountLine.split(' ')[0]} *Account:*   ${accountLine.split(' ').slice(1).join(' ')}`,
            `│ 📲 *Platform:*  ${platformLine}`,
            `│ 💻 *Devices:*   ${deviceLine}`,
        );
        if (statusText)  lines.push(`│ 💬 *Status:*    ${statusText.slice(0, 80)}${statusText.length > 80 ? '…' : ''}`);
        lines.push(`╰────────────────────────────`);
        lines.push('');
        lines.push('_ℹ️ WhatsApp does not share exact OS (iOS/Android). Companion count = linked Web/Desktop sessions._');

        const text = lines.join('\n');

        if (picUrl) {
            try {
                await sock.sendMessage(sender, {
                    image:    { url: picUrl },
                    caption:  text,
                    contextInfo
                }, { quoted: message });
                return;
            } catch { /* fall through to text-only */ }
        }

        await sock.sendMessage(sender, { text, contextInfo }, { quoted: message });
    }
};
