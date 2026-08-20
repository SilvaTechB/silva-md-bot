'use strict';

const { fmt } = require('../lib/theme');

const MATRIX_CHARS = '日ﾊﾐﾋｰｳｼﾅﾓﾆｻﾜﾂｵﾘｱﾎﾃﾏｹﾒｴｶｷﾑﾕﾗｾﾈｽﾀﾇﾍ012345789ABCDEFGHIJKLMNOPQRSTUVWXYZ';

function randomChar() {
    return MATRIX_CHARS[Math.floor(Math.random() * MATRIX_CHARS.length)];
}

function buildMatrix(text, cols = 30, rows = 18) {
    const upper = text.toUpperCase();
    const lines = [];

    const top = [];
    for (let i = 0; i < cols; i++) {
        top.push(Math.random() > 0.6 ? randomChar() : ' ');
    }
    lines.push(top.join(''));

    for (let r = 0; r < rows; r++) {
        const line = [];
        for (let c = 0; c < cols; c++) {
            const chance = Math.random();
            if (chance < 0.05) line.push(' ');
            else if (chance < 0.3) line.push(randomChar());
            else if (chance < 0.5) line.push(Math.floor(Math.random() * 10).toString());
            else line.push(randomChar());
        }
        lines.push(line.join(''));
    }

    const centered = upper.slice(0, cols - 4).padStart(Math.floor((cols + upper.length) / 2)).padEnd(cols);

    const insertRow = Math.floor(rows / 2);
    lines[insertRow] = `> ${centered} <`;
    if (lines[insertRow - 1]) {
        lines[insertRow - 1] = lines[insertRow - 1].split('').map((c, i) =>
            i < 3 || i > cols - 4 ? c : '|'
        ).join('');
    }
    if (lines[insertRow + 1]) {
        lines[insertRow + 1] = lines[insertRow + 1].split('').map((c, i) =>
            i < 3 || i > cols - 4 ? c : '|'
        ).join('');
    }

    const bottom = [];
    for (let i = 0; i < cols; i++) {
        bottom.push(Math.random() > 0.5 ? randomChar() : ' ');
    }
    lines.push(bottom.join(''));

    return lines;
}

module.exports = {
    commands:    ['matrix'],
    description: 'Generate a Matrix-style code rain with your text',
    usage:       '.matrix <text>',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const text = args.join(' ').trim() || 'SILVA MD';

        const lines = buildMatrix(text);

        const block = '```' + lines.join('\n') + '```';

        const header = fmt(`🟩 *MATRIX MODE — ${text.toUpperCase()}*`);

        await sock.sendMessage(jid, {
            text: `${header}\n\n${block}`,
            contextInfo
        }, { quoted: message });
    }
};
