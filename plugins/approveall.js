'use strict';

const fs = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '..', 'data', 'approve-all.json');
const settings = new Map();

function loadSettings() {
    try {
        const raw = JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
        for (const [jid, enabled] of Object.entries(raw || {})) settings.set(jid, Boolean(enabled));
    } catch { /* first run */ }
}

function saveSettings() {
    try {
        fs.mkdirSync(path.dirname(SETTINGS_PATH), { recursive: true });
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(Object.fromEntries(settings), null, 2));
    } catch (error) { console.warn(`[ApproveAll] settings save failed: ${error.message}`); }
}

loadSettings();

function enabled(jid) { return settings.get(jid) === true; }

async function listPending(sock, jid) {
    if (typeof sock.groupRequestParticipantsList !== 'function') return [];
    return await sock.groupRequestParticipantsList(jid) || [];
}

async function updateRequests(sock, jid, participants, action) {
    const jids = [...new Set((participants || []).filter(Boolean))];
    if (!jids.length) return 0;
    if (typeof sock.groupRequestParticipantsUpdate !== 'function') throw new Error('This Baileys version does not support join-request approvals.');
    await sock.groupRequestParticipantsUpdate(jid, jids, action);
    return jids.length;
}

function requestJid(request) { return request?.jid || request?.id || request?.participant || request; }

module.exports = {
    commands: ['approveall', 'approvejoin', 'rejectjoin', 'joinrequests'],
    description: 'Approve or reject WhatsApp group join requests automatically',
    usage: '.approveall on|off|status | .approvejoin all | .rejectjoin all | .joinrequests',
    permission: 'admin',
    group: true,
    private: false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, isOwner, reply } = ctx;
        if (!isAdmin && !isOwner) return reply('⛔ Only group admins or the owner can manage join requests.');
        const command = String(ctx.command || args.shift() || '').toLowerCase();
        const action = String(args[0] || '').toLowerCase();

        if (command === 'approveall') {
            if (!action || action === 'status') {
                const pending = await listPending(sock, jid).catch(() => []);
                return reply(`🛂 *Join Approval*\n\nAuto-approve: ${enabled(jid) ? '✅ ON' : '❌ OFF'}\nPending requests: ${pending.length}\n\nUse ".approveall on" or ".approveall off".`);
            }
            if (action === 'on' || action === 'enable') {
                settings.set(jid, true); saveSettings();
                const pending = await listPending(sock, jid).catch(() => []);
                const count = await updateRequests(sock, jid, pending.map(requestJid), 'approve').catch(() => 0);
                return reply(`✅ Auto-approval enabled.\n${count ? `Approved ${count} pending request${count === 1 ? '' : 's'}.` : 'No pending requests found.'}`);
            }
            if (action === 'off' || action === 'disable') {
                settings.set(jid, false); saveSettings();
                return reply('⏸️ Auto-approval disabled. New join requests will remain pending.');
            }
            return reply('Usage: `.approveall on`, `.approveall off`, or `.approveall status`');
        }

        const pending = await listPending(sock, jid).catch(() => []);
        if (command === 'joinrequests') {
            if (!pending.length) return reply('📋 No pending join requests.');
            return reply(`📋 *Pending Join Requests (${pending.length})*\n\n${pending.map((r, i) => `${i + 1}. ${requestJid(r)}`).join('\n')}\n\nUse ".approvejoin all" or ".rejectjoin all".`);
        }

        if (action !== 'all') return reply(`Usage: .${command} all`);
        const requestIds = pending.map(requestJid);
        const result = await updateRequests(sock, jid, requestIds, command === 'approvejoin' ? 'approve' : 'reject').catch(error => ({ error }));
        if (result?.error) return reply(`❌ Could not ${command === 'approvejoin' ? 'approve' : 'reject'} requests: ${result.error.message}`);
        return reply(`${command === 'approvejoin' ? '✅ Approved' : '❌ Rejected'} ${result} pending request${result === 1 ? '' : 's'}.`);
    },

    // Called by the central handler for every group.join-request event.
    onJoinRequest: async (sock, update) => {
        const jid = update?.id;
        const participant = update?.participant || requestJid(update);
        const action = String(update?.action || '').toLowerCase();
        if (!jid || !participant || !enabled(jid) || ['approve', 'approved', 'reject', 'rejected'].includes(action)) return;
        try {
            await updateRequests(sock, jid, [participant], 'approve');
            await sock.sendMessage(jid, { text: `✅ Approved join request for @${participant.split('@')[0]}.`, mentions: [participant] });
        } catch (error) {
            console.warn(`[ApproveAll] ${jid} could not approve ${participant}: ${error.message}`);
        }
    },

    isEnabled: enabled,
};
