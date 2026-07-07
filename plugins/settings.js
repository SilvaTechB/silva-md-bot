'use strict';

const config = require('../config');
const { fmt, getStr } = require('../lib/theme');

function tick(val) {
    return val ? '✅' : '❌';
}

function modeLabel(m) {
    const map = {
        public:  '🌍 Public  (everyone can use)',
        private: '🔒 Private (owner only)',
        group:   '👥 Groups  (group members)',
        inbox:   '📥 Inbox   (private chats only)',
        both:    '🌍 Public  (everyone can use)',
    };
    return map[(m || '').toLowerCase()] || m;
}

module.exports = {
    commands:    ['settings', 'config', 'botsettings'],
    description: 'Show all current bot settings and toggles',
    permission:  'owner',
    group:       true,
    private:     true,

    async run(sock, message, args, ctx) {
        const { reply } = ctx;

        const botName  = getStr('botName') || config.BOT_NAME  || 'Silva MD';
        const ownerNum = (config.OWNER_NUMBER || process.env.OWNER_NUMBER || '').replace(/\D/g, '');
        const prefix   = config.PREFIX || '.';
        const theme    = config.THEME  || 'silva';
        const mode     = config.MODE   || 'both';

        let greetText    = false;
        let greetEnabled = false;
        try {
            const gp = require('path').join(__dirname, '../data/greet.json');
            if (require('fs').existsSync(gp)) {
                const gd = JSON.parse(require('fs').readFileSync(gp, 'utf8'));
                greetText    = !!(gd['__text__'] || (config.GREETING || '').trim());
                greetEnabled = gd['__enabled__'] !== false && greetText;
            } else {
                greetText    = !!(config.GREETING || '').trim();
                greetEnabled = greetText;
            }
        } catch { /* ignore */ }
        const greetSet = greetText;

        const lines = [
            `⚙️ *Bot Settings*`,
            ``,
            `┌─────────────────────────`,
            `│ 🤖 *Bot Name:*     ${botName}`,
            `│ 👑 *Owner:*        +${ownerNum || 'not set'}`,
            `│ 🎨 *Theme:*        ${theme}`,
            `│ ⌨️  *Prefix:*       ${prefix}`,
            `│ 🌐 *Mode:*         ${modeLabel(mode)}`,
            `└─────────────────────────`,
            ``,
            `📡 *Status / Story*`,
            `  ${tick(config.AUTO_STATUS_SEEN)}  Auto View Status`,
            `  ${tick(config.AUTO_STATUS_REACT)}  Auto React to Status`,
            `  ${tick(config.AUTO_STATUS_REPLY)}  Auto Reply to Status`,
            ``,
            `🛡️ *Protection*`,
            `  ${tick(config.ANTIDELETE_GROUP)}    Restore Deleted (Groups)`,
            `  ${tick(config.ANTIDELETE_PRIVATE)}  Restore Deleted (Private)`,
            `  ${tick(config.ANTILINK)}    Anti-Link (Global)`,
            `  ${tick(config.ANTIVV)}     Anti-ViewOnce`,
            `  ${tick(config.ANTI_BAD)}   Anti-Bad Words`,
            ``,
            `💬 *Presence & Behaviour*`,
            `  ${tick(config.AUTO_TYPING)}    Auto Typing indicator`,
            `  ${tick(config.AUTO_RECORDING)}  Auto Recording indicator`,
            `  ${tick(config.READ_MESSAGE)}   Auto Read (blue tick)`,
            `  ${tick(config.ALWAYS_ONLINE)}  Always Online`,
            `  ${tick(config.AUTO_REACT_NEWSLETTER)}  Auto React Newsletter`,
            ``,
            `👋 *Greeting*`,
            `  ${tick(greetEnabled)}  Auto-Greeting *${greetEnabled ? 'ON' : (greetSet ? 'OFF (paused)' : 'OFF')}* — once per day`,
            `  ${greetSet ? `Use \`${prefix}getgreet\` to view • \`${prefix}greeton\`/\`${prefix}greetoff\` to toggle` : `Set with \`${prefix}setgreet <msg>\` or GREETING= in config`}`,
            ``,
            `📌 *Change settings*`,
            `  Edit your \`config.env\` / Replit Secrets,`,
            `  then restart the bot for changes to take effect.`,
        ];

        return reply(fmt(lines.join('\n')));
    }
};
