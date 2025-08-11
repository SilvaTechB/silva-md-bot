// handler.js
// Message handler for Silva MD Bot using Baileys MD
// Supports group and private chats, plugin filtering, and command/non-command triggers

const fs = require('fs');
const path = require('path');
const { isJidGroup } = require('@whiskeysockets/baileys');
const config = require('./config'); // Load prefix from config.js

// Load all plugins from /plugins folder
const plugins = [];
const pluginFiles = fs.readdirSync(path.join(__dirname, 'plugins')).filter(file => file.endsWith('.js'));

for (const file of pluginFiles) {
    try {
        const plugin = require(path.join(__dirname, 'plugins', file));
        if (plugin && plugin.name && typeof plugin.run === 'function') {
            plugins.push(plugin);
        } else {
            console.warn(`[Plugin Loader] Skipped invalid plugin: ${file}`);
        }
    } catch (err) {
        console.error(`[Plugin Loader] Error loading plugin ${file}:`, err);
    }
}

/**
 * Main message handler
 * @param {import('@whiskeysockets/baileys').WASocket} sock - Baileys socket instance
 * @param {import('@whiskeysockets/baileys').proto.WebMessageInfo} message - Incoming message object
 */
async function handleMessages(sock, message) {
    try {
        const msg = message.message;
        const sender = message.key.fromMe ? sock.user.id : message.key.participant || message.key.remoteJid;
        const chatId = message.key.remoteJid;

        // Ignore messages from the bot itself
        if (message.key.fromMe) return;

        const isGroup = isJidGroup(chatId);
        let groupMetadata = null;

        // Fetch group metadata only if needed
        if (isGroup) {
            try {
                groupMetadata = await sock.groupMetadata(chatId);
            } catch (err) {
                console.warn(`[Group Metadata] Failed to fetch metadata for ${chatId}:`, err);
            }
        }

        // Extract message content
        const text = msg?.conversation || msg?.extendedTextMessage?.text || msg?.imageMessage?.caption || '';
        if (!text) return;

        // Parse command and arguments using prefix from config
        const prefix = config.PREFIX || '.';
        const isCommand = text.startsWith(prefix);
        const args = isCommand ? text.slice(prefix.length).trim().split(/\s+/) : [];
        const command = args.shift()?.toLowerCase();

        // Loop through plugins
        for (const plugin of plugins) {
            try {
                // Check plugin scope
                if (isGroup && !plugin.group) continue;
                if (!isGroup && !plugin.private) continue;

                // If command-based, match plugin name
                if (isCommand && plugin.name === command) {
                    await plugin.run(sock, message, args, groupMetadata);
                }

                // If non-command, allow plugin to handle it internally
                if (!isCommand && typeof plugin.onMessage === 'function') {
                    await plugin.onMessage(sock, message, text, groupMetadata);
                }
            } catch (err) {
                console.error(`[Plugin Error] ${plugin.name} failed:`, err);
            }
        }
    } catch (err) {
        console.error('[Handler Error] Failed to process message:', err);
    }
}

module.exports = { handleMessages };
