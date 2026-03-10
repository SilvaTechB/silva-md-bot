'use strict';

const vm = require('vm');

module.exports = {
    commands:    ['eval', 'exec', 'run'],
    description: 'Execute JavaScript code (owner only)',
    usage:       '.eval <code>',
    permission:  'owner',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        const code = args.join(' ').trim();
        if (!code) {
            return sock.sendMessage(jid, { text: '❌ Provide code to execute.\n\nExample: `.eval 2 + 2`', contextInfo }, { quoted: message });
        }

        const start = Date.now();
        let result, isError = false;

        try {
            const sandbox = {
                sock, message, ctx,
                require,
                console: { log: (...a) => { result = a.join(' '); } },
                global, process
            };
            const raw = vm.runInNewContext(
                `(async () => { return (${code}) })()`,
                sandbox,
                { timeout: 8000 }
            );
            result = await raw;
        } catch (e) {
            result = e.message;
            isError = true;
        }

        const elapsed = Date.now() - start;
        const label   = isError ? '❌ Error' : '✅ Result';
        const output  = typeof result === 'object' ? JSON.stringify(result, null, 2) : String(result);
        const trimmed = output.length > 3000 ? output.slice(0, 3000) + '\n...[truncated]' : output;

        await sock.sendMessage(jid, {
            text: `*${label}* (${elapsed}ms)\n\`\`\`\n${trimmed}\n\`\`\``,
            contextInfo
        }, { quoted: message });
    }
};
