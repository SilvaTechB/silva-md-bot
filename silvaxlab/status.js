/**
 * Silva MD – Auto Status View & React
 * Compatible with handler-based plugin loader
 */

const handler = {
    help: [],
    tags: ["system"],
    command: /^$/i, // silent plugin (no command)

    execute: async ({ sock, message, config }) => {
        try {
            // Status messages come from this JID
            if (!message?.key) return;
            if (message.key.remoteJid !== "status@broadcast") return;
            if (message.key.fromMe) return;

            // Use the centralized status handler for consistency
            const statusHandler = require('../lib/status.js');
            await statusHandler.handle({
                messages: [message],
                type: 'upsert',
                sock: sock,
                config: config,
                logMessage: () => {} 
            });

        } catch (err) {
            console.log("[STATUS PLUGIN ERROR]", err);
        }
    }
};

module.exports = { handler };
