'use strict';

const { runAgent, clearHistory, getHistory } = require('../lib/agent-v2');

module.exports = {
    commands: ['autopilot', 'agent2', 'copilot'],
    description: 'Agent v2 with memory, safe tools, web lookup, weather, and multi-step actions',
    usage: '.autopilot <request> | .autopilot forget | .autopilot status',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { jid, reply } = ctx;
        const query = args.join(' ').trim();
        if (!query) return reply([
            '🧠 *Silva Agent v2*',
            '',
            'I can plan a request, use approved tools, remember useful context, and complete multi-step tasks.',
            '',
            'Examples:',
            '• `.autopilot calculate 25 * 4`',
            '• `.autopilot what is the weather in Nairobi?`',
            '• `.autopilot find the command for downloading videos`',
            '• `.autopilot download this public link as mp3: <url>`',
            '• `.autopilot remember that I prefer short answers`',
            '',
            'Controls: `.autopilot forget` and `.autopilot status`',
            'Requires an OpenAI-compatible provider configured in `config.env`.'
        ].join('\n'));

        if (/^(forget|clear|reset)\b/i.test(query)) {
            clearHistory(jid);
            return reply('✅ Agent v2 memory cleared for this chat.');
        }

        if (/^status$/i.test(query)) {
            const count = getHistory(jid).length;
            return reply(`🧠 *Agent v2 Status*\n\nPersistent memory items: ${count}\nTool loop: enabled\nSafe tools: calculator, command search, bot status, memory, web search, weather, media download`);
        }

        await reply('🧠 Planning your request...');
        try {
            const result = await runAgent(query, { ...ctx, sock, message });
            if (result.setup) return reply(`⚙️ ${result.text}`);
            return reply(`🤖 *Silva Agent v2*\n\n${result.text}`);
        } catch (error) {
            console.error(`[AgentV2] ${error.message}`);
            return reply('❌ Agent v2 could not complete that request. Check the provider settings or try again.');
        }
    }
};
