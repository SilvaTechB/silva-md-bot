'use strict';

const fs = require('fs');
const path = require('path');
const dataFile = path.join(__dirname, '..', 'data', 'dailychallenge.json');

function loadSettings() {
    try { return JSON.parse(fs.readFileSync(dataFile, 'utf8')); } catch { return {}; }
}
function saveSettings(data) {
    fs.mkdirSync(path.dirname(dataFile), { recursive: true });
    fs.writeFileSync(dataFile, JSON.stringify(data, null, 2));
}

const challengeSettings = loadSettings();

const triviaQuestions = [
    { q: "What is the largest planet in our solar system?", a: "Jupiter" },
    { q: "How many continents are there on Earth?", a: "7" },
    { q: "What element does 'O' represent on the periodic table?", a: "Oxygen" },
    { q: "In what year did World War II end?", a: "1945" },
    { q: "What is the capital of Japan?", a: "Tokyo" },
    { q: "What is the smallest country in the world?", a: "Vatican City" },
    { q: "How many bones are in the human body?", a: "206" },
    { q: "What is the speed of light in km/s (approximately)?", a: "300000" },
    { q: "Who painted the Mona Lisa?", a: "Leonardo da Vinci" },
    { q: "What is the chemical formula for water?", a: "H2O" },
    { q: "What planet is known as the Red Planet?", a: "Mars" },
    { q: "What is the tallest mountain in the world?", a: "Mount Everest" },
    { q: "How many sides does a hexagon have?", a: "6" },
    { q: "What is the largest ocean on Earth?", a: "Pacific" },
    { q: "Who wrote Romeo and Juliet?", a: "Shakespeare" },
    { q: "What gas do plants absorb from the atmosphere?", a: "Carbon dioxide" },
    { q: "What is the hardest natural substance on Earth?", a: "Diamond" },
    { q: "How many players are on a soccer team?", a: "11" },
    { q: "What is the largest mammal?", a: "Blue whale" },
    { q: "What year did the Titanic sink?", a: "1912" },
];

const puzzles = [
    { q: "I have cities, but no houses. I have mountains, but no trees. I have water, but no fish. What am I?", a: "A map" },
    { q: "What has keys but no locks?", a: "A piano" },
    { q: "What has a head and a tail but no body?", a: "A coin" },
    { q: "The more you take, the more you leave behind. What are they?", a: "Footsteps" },
    { q: "What can travel around the world while staying in a corner?", a: "A stamp" },
    { q: "What has many teeth but cannot bite?", a: "A comb" },
    { q: "What gets wetter the more it dries?", a: "A towel" },
    { q: "I speak without a mouth and hear without ears. What am I?", a: "An echo" },
    { q: "What can you break without touching it?", a: "A promise" },
    { q: "What has one eye but cannot see?", a: "A needle" },
];

const wordGames = [
    { q: "Unscramble: PLEAP", a: "APPLE" },
    { q: "Unscramble: TAWRE", a: "WATER" },
    { q: "Unscramble: ODOFL", a: "FLOOD" },
    { q: "Unscramble: NAITR", a: "TRAIN" },
    { q: "Unscramble: GHTLI", a: "LIGHT" },
    { q: "Unscramble: HPONE", a: "PHONE" },
    { q: "Unscramble: LOSCH", a: "SCHOOL" },
    { q: "Unscramble: DRLWO", a: "WORLD" },
    { q: "Unscramble: SMUIC", a: "MUSIC" },
    { q: "Unscramble: DRAEN", a: "ANGER" },
];

function getRandomChallenge() {
    const allChallenges = [
        ...triviaQuestions.map(c => ({ ...c, type: '🧠 Trivia' })),
        ...puzzles.map(c => ({ ...c, type: '🧩 Puzzle' })),
        ...wordGames.map(c => ({ ...c, type: '🔤 Word Game' })),
    ];
    return allChallenges[Math.floor(Math.random() * allChallenges.length)];
}

