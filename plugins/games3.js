'use strict';

const { fmt } = require('../lib/theme');

const diceGames  = new Map();
const wcgGames   = new Map();
const wcgScores  = new Map();

const DICE_SIDES = 6;

const WORD_LIST = ['apple','brave','cloud','dance','eagle','flame','giant','heart','ivory','jungle','knight','lemon','magic','night','ocean','piano','queen','river','stone','tiger','ultra','vivid','water','xenon','yacht','zebra','alpha','berry','coral','delta','ember','frost','grove','honey','inlet','jewel','karma','lunar','maple','nexus','orbit','prism','quake','relay','solar','thorn','ultra','venom','winds','xerus','young','zones'];

function rollDie() { return Math.floor(Math.random() * DICE_SIDES) + 1; }
function rollEmoji(n) { return ['','1️⃣','2️⃣','3️⃣','4️⃣','5️⃣','6️⃣'][n] || n.toString(); }

module.exports = {
    commands: [
        'roll', 'games',
        'diceai', 'diceend', 'dicejoin',
        'tttai', 'tttboard', 'tttend', 'tttjoin',
        'w', 'wcg', 'wcgai', 'wcgbegin', 'wcgend', 'wcgjoin', 'wcgscores'
    ],
    description: 'Extended games — dice, word chain, tic-tac-toe multiplayer',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;
        const from = message.key.participant || message.key.remoteJid;
        const cmd  = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const send = (t) => sock.sendMessage(jid, { text: fmt(t), contextInfo }, { quoted: message });

        if (cmd === 'roll') {
            const sides = parseInt(args[0]) || 6;
            const count = Math.min(parseInt(args[1]) || 1, 5);
            const rolls = Array.from({ length: count }, () => Math.floor(Math.random() * sides) + 1);
            const total = rolls.reduce((a, b) => a + b, 0);
            const dice  = rolls.map(r => {
                if (sides === 6) return rollEmoji(r);
                return `[${r}]`;
            }).join(' ');
            return send(`🎲 *Roll ${count}d${sides}*\n\n${dice}\n\nTotal: *${total}*`);
        }

        if (cmd === 'games') {
            return send(
                `🎮 *Available Games*\n\n` +
                `🎲 *Dice* — \`.dice\` to create, \`.dicejoin\` to join, \`.diceend\` to finish\n` +
                `🤖 *Dice vs AI* — \`.diceai\` for quick single player\n\n` +
                `⭕ *Tic-Tac-Toe* — \`.ttt\` new game | \`.tttjoin\` join | \`.tttboard\` view | \`.tttend\` quit\n\n` +
                `📝 *Word Chain* — \`.wcgbegin\` start | \`.wcgjoin\` join | \`.wcg <word>\` play | \`.wcgend\` finish\n` +
                `🤖 *Word Chain AI* — \`.wcgai\` bot gives you a word challenge\n\n` +
                `🎰 *Other:* \`.roll [sides] [count]\` • \`.8ball\` • \`.hangman\` • \`.trivia\` • \`.tictactoe\``
            );
        }

        if (cmd === 'diceai') {
            const my  = rollDie();
            const ai  = rollDie();
            const res = my > ai ? '🏆 *You Win!*' : my < ai ? '🤖 *AI Wins!*' : '🤝 *It\'s a Tie!*';
            return send(`🎲 *Dice vs AI*\n\n🧑 You: ${rollEmoji(my)} (${my})\n🤖 AI: ${rollEmoji(ai)} (${ai})\n\n${res}`);
        }

        if (cmd === 'dicejoin') {
            let game = diceGames.get(jid);
            if (!game) return send('❌ No active dice game. Use `.dice` to start one.');
            if (game.players.includes(from)) return send('⚠️ You are already in this game!');
            if (game.started) return send('⚠️ Game already started.');
            game.players.push(from);
            return send(`✅ @${from.split('@')[0]} joined the dice game!\n\n👥 Players: ${game.players.length}\n\nUse \`.dice\` to roll when ready!`, { mentions: [from] });
        }

        if (cmd === 'diceend') {
            if (!diceGames.has(jid)) return send('❌ No active dice game in this group.');
            const game  = diceGames.get(jid);
            const rolls = game.players.map(p => ({ p, roll: rollDie() })).sort((a, b) => b.roll - a.roll);
            diceGames.delete(jid);
            const results = rolls.map((r, i) => `*${i + 1}.* @${r.p.split('@')[0]} — ${rollEmoji(r.roll)} (${r.roll})`).join('\n');
            const winner  = rolls[0];
            return send(
                `🎲 *Dice Game Results*\n\n${results}\n\n🏆 *Winner: @${winner.p.split('@')[0]}* with ${winner.roll}!`,
                { mentions: rolls.map(r => r.p) }
            );
        }

        if (cmd === 'tttjoin') {
            return send('⭕ *Tic-Tac-Toe*\n\nUse `.tictactoe` (or `.ttt`) to start a game with `.tttjoin @opponent`');
        }

        if (cmd === 'tttai') {
            const board = Array(9).fill('·');
            const aiMoves = [4, 0, 2, 6, 8, 1, 3, 5, 7];
            const aiPick  = aiMoves[Math.floor(Math.random() * 4)];
            board[aiPick] = '🔵';
            const display = [0,3,6].map(r => board.slice(r, r+3).join(' ')).join('\n');
            return send(`🤖 *Tic-Tac-Toe vs AI*\n\n${display}\n\n_Use \`.tictactoe @user\` for a full multiplayer game_`);
        }

        if (cmd === 'tttboard') {
            const board = global.tttGames?.get(jid)?.board || Array(9).fill('·');
            const display = [0,3,6].map(r => board.slice(r, r+3).join(' ')).join('\n');
            return send(`⭕ *Current Board*\n\n${display}`);
        }

        if (cmd === 'tttend') {
            if (global.tttGames) global.tttGames.delete(jid);
            return send('⭕ Tic-tac-toe game ended.');
        }

        if (cmd === 'wcgbegin' || (cmd === 'wcg' && args[0]?.toLowerCase() === 'begin')) {
            if (wcgGames.has(jid)) return send('⚠️ A word chain game is already running! Use `.wcgend` to stop it.');
            const startWord = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
            wcgGames.set(jid, { players: [from], lastWord: startWord, usedWords: new Set([startWord]), currentPlayer: null });
            wcgScores.set(jid, new Map());
            return send(
                `📝 *Word Chain Game Started!*\n\n` +
                `📖 Starting word: *${startWord.toUpperCase()}*\n` +
                `➡️ Next word must start with: *${startWord.slice(-1).toUpperCase()}*\n\n` +
                `*How to play:* Type \`.wcgjoin\` to join, then \`.wcg <word>\` to play!\n` +
                `_Words must start with the last letter of the previous word_`
            );
        }

        if (cmd === 'wcgjoin') {
            const game = wcgGames.get(jid);
            if (!game) return send('❌ No word chain game active. Use `.wcgbegin` to start!');
            if (game.players.includes(from)) return send('⚠️ You are already in the game!');
            game.players.push(from);
            const scores = wcgScores.get(jid) || new Map();
            scores.set(from, 0);
            return send(`✅ @${from.split('@')[0]} joined the Word Chain game!\n\n👥 Players: ${game.players.length}\n\n📖 Last word: *${game.lastWord.toUpperCase()}*\n➡️ Next starts with: *${game.lastWord.slice(-1).toUpperCase()}*`, { mentions: [from] });
        }

        if (cmd === 'wcg' && args[0]?.toLowerCase() !== 'begin') {
            const game = wcgGames.get(jid);
            if (!game) return send('❌ No word chain game! Use `.wcgbegin` to start.');
            if (!game.players.includes(from)) return send('⚠️ Join the game first with `.wcgjoin`!');

            const word = (args[0] || '').toLowerCase().trim();
            if (!word) return send(`📝 *Word Chain*\n\nLast word: *${game.lastWord.toUpperCase()}*\nNext must start with: *${game.lastWord.slice(-1).toUpperCase()}*`);
            if (!/^[a-z]+$/.test(word)) return send('❌ Only English letters allowed!');
            if (word.length < 2) return send('❌ Word must be at least 2 letters!');
            if (game.usedWords.has(word)) return send(`❌ *${word.toUpperCase()}* was already used! Think of another word starting with *${game.lastWord.slice(-1).toUpperCase()}*`);
            if (word[0] !== game.lastWord.slice(-1)) return send(`❌ Word must start with *${game.lastWord.slice(-1).toUpperCase()}*! You said: *${word.toUpperCase()}*`);

            game.usedWords.add(word);
            game.lastWord = word;
            const scores  = wcgScores.get(jid) || new Map();
            scores.set(from, (scores.get(from) || 0) + 1);
            return send(
                `✅ @${from.split('@')[0]} played: *${word.toUpperCase()}*\n\n` +
                `➡️ Next word must start with: *${word.slice(-1).toUpperCase()}*\n` +
                `📊 Score: ${scores.get(from)} point(s)`,
                { mentions: [from] }
            );
        }

        if (cmd === 'wcgai') {
            const game = wcgGames.get(jid);
            const lastWord = game?.lastWord || WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
            const startChar = lastWord.slice(-1);
            const options  = WORD_LIST.filter(w => w[0] === startChar && !game?.usedWords.has(w));
            if (!options.length) return send(`🤖 *AI is stumped!* No word starting with *${startChar.toUpperCase()}*\n\n🤖 AI passes! Your turn!`);
            const aiWord = options[Math.floor(Math.random() * options.length)];
            if (game) { game.usedWords.add(aiWord); game.lastWord = aiWord; }
            return send(`🤖 *AI plays:* *${aiWord.toUpperCase()}*\n\n➡️ Next word must start with: *${aiWord.slice(-1).toUpperCase()}*`);
        }

        if (cmd === 'wcgscores') {
            const scores = wcgScores.get(jid);
            const game   = wcgGames.get(jid);
            if (!scores || scores.size === 0) return send('📊 No Word Chain scores yet. Start a game with `.wcgbegin`!');
            const sorted = [...scores.entries()].sort((a, b) => b[1] - a[1]);
            const list   = sorted.map(([p, s], i) => `*${i + 1}.* @${p.split('@')[0]} — ${s} point(s)`).join('\n');
            const used   = game?.usedWords?.size || 0;
            return send(`📊 *Word Chain Scores*\n\n${list}\n\n📝 Words played: ${used}`, { mentions: sorted.map(([p]) => p) });
        }

        if (cmd === 'wcgend') {
            const scores = wcgScores.get(jid);
            const game   = wcgGames.get(jid);
            if (!game) return send('❌ No Word Chain game running.');
            const sorted = scores ? [...scores.entries()].sort((a, b) => b[1] - a[1]) : [];
            wcgGames.delete(jid);
            wcgScores.delete(jid);
            if (!sorted.length) return send('📝 Word Chain game ended. No scores recorded.');
            const list   = sorted.map(([p, s], i) => `*${i + 1}.* @${p.split('@')[0]} — ${s} point(s)`).join('\n');
            const winner = sorted[0];
            return send(
                `📝 *Word Chain Game Over!*\n\n📊 *Final Scores:*\n${list}\n\n🏆 *Winner: @${winner[0].split('@')[0]}* with ${winner[1]} points!`,
                { mentions: sorted.map(([p]) => p) }
            );
        }

        if (cmd === 'w') {
            const game = wcgGames.get(jid);
            if (game) return send(`📖 *Current Word:* *${game.lastWord.toUpperCase()}*\n➡️ Next starts with: *${game.lastWord.slice(-1).toUpperCase()}*`);
            return send('📝 No Word Chain game running. Use `.wcgbegin` to start!');
        }
    }
};
