module.exports = (sock, config) => {
    sock.ev.on('messages.upsert', async ({ messages }) => {
        const m = messages[0];
        if (!m.message) return;

        const from = m.key.remoteJid;
        const isGroup = from.endsWith('@g.us');

        if (isGroup) {
            if (!config.ALLOW_GROUPS) return; // optional toggle
            console.log(`📢 Group message from ${from}`);
        }

        // Here you can call other group‑specific functions
        // e.g., command parser, auto‑reply, AI responder
    });
};
