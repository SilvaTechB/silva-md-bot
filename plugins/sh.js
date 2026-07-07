'use strict';

const { exec } = require('child_process');

function shell(cmd) {
    return new Promise((resolve) => {
        exec(cmd, { timeout: 20000, maxBuffer: 1024 * 1024 * 4, cwd: process.cwd() }, (err, stdout, stderr) => {
            resolve({ stdout: (stdout || '').trim(), stderr: (stderr || '').trim(), code: err?.code ?? 0 });
        });
    });
}

module.exports = {
    commands:    ['sh', 'cmd', 'bash', 'terminal', 'shell'],
    description: 'Run a shell/terminal command on the server (owner only)',
    usage:       '.sh <command>  e.g. `.sh ls plugins | wc -l`',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo, isOwner, reply } = ctx;
        if (!isOwner) return reply('⛔ Owner only.');

        const cmd = args.join(' ').trim();
        if (!cmd) return sock.sendMessage(jid, {
            text: '❌ No command given.\n\n*Examples:*\n`.sh ls plugins | wc -l`\n`.sh node --version`\n`.sh cat config.js | head -20`',
            contextInfo
        }, { quoted: message });

        await sock.sendMessage(jid, { text: `⏳ Running: \`${cmd}\``, contextInfo }, { quoted: message });

        const start = Date.now();
        const { stdout, stderr, code } = await shell(cmd);
        const elapsed = Date.now() - start;

        const output   = stdout || stderr || '(no output)';
        const trimmed  = output.length > 3500 ? output.slice(0, 3500) + '\n…[truncated]' : output;
        const icon     = code === 0 ? '✅' : '⚠️';

        return sock.sendMessage(jid, {
            text: `${icon} *Shell Output* _(${elapsed}ms | exit ${code})_\n\`\`\`\n${trimmed}\n\`\`\``,
            contextInfo
        }, { quoted: message });
    }
};
