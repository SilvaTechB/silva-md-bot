'use strict';

const games = new Map();

function makeBoard() { return Array(9).fill(' '); }
function display(b) {
    return `${b[0]}|${b[1]}|${b[2]}\n─┼─┼─\n${b[3]}|${b[4]}|${b[5]}\n─┼─┼─\n${b[6]}|${b[7]}|${b[8]}`;
}
function checkWin(b, p) {
    const wins = [[0,1,2],[3,4,5],[6,7,8],[0,3,6],[1,4,7],[2,5,8],[0,4,8],[2,4,6]];
    return wins.some(([a,c,d]) => b[a] === p && b[c] === p && b[d] === p);
}
function aiMove(b) {
    const empty = b.map((v,i) => v === ' ' ? i : -1).filter(i => i >= 0);
    for (const p of ['O','X']) {
        for (const i of empty) { const t = [...b]; t[i] = p; if (checkWin(t, p)) return i; }
    }
    if (b[4] === ' ') return 4;
    const corners = [0,2,6,8].filter(i => b[i] === ' ');
    if (corners.length) return corners[Math.floor(Math.random() * corners.length)];
    return empty[Math.floor(Math.random() * empty.length)];
}

module.exports = {
    commands:    ['ttt', 'tictactoe'],
    description: 'Play Tic-Tac-Toe against the bot',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, groupId, contextInfo }) => {
        const chatId  = groupId || sender;
        const gameKey = `${chatId}:${sender}`;
        const arg     = args[0];

        if (!arg || arg === 'start') {
            games.set(gameKey, { board: makeBoard(), turn: 'X' });
            const b = makeBoard();
            return sock.sendMessage(chatId, {
                text: `❌⭕ *Tic-Tac-Toe*\n\nYou are ✖️  Bot is ⭕\n\n${display(b)}\n\n💡 Position grid:\n1|2|3\n─┼─┼─\n4|5|6\n─┼─┼─\n7|8|9\n\nMake your move: .ttt <1-9>`,
                contextInfo
            }, { quoted: message });
        }

        if (arg === 'stop') {
            games.delete(gameKey);
            return sock.sendMessage(chatId, { text: '🛑 Game stopped.', contextInfo }, { quoted: message });
        }

        const pos = parseInt(arg) - 1;
        if (isNaN(pos) || pos < 0 || pos > 8) {
            return sock.sendMessage(chatId, { text: '❌ Enter a position 1-9.', contextInfo }, { quoted: message });
        }

        const g = games.get(gameKey);
        if (!g) return sock.sendMessage(chatId, { text: '❓ No active game. Type .ttt start', contextInfo }, { quoted: message });
        if (g.board[pos] !== ' ') return sock.sendMessage(chatId, { text: '❌ That position is taken!', contextInfo }, { quoted: message });

        g.board[pos] = 'X';
        if (checkWin(g.board, 'X')) { games.delete(gameKey); return sock.sendMessage(chatId, { text: `🎉 *You won!* 🏆\n\n${display(g.board)}`, contextInfo }, { quoted: message }); }
        if (!g.board.includes(' ')) { games.delete(gameKey); return sock.sendMessage(chatId, { text: `🤝 *Draw!*\n\n${display(g.board)}`, contextInfo }, { quoted: message }); }

        const ai = aiMove(g.board);
        g.board[ai] = 'O';
        if (checkWin(g.board, 'O')) { games.delete(gameKey); return sock.sendMessage(chatId, { text: `🤖 *Bot wins!* 😈\n\n${display(g.board)}`, contextInfo }, { quoted: message }); }
        if (!g.board.includes(' ')) { games.delete(gameKey); return sock.sendMessage(chatId, { text: `🤝 *Draw!*\n\n${display(g.board)}`, contextInfo }, { quoted: message }); }

        await sock.sendMessage(chatId, { text: `${display(g.board)}\n\nYour turn ✖️ — .ttt <1-9>`, contextInfo }, { quoted: message });
    }
};
