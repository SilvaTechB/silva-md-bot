'use strict';

const fs = require('fs');
const path = require('path');
const backupDir = path.join(__dirname, '..', 'data', 'backups');

function ensureDir() {
    fs.mkdirSync(backupDir, { recursive: true });
}

module.exports = {
    commands: ['backupgroup', 'restoregroup', 'groupbackup', 'listbackups'],
    description: 'Backup and restore group settings and configurations',
    usage: '.backupgroup [name] | .restoregroup <name> | .listbackups',
    permission: 'admin',
    group: true,
    private: false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, contextInfo, isOwner } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '⛔ Only admins can manage group backups.', contextInfo }, { quoted: message });
        }

        ensureDir();
        const safeJid = jid.replace(/[^a-zA-Z0-9]/g, '_');

        if (rawCmd === 'listbackups') {
            try {
                const files = fs.readdirSync(backupDir)
                    .filter(f => f.startsWith(safeJid) && f.endsWith('.json'))
                    .map(f => {
                        const stat = fs.statSync(path.join(backupDir, f));
                        const name = f.replace(`${safeJid}_`, '').replace('.json', '');
                        return { name, date: stat.mtime, size: stat.size };
                    })
                    .sort((a, b) => b.date - a.date);

                if (!files.length) {
                    return sock.sendMessage(jid, {
                        text: '📦 *No backups found.*\n\nCreate one with `.backupgroup <name>`',
                        contextInfo
                    }, { quoted: message });
                }

                const list = files.map((f, i) => {
                    return `${i + 1}. 📦 *${f.name}*\n   _${f.date.toLocaleDateString()} ${f.date.toLocaleTimeString()}_`;
                }).join('\n\n');

                return sock.sendMessage(jid, {
                    text: `📦 *Group Backups*\n\n${list}\n\n_Restore: \`.restoregroup <name>\`_`,
                    contextInfo
                }, { quoted: message });
            } catch {
                return sock.sendMessage(jid, { text: '📦 No backups found.', contextInfo }, { quoted: message });
            }
        }

        if (['backupgroup', 'groupbackup'].includes(rawCmd)) {
            const backupName = args[0] || `backup_${Date.now()}`;

            try {
                let metadata = {};
                try {
                    metadata = await sock.groupMetadata(jid);
                } catch {}

                const backup = {
                    name: backupName,
                    createdAt: Date.now(),
                    groupJid: jid,
                    groupName: metadata.subject || '',
                    groupDesc: metadata.desc || '',
                    settings: {
                        announce: metadata.announce || false,
                        restrict: metadata.restrict || false,
                    },
                    admins: (metadata.participants || [])
                        .filter(p => p.admin)
                        .map(p => ({ jid: p.id, admin: p.admin })),
                    memberCount: (metadata.participants || []).length,
                    welcomeSettings: global.welcomeSettings?.get(jid) || null,
                    quizSettings: global.welcomeQuizSettings?.[jid] || null,
                };

                const filePath = path.join(backupDir, `${safeJid}_${backupName}.json`);
                fs.writeFileSync(filePath, JSON.stringify(backup, null, 2));

                return sock.sendMessage(jid, {
                    text: `✅ *Group backup created!*\n\n📦 *Name:* ${backupName}\n👥 *Members:* ${backup.memberCount}\n👑 *Admins:* ${backup.admins.length}\n📝 *Description:* ${backup.groupDesc ? 'Yes' : 'None'}\n👋 *Welcome settings:* ${backup.welcomeSettings ? 'Yes' : 'None'}\n🧩 *Quiz settings:* ${backup.quizSettings ? 'Yes' : 'None'}\n\n_Restore later: \`.restoregroup ${backupName}\`_`,
                    contextInfo
                }, { quoted: message });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Backup failed: ${err.message}`, contextInfo }, { quoted: message });
            }
        }

        if (rawCmd === 'restoregroup') {
            if (!args[0]) {
                return sock.sendMessage(jid, {
                    text: '❌ Specify backup name.\n\nUse `.listbackups` to see available backups.\nThen: `.restoregroup <name>`',
                    contextInfo
                }, { quoted: message });
            }

            const backupName = args[0];
            const filePath = path.join(backupDir, `${safeJid}_${backupName}.json`);

            if (!fs.existsSync(filePath)) {
                return sock.sendMessage(jid, {
                    text: `❌ Backup "${backupName}" not found.\n\nUse \`.listbackups\` to see available backups.`,
                    contextInfo
                }, { quoted: message });
            }

            try {
                const backup = JSON.parse(fs.readFileSync(filePath, 'utf8'));
                let restored = [];

                if (backup.groupDesc) {
                    try {
                        await sock.groupUpdateDescription(jid, backup.groupDesc);
                        restored.push('✅ Description');
                    } catch { restored.push('❌ Description (no permission)'); }
                }

                if (backup.settings) {
                    try {
                        if (backup.settings.announce) await sock.groupSettingUpdate(jid, 'announcement');
                        else await sock.groupSettingUpdate(jid, 'not_announcement');
                        restored.push('✅ Announce setting');
                    } catch { restored.push('❌ Announce setting'); }

                    try {
                        if (backup.settings.restrict) await sock.groupSettingUpdate(jid, 'locked');
                        else await sock.groupSettingUpdate(jid, 'unlocked');
                        restored.push('✅ Restrict setting');
                    } catch { restored.push('❌ Restrict setting'); }
                }

                if (backup.welcomeSettings && global.welcomeSettings) {
                    global.welcomeSettings.set(jid, backup.welcomeSettings);
                    restored.push('✅ Welcome settings');
                }

                if (backup.quizSettings && global.welcomeQuizSettings) {
                    global.welcomeQuizSettings[jid] = backup.quizSettings;
                    restored.push('✅ Quiz settings');
                }

                return sock.sendMessage(jid, {
                    text: `📦 *Restore Results*\n\n*Backup:* ${backupName}\n*Created:* ${new Date(backup.createdAt).toLocaleDateString()}\n\n${restored.join('\n')}\n\n_Note: Admin roles cannot be restored automatically._`,
                    contextInfo
                }, { quoted: message });
            } catch (err) {
                return sock.sendMessage(jid, { text: `❌ Restore failed: ${err.message}`, contextInfo }, { quoted: message });
            }
        }
    }
};
