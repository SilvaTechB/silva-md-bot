// utils/warmupGroup.js
async function warmupGroup(sock, groupJid) {
    // Get all participants
    const metadata = await sock.groupMetadata(groupJid);
    const jids = metadata.participants.map(p => p.id).filter(id => id !== sock.user.id);

    // Trigger a presenceSubscribe to each member (forces prekey bundle fetch)
    for (const jid of jids) {
        try { await sock.presenceSubscribe(jid); } catch {}
    }
    // Give the signal layer time to settle
    await new Promise(res => setTimeout(res, 500));
}

module.exports = { warmupGroup };
