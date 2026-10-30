'use strict';

const os = require('os');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PLUGIN_DIR = __dirname;

function formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return [days ? `${days}d` : '', hours ? `${hours}h` : '', minutes ? `${minutes}m` : '', `${secs}s`]
        .filter(Boolean).join(' ');
}

function commandInventory() {
    const commands = [];
    for (const file of fs.readdirSync(PLUGIN_DIR).filter(f => f.endsWith('.js'))) {
        try {
            const loaded = require(path.join(PLUGIN_DIR, file));
            const plugins = Array.isArray(loaded) ? loaded : [loaded];
            for (const plugin of plugins) {
                if (!Array.isArray(plugin?.commands)) continue;
                for (const command of plugin.commands) {
                    commands.push({
                        command,
                        description: plugin.description || 'No description available',
                        permission: plugin.permission || 'public',
                        file
                    });
                }
            }
        } catch {
            // Ignore a plugin that cannot be loaded; the main handler reports it.
        }
    }
    return commands;
}

function safeExpression(expression) {
    const input = expression.trim();
    if (!input || input.length > 120) return null;
    if (!/^[0-9+\-*/%().,\s^]+$/.test(input)) return null;
    const normalized = input.replace(/,/g, '').replace(/\^/g, '**');
    if (!/^[0-9+\-*/%().\s*]+$/.test(normalized)) return null;
    try {
        const result = Function(`"use strict"; return (${normalized})`)();
        return Number.isFinite(result) ? result : null;
    } catch {
        return null;
    }
}

module.exports = {
    commands: ['find', 'searchcmd', 'health', 'uptime2', 'sysinfo', 'uuid', 'timestamp', 'calcx', 'jsonformat', 'textstats', 'choose'],
    description: 'Advanced dependency-free utilities and command discovery tools',
    usage: '.find <keyword> | .health | .uptime2 | .sysinfo | .uuid | .timestamp [unix] | .calcx <expression> | .jsonformat <json> | .textstats <text> | .choose <a> | <b> ...',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { prefix = '.', reply } = ctx;
        const command = (ctx.command || '').toLowerCase();

        if (command === 'find' || command === 'searchcmd') {
            const query = args.join(' ').trim().toLowerCase();
            if (!query) return reply(`🔎 Usage: ${prefix}find <keyword>\nExample: ${prefix}find download`);
            const hits = commandInventory()
                .filter(item => `${item.command} ${item.description}`.toLowerCase().includes(query))
                .filter((item, index, list) => list.findIndex(x => x.command === item.command) === index)
                .slice(0, 25);
            if (!hits.length) return reply(`❌ No commands matched *${query}*.\nTry ${prefix}menu or search another keyword.`);
            const lines = hits.map(item => {
                const icon = item.permission === 'owner' ? '👑' : item.permission === 'admin' ? '⚙️' : '🌍';
                return `${icon} ${prefix}${item.command} — ${item.description}`;
            });
            return reply(`🔎 *Command Search: ${query}*\n\n${lines.join('\n')}\n\n_Use ${prefix}help <command> for details._`);
        }

        if (command === 'health') {
            const started = Date.now();
            const latency = Date.now() - started;
            return reply(`🏓 *Pong!*\n\n⚡ Process: ${latency}ms\n⏱️ Uptime: ${formatDuration(process.uptime() * 1000)}`);
        }

        if (command === 'uptime2') {
            return reply(`⏱️ *Bot Uptime*\n\n${formatDuration(process.uptime() * 1000)}\n\n_Node.js ${process.version}_`);
        }

        if (command === 'sysinfo') {
            const memory = process.memoryUsage();
            const used = Math.round(memory.rss / 1024 / 1024);
            const total = Math.round(os.totalmem() / 1024 / 1024);
            return reply([
                '🖥️ *System Information*',
                '',
                `• Platform: ${process.platform} (${os.arch()})`,
                `• Node.js: ${process.version}`,
                `• Host memory: ${used}MB / ${total}MB`,
                `• CPU cores: ${os.cpus().length}`,
                `• Uptime: ${formatDuration(process.uptime() * 1000)}`
            ].join('\n'));
        }

        if (command === 'uuid') {
            return reply(`🆔 *UUID*\n\n\`${crypto.randomUUID()}\``);
        }

        if (command === 'timestamp') {
            const value = args[0] ? Number(args[0]) : Date.now();
            if (!Number.isFinite(value)) return reply(`Usage: ${prefix}timestamp [unix milliseconds]`);
            const date = new Date(String(value).length <= 10 ? value * 1000 : value);
            if (Number.isNaN(date.getTime())) return reply('❌ Invalid timestamp.');
            return reply(`🕒 *Timestamp*\n\nUnix seconds: ${Math.floor(date.getTime() / 1000)}\nUnix milliseconds: ${date.getTime()}\nISO: ${date.toISOString()}`);
        }

        if (command === 'calcx') {
            const expression = args.join(' ');
            const result = safeExpression(expression);
            if (result === null) return reply(`🧮 Usage: ${prefix}calcx <numbers and operators>\nExample: ${prefix}calcx (25 * 4) + 10`);
            return reply(`🧮 *Calculator*\n\n${expression} = *${result}*`);
        }

        if (command === 'jsonformat') {
            const input = args.join(' ').trim();
            if (!input) return reply(`Usage: ${prefix}jsonformat {"name":"Silva"}`);
            try {
                return reply(`🧾 *Formatted JSON*\n\n\`${JSON.stringify(JSON.parse(input), null, 2)}\``);
            } catch {
                return reply('❌ That is not valid JSON.');
            }
        }

        if (command === 'textstats') {
            const text = args.join(' ');
            if (!text) return reply(`Usage: ${prefix}textstats <text>`);
            const words = text.trim() ? text.trim().split(/\s+/).length : 0;
            const lines = text ? text.split(/\r?\n/).length : 0;
            return reply(`📊 *Text Statistics*\n\n• Characters: ${text.length}\n• Words: ${words}\n• Lines: ${lines}\n• Characters without spaces: ${text.replace(/\s/g, '').length}`);
        }

        if (command === 'choose') {
            const options = args.join(' ').split('|').map(x => x.trim()).filter(Boolean);
            if (options.length < 2) return reply(`🎲 Usage: ${prefix}choose option 1 | option 2 | option 3`);
            const choice = options[Math.floor(Math.random() * options.length)];
            return reply(`🎲 *Random Choice*\n\n${choice}\n\n_From ${options.length} options_`);
        }
    }
};
