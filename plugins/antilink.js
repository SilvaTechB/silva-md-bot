const config = require('../config');
const { fmt } = require('../lib/theme');
if (!global.antilinkGroups) global.antilinkGroups = new Set();

module.exports = {
    commands: ['antilink'],
    description: 'Toggle antilink protection in a group. Deletes any message containing a URL.',
    permission: 'admin',
    group: true,
    private: false,

    async run(sock, message, args, ctx) {
        const { reply, jid } = ctx;
        const sub = (args[0] || '').toLowerCase();

        const globalOn = config.ANTILINK;
        const groupOn  = global.antilinkGroups.has(jid);

        if (!sub) {
            const status = globalOn ? '✅ ON (global config)' : groupOn ? '✅ ON (this group)' : '❌ OFF';
            return reply(fmt(
                `🔗 *Anti-Link Status*\n\n` +
                `Status: ${status}\n\n` +
                `Usage:\n` +
                `• \`.antilink on\` — enable for this group\n` +
                `• \`.antilink off\` — disable for this group`
            ));
        }

        if (sub === 'on') {
            global.antilinkGroups.add(jid);
            return reply(fmt('✅ *Anti-Link enabled* for this group.\n\nAny message containing a link will be deleted.'));
        }

        if (sub === 'off') {
            global.antilinkGroups.delete(jid);
            if (globalOn) {
                return reply(fmt('⚠️ Anti-link is *still active* globally (set via config).\nContact the bot owner to disable it globally.'));
            }
            return reply(fmt('❌ *Anti-Link disabled* for this group.'));
        }

        return reply(fmt('Usage: `.antilink on` or `.antilink off`'));
    }
};
