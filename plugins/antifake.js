'use strict';

const fs   = require('fs');
const path = require('path');
const { getStr } = require('../lib/theme');

const DATA_PATH = path.join(__dirname, '../data/antifake.json');

const VALID_CODES = [
    '1','7','20','27','30','31','32','33','34','36','39','40','41','43','44','45','46','47','48','49',
    '51','52','53','54','55','56','57','58','60','61','62','63','64','65','66','81','82','84','86',
    '90','91','92','93','94','95','98','212','213','216','218','220','221','222','223','224','225',
    '226','227','228','229','230','231','232','233','234','235','236','237','238','239','240','241',
    '242','243','244','245','246','247','248','249','250','251','252','253','254','255','256','257',
    '258','260','261','262','263','264','265','266','267','268','269','290','291','297','298','299',
    '350','351','352','353','354','355','356','357','358','359','370','371','372','373','374','375',
    '376','377','378','380','381','382','385','386','387','389','420','421','423','500','501','502',
    '503','504','505','506','507','508','509','590','591','592','593','594','595','596','597','598',
    '599','670','672','673','674','675','676','677','678','679','680','681','682','683','685','686',
    '687','688','689','690','691','692','850','852','853','855','856','880','886','960','961','962',
    '963','964','965','966','967','968','970','971','972','973','974','975','976','977','992','993',
    '994','995','996','998'
];

function hasValidCode(num) {
    const clean = num.replace(/\D/g, '');
    return VALID_CODES.some(code => clean.startsWith(code));
}

function loadData() {
    try {
        if (fs.existsSync(DATA_PATH)) return JSON.parse(fs.readFileSync(DATA_PATH, 'utf8'));
    } catch { /* ignore */ }
    return {};
}

function saveData(data) {
    try {
        const dir = path.dirname(DATA_PATH);
        if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
        fs.writeFileSync(DATA_PATH, JSON.stringify(data, null, 2));
    } catch { /* ignore */ }
}

let antifakeData = loadData();

function getGroupConfig(jid) {
    return antifakeData[jid] || { enabled: false, action: 'kick' };
}

module.exports = {
    commands:    ['antifake'],
    description: 'Block users with unrecognized/fake phone numbers from joining groups',
    permission:  'admin',
    group:       true,
    private:     false,

    async run(sock, message, args, ctx) {
        const { reply, jid } = ctx;
        const botName = getStr('botName') || 'Silva MD';
        const footer  = getStr('footer')  || '';

        const cfg = getGroupConfig(jid);
        const sub = (args[0] || '').toLowerCase();
        const arg2 = (args[1] || '').toLowerCase();

        if (!sub) {
            return reply(
                `*${botName}* — Anti Fake Numbers\n\n` +
                `Status: ${cfg.enabled ? '✅ ON' : '❌ OFF'}\n` +
                `Action: *${cfg.action}*\n\n` +
                `*Commands:*\n` +
                `• \`.antifake on\` — enable\n` +
                `• \`.antifake off\` — disable\n` +
                `• \`.antifake action kick\` — kick fakes (default)\n` +
                `• \`.antifake action warn\` — warn but keep them\n\n` +
                `_Fake numbers = numbers without a valid international country code._\n\n` +
                footer
            );
        }

        if (sub === 'on') {
            antifakeData[jid] = { ...cfg, enabled: true };
            saveData(antifakeData);
            return reply(`*${botName}*\n\n✅ Anti Fake Numbers *enabled*.\nAction: *${cfg.action}*\n\n${footer}`);
        }

        if (sub === 'off') {
            antifakeData[jid] = { ...cfg, enabled: false };
            saveData(antifakeData);
            return reply(`*${botName}*\n\n❌ Anti Fake Numbers *disabled*.\n\n${footer}`);
        }

        if (sub === 'action' && ['kick', 'warn'].includes(arg2)) {
            antifakeData[jid] = { ...cfg, action: arg2 };
            saveData(antifakeData);
            return reply(`*${botName}*\n\n✅ Action set to *${arg2}*.\n\n${footer}`);
        }

        return reply(`Usage: \`.antifake [on|off|action <kick|warn>]\``);
    },

    onGroupParticipantsUpdate: async (sock, update) => {
        try {
            const { id: jid, participants, action } = update;
            if (action !== 'add') return;

            const cfg = getGroupConfig(jid);
            if (!cfg.enabled) return;

            const botName = getStr('botName') || 'Silva MD';
            const fakeUsers = participants.filter(p => {
                const num = p.split('@')[0].replace(/\D/g, '');
                return num && !hasValidCode(num);
            });

            if (!fakeUsers.length) return;

            if (cfg.action === 'kick') {
                try {
                    await sock.groupParticipantsUpdate(jid, fakeUsers, 'remove');
                    const mentions = fakeUsers;
                    const names = fakeUsers.map(p => `@${p.split('@')[0]}`).join(', ');
                    await sock.sendMessage(jid, {
                        text: `*${botName}*\n\n🚫 Removed ${names} — unrecognized phone number(s).`,
                        mentions
                    });
                } catch { /* ignore */ }
            } else if (cfg.action === 'warn') {
                const mentions = fakeUsers;
                const names = fakeUsers.map(p => `@${p.split('@')[0]}`).join(', ');
                await sock.sendMessage(jid, {
                    text: `*${botName}*\n\n⚠️ Warning: ${names} appear to have unrecognized phone numbers.`,
                    mentions
                });
            }
        } catch { /* ignore */ }
    }
};
