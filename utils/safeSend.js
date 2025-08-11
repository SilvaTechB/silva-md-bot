// utils/safeSend.js
const { isJidGroup } = require('@whiskeysockets/baileys');

/**
 * Delay helper
 */
const delay = ms => new Promise(res => setTimeout(res, ms));

/**
 * Warm up all sessions in a group before sending.
 * Forces prekey bundle fetch for each participant so group sends don't fail
 * with "Closing open session in favor of incoming prekey bundle".
 */
async function warmupGroup(sock, groupJid) {
    let metadata;
    try {
        metadata = await sock.groupMetadata(groupJid);
    } catch (err) {
        console.warn(`⚠️ Could not fetch group metadata for ${groupJid}: ${err.message}`);
        return;
    }

    const jids = metadata.participants
        .map(p => p.id)
        .filter(id => id && id !== sock?.user?.id);

    for (const jid of jids) {
        try { await sock.presenceSubscribe(jid); } catch {}
    }

    // Give signal layer a moment to set up sessions
    await delay(500);
}

/**
 * Safe send wrapper
 * - Groups: warm up all participant sessions first
 * - Privates: presenceSubscribe the single peer
 * - Retries only on likely session issues
 */
async function safeSend(sock, jid, content, options = {}, retries = 3) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            if (isJidGroup(jid)) {
                await warmupGroup(sock, jid);
            } else {
                try { await sock.presenceSubscribe(jid); } catch {}
                await delay(250);
            }

            return await sock.sendMessage(jid, content, options);

        } catch (err) {
            const msg = err?.message || String(err);
            const isSessionIssue = /no sessions?/i.test(msg) ||
                                   /closing open session/i.test(msg);

            if (!isSessionIssue || attempt === retries) {
                // Non-session errors or final failure — bubble it up
                throw err;
            }

            console.warn(`⚠️ safeSend retry ${attempt}/${retries} for ${jid}: ${msg}`);
            await delay(600);
        }
    }
}

module.exports = { safeSend, delay, warmupGroup };
