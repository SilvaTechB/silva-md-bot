'use strict';

const { runAgent, clearHistory, getHistory } = require('../lib/agent-v2');
const universalDownloader = require('./universal-downloader');
const setPrefixPlugin = require('./setprefix');

const SOCIAL_URL = /https?:\/\/(?:www\.)?(?:youtube\.com|youtu\.be|tiktok\.com|instagram\.com|facebook\.com|fb\.watch|twitter\.com|x\.com)\//i;
const ACTION_INTENT = /\b(weather|forecast|temperature|search|google|look up|wiki|wikipedia|translate|definition|define|lyrics?|play|music|song|spotify|tiktok|instagram|insta|facebook|youtube|ytmp[34]|twitter|tweet|pinterest|sticker|qr code|qrcode|remind|reminder|note|poll|schedule|group|kick|remove|promote|demote|mute|unmute|lock|unlock|tag all|download|save this|send this)\b/i;

function pluginMap() {
    const map = new Map();
    try {
        const { plugins } = require('../handler');
        for (const plugin of plugins || []) {
            const modules = Array.isArray(plugin) ? plugin : [plugin];
            for (const mod of modules) for (const command of mod?.commands || []) if (!map.has(command)) map.set(command, mod);
        }
    } catch {}
    return map;
}

function permissionAllowed(plugin, ctx) {
    if (plugin.permission === 'owner') return Boolean(ctx.isOwner);
    if (plugin.permission === 'admin') return Boolean(ctx.isAdmin || ctx.isOwner);
    return true;
}

function parseNaturalPrefixCommand(query) {
    const match = String(query || '').trim().match(
        /^(?:set|change|switch|update)\s+(?:the\s+)?prefix\s*(?:(?:to|as)\s*|=\s*)?(.+)$/i
    );
    if (!match) return null;

    const value = match[1].trim().replace(/^([`"'])(.*)\1$/, '$2').trim();
    if (!value) return null;

    const noPrefix = /^(?:null|none|off|disable|disabled|no\s+prefix)$/i.test(value);
    return noPrefix ? 'none' : value;
}

async function runNaturalPrefixCommand(sock, message, query, ctx) {
    const newPrefix = parseNaturalPrefixCommand(query);
    if (newPrefix === null) return false;

    if (!ctx.isOwner) {
        await ctx.reply('⛔ Only the bot owner can change the command prefix.');
        return true;
    }

    await setPrefixPlugin.run(sock, message, [newPrefix], ctx);
    return true;
}

async function runExplicitCommand(sock, message, query, ctx) {
    const match = query.match(/^(?:run|execute|do|use|try|open)\s+\.?([a-z0-9_-]+)(?:\s+(.*))?$/i)
        || query.match(/^\.?([a-z0-9_-]+)(?:\s+(.*))?$/i);
    if (!match) return false;
    const command = (match[1] || '').toLowerCase();
    const plugin = pluginMap().get(command);
    if (!plugin || ['silva', 'agent', 'assistant', 'ask', 'autopilot', 'agent2', 'copilot'].includes(command)) return false;
    if (!permissionAllowed(plugin, ctx)) {
        await ctx.reply(`⛔ The ${command} command requires ${plugin.permission} permission.`);
        return true;
    }
    await plugin.run(sock, message, (match[2] || '').split(/\s+/).filter(Boolean), ctx);
    return true;
}

async function runLocalAction(sock, message, query, ctx) {
    if (await runNaturalPrefixCommand(sock, message, query, ctx)) return true;

    const url = query.match(/https?:\/\/[^\s<>]+/i)?.[0]?.replace(/[),.!?]+$/, '');
    const asksForMedia = /\b(download|save|send|get|fetch|video|audio|mp3|mp4)\b/i.test(query);
    if ((url && SOCIAL_URL.test(url) && asksForMedia) || /^download\s+(?:search\s+)?/i.test(query)) {
        const format = /\bmp3\b|\baudio\b/i.test(query) ? 'mp3' : 'mp4';
        const args = query.match(/^download\s+search\s+(.+?)(?:\s+(mp3|mp4))?$/i);
        if (args) {
            await universalDownloader.run(sock, message, ['search', args[1], args[2] || format], ctx);
            return true;
        }
        await universalDownloader.run(sock, message, [url || query.replace(/^download\s+/i, ''), format], ctx);
        return true;
    }

    if (await runExplicitCommand(sock, message, query, ctx)) return true;

    // Reuse the mature legacy action router for deterministic commands only.
    // Conversational requests continue through Agent v2 and ch.at.
    if (ACTION_INTENT.test(query)) {
        const legacy = require('./silva-agent');
        await legacy.run(sock, message, query.split(/\s+/).filter(Boolean), ctx);
        return true;
    }
    return false;
}

module.exports = {
    commands: ['silva', 'agent', 'assistant', 'ask', 'autopilot', 'agent2', 'copilot'],
    description: 'Primary Silva Agent with ch.at, memory, local command execution, and media delivery',
    usage: 'Silva <request> | .silva <request> | .autopilot <request>',
    permission: 'public',
    group: true,
    private: true,
    parseNaturalPrefixCommand,

    run: async (sock, message, args, ctx) => {
        const { jid, reply } = ctx;
        const query = args.join(' ').trim();
        if (!query) return reply([
            '🧠 *Silva Agent*',
            '',
            'Talk naturally without a prefix, or use `.silva`.',
            '',
            'Examples:',
            '• `Silva, what is the weather in Nairobi?`',
            '• `Silva, download this link as mp4: <url>`',
            '• `Silva, download this link as mp3: <url>`',
            '• `Silva, run menu`',
            '• `Silva, remember that I prefer short answers`',
            '',
            'Use `Silva, forget our conversation` to clear memory.'
        ].join('\n'));

        if (/^(forget|clear|reset)\b/i.test(query)) {
            clearHistory(jid);
            return reply('✅ Silva memory cleared for this chat.');
        }
        if (/^status$/i.test(query)) {
            return reply(`🧠 *Silva Agent Status*\n\nPersistent memory items: ${getHistory(jid).length}\nChat backend: ch.at (no API key)\nLocal command execution: enabled\nMedia delivery: MP4 + MP3 enabled`);
        }

        try {
            if (await runLocalAction(sock, message, query, ctx)) return;
            await reply('🧠 Thinking...');
            const result = await runAgent(query, { ...ctx, sock, message });
            return reply(`🤖 *Silva*\n\n${result.text}`);
        } catch (error) {
            console.error(`[SilvaAgent] ${error.message}`);
            return reply('❌ Silva could not complete that request. Please try again.');
        }
    }
};