const activeTimers = new Map();

module.exports = {
    commands: ['dailychallenge', 'challenge', 'setchallenge', 'challengeoff', 'challengenow'],
    description: 'Auto-post daily trivia, puzzles, or word games in groups',
    usage: '.setchallenge 09:00 | .challenge | .challengenow',
    permission: 'admin',
    group: true,
    private: false,

    run: async (sock, message, args, ctx) => {
        const { jid, isAdmin, contextInfo } = ctx;

        const rawCmd = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();

        if (rawCmd === 'challengenow' || rawCmd === 'challenge') {
            const challenge = getRandomChallenge();
            return sock.sendMessage(jid, {
                text: `${challenge.type} *Daily Challenge!*\n\n❓ ${challenge.q}\n\n💡 Reply with your answer!\n\n_Answer: ||${challenge.a}||_\n_React with ✅ if you got it right!_`,
                contextInfo
            }, { quoted: message });
        }

        if (!isAdmin) {
            return sock.sendMessage(jid, { text: '⛔ Only admins can configure daily challenges.', contextInfo }, { quoted: message });
        }

        if (rawCmd === 'challengeoff') {
            if (activeTimers.has(jid)) {
                clearInterval(activeTimers.get(jid));
                activeTimers.delete(jid);
            }
            if (challengeSettings[jid]) {
                challengeSettings[jid].enabled = false;
                saveSettings(challengeSettings);
            }
            return sock.sendMessage(jid, { text: '✅ *Daily challenges disabled.*', contextInfo }, { quoted: message });
        }

        if (rawCmd === 'setchallenge') {
            const time = args[0] || '09:00';
            if (!/^\d{1,2}:\d{2}$/.test(time)) {
                return sock.sendMessage(jid, {
                    text: '❌ Invalid time. Use HH:MM format.\n\nExample: `.setchallenge 09:00`',
                    contextInfo
                }, { quoted: message });
            }

            challengeSettings[jid] = { enabled: true, time, timezone: 'Africa/Nairobi' };
            saveSettings(challengeSettings);

            if (activeTimers.has(jid)) clearInterval(activeTimers.get(jid));
            const timer = setInterval(async () => {
                try {
                    const now = new Date();
                    const formatter = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: 'numeric', hour12: false, timeZone: 'Africa/Nairobi' });
                    const parts = formatter.formatToParts(now);
                    const currentTime = `${parts.find(p => p.type === 'hour').value}:${parts.find(p => p.type === 'minute').value.padStart(2, '0')}`;
                    if (currentTime === time) {
                        const challenge = getRandomChallenge();
                        await sock.sendMessage(jid, {
                            text: `${challenge.type} *Daily Challenge!*\n\n❓ ${challenge.q}\n\n💡 Reply with your answer!\n\n_Answer will be revealed in the next challenge!_`
                        });
                    }
                } catch {}
            }, 60000);
            activeTimers.set(jid, timer);

            return sock.sendMessage(jid, {
                text: `✅ *Daily challenge scheduled!*\n\n🕐 *Time:* ${time} (Africa/Nairobi)\n\nA random trivia, puzzle, or word game will be posted daily.\n\nUse \`.challengenow\` for an instant challenge!\nUse \`.challengeoff\` to disable.`,
                contextInfo
            }, { quoted: message });
        }

        if (rawCmd === 'dailychallenge') {
            const settings = challengeSettings[jid];
            const status = settings?.enabled ? `✅ ON at ${settings.time}` : '❌ OFF';
            return sock.sendMessage(jid, {
                text: `🎯 *Daily Challenges*\n\n*Status:* ${status}\n\n*Commands:*\n• \`.setchallenge 09:00\` — schedule daily\n• \`.challengenow\` — instant challenge\n• \`.challengeoff\` — disable\n\n*Types:* Trivia, Puzzles, Word Games`,
                contextInfo
            }, { quoted: message });
        }
    }
};
