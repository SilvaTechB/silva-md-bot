'use strict';
const fs   = require('fs');
const path = require('path');

const rulesFile = path.join(__dirname, '..', 'data', 'grouprules.json');
function loadRules() {
    try { return JSON.parse(fs.readFileSync(rulesFile, 'utf8')); } catch { return {}; }
}
function saveRules(data) {
    fs.mkdirSync(path.dirname(rulesFile), { recursive: true });
    fs.writeFileSync(rulesFile, JSON.stringify(data, null, 2));
}

module.exports = {
    commands:    ['rules', 'setrules', 'delrules'],
    description: 'Set/show/delete group rules',
    permission:  'admin',
    group:       true,
    private:     false,
    run: async (sock, message, args, { sender, groupId, prefix, isAdmin, contextInfo }) => {
        const cmd   = message.body?.split(' ')[0]?.replace(prefix, '').toLowerCase();
        const rules = loadRules();

        if (cmd === 'rules') {
            const text = rules[groupId];
            if (!text) {
                return sock.sendMessage(groupId, { text: '📋 No rules set for this group yet.\nAdmin can use .setrules to add rules.', contextInfo }, { quoted: message });
            }
            return sock.sendMessage(groupId, {
                text: `📋 *Group Rules*\n\n${text}\n\n_Please follow the rules to avoid being removed._`,
                contextInfo
            }, { quoted: message });
        }

        if (!isAdmin) {
            return sock.sendMessage(sender, { text: '❌ Only admins can set rules.', contextInfo }, { quoted: message });
        }

        if (cmd === 'setrules') {
            const text = args.join(' ');
            if (!text) return sock.sendMessage(sender, { text: '📋 Usage: .setrules <rules text>', contextInfo }, { quoted: message });
            rules[groupId] = text;
            saveRules(rules);
            return sock.sendMessage(groupId, { text: `✅ Group rules updated!\n\n📋 ${text}`, contextInfo }, { quoted: message });
        }

        if (cmd === 'delrules') {
            delete rules[groupId];
            saveRules(rules);
            return sock.sendMessage(groupId, { text: '🗑️ Group rules deleted.', contextInfo }, { quoted: message });
        }
    }
};
