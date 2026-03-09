'use strict';

const fs   = require('fs');
const path = require('path');

const SETTINGS_PATH = path.join(__dirname, '../anti-call-settings.json');

const DEFAULT_SETTINGS = {
    rejectCalls:    true,
    blockCaller:    false,
    notifyAdmin:    true,
    autoReply:      "🚫 I don't accept calls. Please send a text message instead.",
    blockedUsers:   []
};

function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
}

function saveSettings(s) {
    try { fs.writeFileSync(SETTINGS_PATH, JSON.stringify(s, null, 2)); } catch { /* ignore */ }
}

const settings = loadSettings();

// Attach call listener to the socket once (called from silva.js connection.open)
function initCallHandler(sock, ownerJid) {
    sock.ev.on('call', async (calls) => {
        for (const call of calls) {
            if (call.status !== 'offer') continue;
            const caller = call.from;

            if (settings.blockedUsers.includes(caller) || settings.rejectCalls) {
                try { await sock.rejectCall(call.id, caller); } catch { /* ignore */ }
            }

            if (settings.autoReply) {
                try {
                    await sock.sendMessage(caller, {
                        text: settings.autoReply,
                        contextInfo: {
                            externalAdReply: {
                                title:        'Call Rejected',
                                body:         'Silva MD Anti-Call',
                                thumbnailUrl: 'https://files.catbox.moe/5uli5p.jpeg',
                                mediaType:    1
                            }
                        }
                    });
                } catch { /* ignore */ }
            }

            if (settings.notifyAdmin && ownerJid) {
                try {
                    await sock.sendMessage(ownerJid, {
                        text: `📞 *Anti-Call Alert*\n\nCaller: ${caller}\nType: ${call.isVideo ? 'video' : 'voice'}\nStatus: Rejected`
                    });
                } catch { /* ignore */ }
            }

            if (settings.blockCaller && !settings.blockedUsers.includes(caller)) {
                settings.blockedUsers.push(caller);
                saveSettings(settings);
            }
        }
    });
    console.log('[AntiCall] Call handler registered.');
}

module.exports = {
    commands:    ['anticall'],
    description: 'Manage anti-call protection — owner only',
    permission:  'owner',
    group:       false,
    private:     true,
    initCallHandler,

    run: async (sock, message, args, { sender, contextInfo }) => {
        const action = args[0]?.toLowerCase();

        if (!action) {
            return sock.sendMessage(sender, {
                text:
`🤖 *Anti-Call Status*
• Protection: ${settings.rejectCalls ? 'ENABLED' : 'DISABLED'}
• Block on call: ${settings.blockCaller ? 'ON' : 'OFF'}
• Auto-reply: ${settings.autoReply ? 'ON' : 'OFF'}
• Blocked users: ${settings.blockedUsers.length}

Usage: .anticall [on|off|block <num>|unblock <num>]`,
                contextInfo
            }, { quoted: message });
        }

        switch (action) {
            case 'on':
                settings.rejectCalls = true;
                saveSettings(settings);
                await sock.sendMessage(sender, { text: '✅ Anti-call protection *enabled*.' }, { quoted: message });
                break;
            case 'off':
                settings.rejectCalls = false;
                saveSettings(settings);
                await sock.sendMessage(sender, { text: '✅ Anti-call protection *disabled*.' }, { quoted: message });
                break;
            case 'block': {
                const num = (args[1] || '').replace(/\D/g, '') + '@s.whatsapp.net';
                if (!args[1]) return sock.sendMessage(sender, { text: '❌ Usage: .anticall block <number>' }, { quoted: message });
                if (settings.blockedUsers.includes(num)) return sock.sendMessage(sender, { text: 'ℹ️ Already blocked.' }, { quoted: message });
                settings.blockedUsers.push(num);
                saveSettings(settings);
                await sock.sendMessage(sender, { text: `✅ ${args[1]} blocked from calling.` }, { quoted: message });
                break;
            }
            case 'unblock': {
                const num = (args[1] || '').replace(/\D/g, '') + '@s.whatsapp.net';
                if (!args[1]) return sock.sendMessage(sender, { text: '❌ Usage: .anticall unblock <number>' }, { quoted: message });
                settings.blockedUsers = settings.blockedUsers.filter(u => u !== num);
                saveSettings(settings);
                await sock.sendMessage(sender, { text: `✅ ${args[1]} unblocked.` }, { quoted: message });
                break;
            }
            default:
                await sock.sendMessage(sender, {
                    text: '❌ Unknown option. Usage: .anticall [on|off|block|unblock]',
                    contextInfo
                }, { quoted: message });
        }
    }
};
