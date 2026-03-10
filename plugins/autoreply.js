'use strict';

const fs   = require('fs');
const path = require('path');
const AUTO_REPLY_PATH = path.join(__dirname, '../auto-reply-settings.json');

const DEFAULT_SETTINGS = {
    enabled:       true,
    ignoredGroups: [],
    responses: {
        greetings: {
            patterns: ['hi', 'hello', 'hey', 'hola', 'salam'],
            replies:  ['Hello! How can I help you today?', 'Hi there! What can I do for you?', 'Hey! Silva MD at your service.']
        },
        thanks: {
            patterns: ['thank', 'thanks', 'thx', 'appreciate'],
            replies:  ["You're welcome!", 'Happy to help!', 'Anytime!']
        },
        botInfo: {
            patterns: ['who are you', 'what are you', 'your name'],
            replies:  ["I'm Silva MD Bot, an advanced WhatsApp assistant by Silva Tech Inc."]
        },
        creator: {
            patterns: ['who made you', 'who created you', 'your creator'],
            replies:  ["I was created by Silva Tech Inc. 🌟"]
        }
    }
};

function loadSettings() {
    try {
        if (fs.existsSync(AUTO_REPLY_PATH)) return JSON.parse(fs.readFileSync(AUTO_REPLY_PATH, 'utf8'));
    } catch { /* ignore */ }
    return { ...DEFAULT_SETTINGS };
}

function saveSettings(s) {
    try { fs.writeFileSync(AUTO_REPLY_PATH, JSON.stringify(s, null, 2)); } catch { /* ignore */ }
}

const settings = loadSettings();

function findMatchingResponse(text) {
    const lower = text.toLowerCase();
    for (const category of Object.values(settings.responses)) {
        for (const pattern of category.patterns) {
            if (lower.includes(pattern)) {
                const reply = category.replies[Math.floor(Math.random() * category.replies.length)];
                return typeof reply === 'function' ? reply() : reply;
            }
        }
    }
    return null;
}

module.exports = {
    commands:    ['autoreply', 'ar'],
    description: 'Manage auto-reply settings — admin only',
    permission:  'admin',
    group:       true,
    private:     true,

    run: async (sock, message, args, { sender, jid, isGroup, contextInfo }) => {
        const action = args[0]?.toLowerCase();

        if (!action) {
            const total = Object.values(settings.responses).reduce((n, c) => n + c.patterns.length, 0);
            return sock.sendMessage(sender, {
                text:
`🤖 *Auto-Reply Status*
• System: ${settings.enabled ? '✅ ENABLED' : '❌ DISABLED'}
• Ignored groups: ${settings.ignoredGroups.length}
• Total patterns: ${total}

*Usage:*
• \`.autoreply on\` — enable
• \`.autoreply off\` — disable`,
                contextInfo
            }, { quoted: message });
        }

        switch (action) {
            case 'on':
                settings.enabled = true; saveSettings(settings);
                await sock.sendMessage(sender, { text: '✅ Auto-reply *enabled*.' }, { quoted: message });
                break;
            case 'off':
                settings.enabled = false; saveSettings(settings);
                await sock.sendMessage(sender, { text: '✅ Auto-reply *disabled*.' }, { quoted: message });
                break;
            case 'ignore':
                if (!isGroup) return sock.sendMessage(sender, { text: '❌ Use this in a group.' }, { quoted: message });
                if (settings.ignoredGroups.includes(jid)) {
                    settings.ignoredGroups = settings.ignoredGroups.filter(g => g !== jid);
                    await sock.sendMessage(sender, { text: '✅ Auto-reply *enabled* for this group.' }, { quoted: message });
                } else {
                    settings.ignoredGroups.push(jid);
                    await sock.sendMessage(sender, { text: '✅ Auto-reply *disabled* for this group.' }, { quoted: message });
                }
                saveSettings(settings);
                break;
            case 'add': {
                if (args.length < 3) return sock.sendMessage(sender, { text: '❌ Usage: .autoreply add <pattern> <reply>' }, { quoted: message });
                const pattern = args[1].toLowerCase();
                const reply   = args.slice(2).join(' ');
                if (!settings.responses.custom) settings.responses.custom = { patterns: [], replies: [] };
                settings.responses.custom.patterns.push(pattern);
                settings.responses.custom.replies.push(reply);
                saveSettings(settings);
                await sock.sendMessage(sender, { text: `✅ Added: "${pattern}" → "${reply}"` }, { quoted: message });
                break;
            }
            case 'list': {
                let txt = '🤖 *Auto-Reply Patterns*\n\n';
                for (const [cat, data] of Object.entries(settings.responses)) {
                    txt += `*${cat.toUpperCase()}*\n`;
                    data.patterns.forEach((p, i) => { txt += `• ${p} → ${data.replies[i]}\n`; });
                    txt += '\n';
                }
                await sock.sendMessage(sender, { text: txt, contextInfo }, { quoted: message });
                break;
            }
            default:
                await sock.sendMessage(sender, { text: '❌ Unknown option. Usage: .autoreply [on|off|ignore|add|list]', contextInfo }, { quoted: message });
        }
    },

    onMessage: async (sock, message, text, { jid, sender, contextInfo }) => {
        if (!settings.enabled) return;
        if (message.key.fromMe) return;
        if (jid.endsWith('@g.us') && settings.ignoredGroups.includes(jid)) return;

        const response = findMatchingResponse(text);
        if (!response) return;

        setTimeout(async () => {
            try {
                await sock.sendMessage(jid, {
                    text: response,
                    contextInfo: {
                        ...contextInfo,
                        externalAdReply: {
                            title:        'Silva MD Auto-Reply',
                            body:         'Intelligent response system',
                            thumbnailUrl: 'https://files.catbox.moe/5uli5p.jpeg',
                            mediaType:    1
                        }
                    }
                }, { quoted: message });
            } catch { /* ignore */ }
        }, 1000);
    }
};
