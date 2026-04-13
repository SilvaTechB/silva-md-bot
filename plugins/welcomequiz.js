'use strict';

const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'welcomequiz.json');

function loadQuizSettings() {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return {}; }
}
function saveQuizSettings(data) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

const quizSettings = loadQuizSettings();
global.welcomeQuizSettings = quizSettings;

const pendingQuiz = new Map();
global.pendingWelcomeQuiz = pendingQuiz;

global.handleWelcomeQuiz = function (jid, member) {
    const settings = quizSettings[jid];
    if (!settings || !settings.enabled) return null;

    const quizKey = `${jid}:${member}`;
    pendingQuiz.set(quizKey, {
        answer: settings.answer.toLowerCase().trim(),
        joinedAt: Date.now(),
        timeout: settings.timeout || 300
    });

    setTimeout(() => {
        const pending = pendingQuiz.get(quizKey);
        if (pending) {
            pendingQuiz.delete(quizKey);
        }
    }, (settings.timeout || 300) * 1000);

    return {
        question: settings.question,
        timeout: settings.timeout || 300
    };
};

global.checkWelcomeQuizAnswer = function (jid, sender, text) {
    const quizKey = `${jid}:${sender}`;
    const pending = pendingQuiz.get(quizKey);
    if (!pending) return null;

    const answer = text.toLowerCase().trim();
    if (answer === pending.answer || answer.includes(pending.answer)) {
        pendingQuiz.delete(quizKey);
        return { passed: true };
    }
    return { passed: false, correctAnswer: pending.answer };
};

module.exports = {
    commands: ['welcomequiz', 'setquiz', 'quizoff', 'quizsettings'],
    description: 'Welcome quiz — new members must answer a question to stay',
    usage: '.setquiz <question> | <answer> | .welcomequiz on/off',
    permission: 'admin',
    group: true,
    private: false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, contextInfo } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '⛔ Only admins can manage the welcome quiz.', contextInfo }, { quoted: message });
        }

        if (rawCmd === 'quizoff') {
            if (quizSettings[jid]) {
                quizSettings[jid].enabled = false;
                saveQuizSettings(quizSettings);
            }
            return sock.sendMessage(jid, { text: '✅ *Welcome quiz disabled.*', contextInfo }, { quoted: message });
        }

        if (rawCmd === 'quizsettings') {
            const settings = quizSettings[jid];
            if (!settings) {
                return sock.sendMessage(jid, {
                    text: '❌ No quiz configured.\n\nSet one with:\n`.setquiz What is 2+2? | 4`',
                    contextInfo
                }, { quoted: message });
            }
            const status = settings.enabled ? '✅ ON' : '❌ OFF';
            return sock.sendMessage(jid, {
                text: `🧩 *Welcome Quiz Settings*\n\n*Status:* ${status}\n*Question:* ${settings.question}\n*Answer:* ${settings.answer}\n*Timeout:* ${settings.timeout || 300}s\n\n*Commands:*\n• \`.setquiz Question | Answer\`\n• \`.welcomequiz on/off\`\n• \`.quizoff\``,
                contextInfo
            }, { quoted: message });
        }

        if (rawCmd === 'setquiz') {
            const fullText = args.join(' ');
            const parts = fullText.split('|').map(p => p.trim());

            if (parts.length < 2 || !parts[0] || !parts[1]) {
                return sock.sendMessage(jid, {
                    text: '❌ *Format:* `.setquiz <question> | <answer>`\n\n*Example:*\n`.setquiz What is the capital of Kenya? | Nairobi`\n`.setquiz Say "hello" to prove you are human | hello`\n\nOptionally add timeout: `.setquiz Question | Answer | 120`',
                    contextInfo
                }, { quoted: message });
            }

            const question = parts[0];
            const answer = parts[1];
            const timeout = parseInt(parts[2]) || 300;

            quizSettings[jid] = { enabled: true, question, answer, timeout: Math.min(Math.max(timeout, 30), 600) };
            saveQuizSettings(quizSettings);

            return sock.sendMessage(jid, {
                text: `✅ *Welcome quiz set and enabled!*\n\n❓ *Question:* ${question}\n✅ *Answer:* ${answer}\n⏱️ *Timeout:* ${timeout}s\n\nNew members will be asked this question when they join.`,
                contextInfo
            }, { quoted: message });
        }

        if (rawCmd === 'welcomequiz') {
            const sub = (args[0] || '').toLowerCase();
            if (sub === 'on') {
                if (!quizSettings[jid] || !quizSettings[jid].question) {
                    return sock.sendMessage(jid, {
                        text: '❌ Set a quiz first with:\n`.setquiz What is 2+2? | 4`',
                        contextInfo
                    }, { quoted: message });
                }
                quizSettings[jid].enabled = true;
                saveQuizSettings(quizSettings);
                return sock.sendMessage(jid, { text: '✅ *Welcome quiz enabled!*', contextInfo }, { quoted: message });
            }
            if (sub === 'off') {
                if (quizSettings[jid]) quizSettings[jid].enabled = false;
                saveQuizSettings(quizSettings);
                return sock.sendMessage(jid, { text: '✅ *Welcome quiz disabled.*', contextInfo }, { quoted: message });
            }

            const settings = quizSettings[jid];
            const status = settings?.enabled ? '✅ ON' : '❌ OFF';
            return sock.sendMessage(jid, {
                text: `🧩 *Welcome Quiz*\n\n*Status:* ${status}\n\n*Commands:*\n• \`.setquiz Question | Answer\` — set quiz\n• \`.welcomequiz on/off\` — toggle\n• \`.quizsettings\` — view settings\n• \`.quizoff\` — disable`,
                contextInfo
            }, { quoted: message });
        }
    }
};
