'use strict';
const config = require('../config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');
const os = require('os');

const BOT_IDENTITY = {
    name: 'Silva MD',
    version: '2.0',
    language: 'Node.js',
    library: 'Baileys (gifted-baileys)',
    repo: 'https://github.com/SilvaTechB/silva-md-v4',
    website: 'https://silvatech.co.ke',
    platform: 'Replit',
    developer: 'SilvaTech',
    ownerName: config.OWNER_NAME || 'Silva MD',
    ownerNumber: config.OWNER_NUMBER || '',
    features: [
        'Auto View Status', 'Anti-Delete Messages', 'Download Songs & Videos',
        'View-Once Recovery', 'Fake Recording/Typing', 'Always Online',
        'Auto Like Status', 'AI/ChatGPT Integration', 'Status Downloader',
        'Anti-Call', 'Smart Chatbot', 'Auto Bio Update', 'Auto React',
        'Auto Read Messages', 'Auto Save Contacts', 'Anti-Ban Protection',
        'WhatsApp Safe Mode', 'Sudo System', 'Multi-Prefix Support'
    ],
};

function getPluginMap() {
    const dir = path.join(__dirname);
    const map = new Map();
    for (const f of fs.readdirSync(dir).filter(f => f.endsWith('.js'))) {
        try {
            const p = require(path.join(dir, f));
            if (Array.isArray(p.commands) && typeof p.run === 'function') {
                for (const cmd of p.commands) {
                    if (!map.has(cmd)) map.set(cmd, p);
                }
            } else if (Array.isArray(p)) {
                for (const entry of p) {
                    if (Array.isArray(entry.commands) && typeof entry.run === 'function') {
                        for (const cmd of entry.commands) {
                            if (!map.has(cmd)) map.set(cmd, entry);
                        }
                    }
                }
            }
        } catch {}
    }
    return map;
}

let cachedPluginMap = null;
function pluginMap() {
    if (!cachedPluginMap) cachedPluginMap = getPluginMap();
    return cachedPluginMap;
}

function formatUptime() {
    const uptime = process.uptime();
    const h = Math.floor(uptime / 3600);
    const m = Math.floor((uptime % 3600) / 60);
    const s = Math.floor(uptime % 60);
    if (h > 0) return `${h}h ${m}m ${s}s`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
}

function getPlatformInfo() {
    const memUsed = Math.round(process.memoryUsage().rss / 1024 / 1024);
    const totalMem = Math.round(os.totalmem() / 1024 / 1024);
    return {
        platform: 'Replit',
        os: `${os.type()} ${os.release()}`,
        arch: os.arch(),
        nodeVersion: process.version,
        memory: `${memUsed}MB / ${totalMem}MB`,
        cpus: os.cpus().length,
        hostname: os.hostname(),
        uptime: formatUptime(),
        pid: process.pid,
    };
}

function getActiveFeatures() {
    const features = [];
    if (config.AUTO_STATUS_SEEN) features.push('Auto View Status');
    if (config.AUTO_STATUS_REACT) features.push('Auto Like Status');
    if (config.ANTIDELETE_GROUP || config.ANTIDELETE_PRIVATE) features.push('Anti-Delete');
    if (config.ANTIVV) features.push('View-Once Recovery');
    if (config.AUTO_TYPING) features.push('Fake Typing');
    if (config.AUTO_RECORDING) features.push('Fake Recording');
    if (config.ALWAYS_ONLINE) features.push('Always Online');
    if (config.READ_MESSAGE) features.push('Auto Read');
    if (config.ANTILINK) features.push('Anti-Link');
    if (config.ANTI_BAD) features.push('Anti-Bad Words');
    return features;
}

const agentActions = {
    run_command: /^(run|execute|do|use|try|open)\s+(\.?\w+)/i,
    create_group_desc: /create\s+(a\s+)?(group\s+)?desc(ription)?/i,
    create_bio: /create\s+(a\s+)?(bio|about|profile\s*(text|desc))/i,
    create_welcome: /create\s+(a\s+)?welcome\s*(msg|message)?/i,
    create_goodbye: /create\s+(a\s+)?goodbye\s*(msg|message)?/i,
    create_caption: /create\s+(a\s+)?caption/i,
    create_announcement: /create\s+(a\s+)?(announcement|broadcast|notice)/i,
    create_rules: /create\s+(a\s+)?(group\s+)?rules/i,
    create_greeting: /create\s+(a\s+)?greet(ing)?\s*(msg|message)?/i,
    create_quote: /create\s+(a\s+)?(custom\s+)?quote/i,
    create_poem: /create\s+(a\s+)?poem/i,
    create_story: /create\s+(a\s+)?story/i,
    create_joke: /create\s+(a\s+)?joke/i,
    create_rap: /create\s+(a\s+)?rap/i,
    create_song: /create\s+(a\s+)?song/i,
    write: /write\s+(a\s+)?(message|text|letter|email|note|essay|paragraph|article|review|speech|toast)/i,
    menu: /^(show\s+)?(menu|commands|help|list\s+commands)/i,
    about_bot: /about\s*(the\s*)?(bot|silva|yourself)|who\s*are\s*you|what\s*are\s*you|tell\s*me\s*about\s*(yourself|silva|this\s*bot)/i,
    about_platform: /platform|server|hosting|where\s*(are\s*you|is\s*(the\s*bot|silva))\s*(running|hosted)|system\s*info|server\s*info|specs/i,
    about_owner: /who\s*(is\s*)?(the\s*)?(owner|creator|developer|made|built|coded)|your\s*(owner|creator|dev)/i,
    features: /features|what\s*can\s*(you|the\s*bot|silva)\s*do|capabilities|abilities|powers/i,
    settings: /settings|config|current\s*settings|bot\s*settings|show\s*settings/i,
    time: /what\s*(time|hour|clock)|current\s*time|time\s*now/i,
    date: /what\s*(date|day|today)|current\s*date|today/i,
    calc: /calc|compute|math|solve|\d+\s*[\+\-\*\/\%\^]\s*\d+/i,
    joke: /^(tell\s+)?(a\s+)?joke|funny|laugh|humor/i,
    fact: /^(tell\s+)?(a\s+)?fact|did\s*you\s*know|interesting/i,
    quote: /^(give\s+)?(a\s+)?quote|motivat|inspir/i,
    flip: /flip\s*(a\s*)?coin|coin\s*flip|heads\s*or\s*tails/i,
    roll: /roll\s*(a\s*)?dice|dice\s*roll/i,
    password: /password|pass\s*gen|random\s*pass/i,
    color: /color|colour|hex|rgb/i,
    uptime: /uptime|how\s*long.*running/i,
    search: /search|google|look\s*up|find\s+(info|about|on)/i,
    news: /news|headlines|latest\s+news|breaking/i,
    weather: /weather|temperature|forecast|climate/i,
    ip: /ip\s*(info|address|lookup|check)|my\s*ip|what.*ip/i,
    love: /love\s*calc|love\s*meter|compatib/i,
    group: /group\s*(info|details|members|count)/i,
    plugin_list: /list\s*plugins|how\s*many\s*(commands|plugins)|plugin\s*count|total\s*commands/i,
    sudo: /sudo\s*(list|users|info)|who\s*(are|is)\s*(the\s*)?sudo/i,
    help: /^help$|what\s*can\s*you\s*do|your\s*capabilities/i,
};

module.exports = {
    commands: ['agent', 'do', 'silva', 'assistant', 'ask'],
    description: 'AI Agent - Can run commands, create content, search the web, and knows everything about the bot',
    permission: 'public',
    run: async (sock, message, args, ctx) => {
        const { jid, reply, safeSend, isOwner, isGroup, isAdmin } = ctx;
        const query = args.join(' ').trim();
        if (!query) return reply(
            `🤖 *Silva Agent*\n\n` +
            `I'm ${BOT_IDENTITY.name} v${BOT_IDENTITY.version}, your intelligent WhatsApp assistant!\n\n` +
            `*What I can do:*\n\n` +
            `📋 *Run Commands*\n` +
            `• "run menu" • "do alive" • "use sticker"\n\n` +
            `✍️ *Create Content*\n` +
            `• "create a bio" • "create welcome message"\n` +
            `• "create group rules" • "write a poem"\n` +
            `• "create announcement" • "write a letter"\n\n` +
            `🌐 *Web Access*\n` +
            `• "search Node.js" • "weather Nairobi" • "news"\n\n` +
            `ℹ️ *Bot Knowledge*\n` +
            `• "about the bot" • "platform info"\n` +
            `• "who is the owner" • "show features"\n` +
            `• "current settings" • "list plugins"\n\n` +
            `🧠 *AI Chat* — Ask me anything!\n\n` +
            `_Type: .agent <your request>_`
        );

        let response = '';

        const runMatch = query.match(agentActions.run_command);
        if (runMatch) {
            const cmdName = runMatch[2].replace(/^\./, '').toLowerCase();
            const restArgs = query.replace(runMatch[0], '').trim().split(/\s+/).filter(Boolean);
            const pm = pluginMap();
            const plugin = pm.get(cmdName);

            if (!plugin) {
                const suggestions = [...pm.keys()].filter(c => c.includes(cmdName) || cmdName.includes(c)).slice(0, 5);
                const hint = suggestions.length ? `\n\nDid you mean: ${suggestions.map(s => `\`${s}\``).join(', ')}` : '';
                return reply(`❌ Command \`${cmdName}\` not found. I have ${pm.size} commands available.${hint}`);
            }

            if (plugin.permission === 'owner' && !isOwner) {
                return reply(`⛔ The \`${cmdName}\` command requires owner permission.`);
            }
            if (plugin.permission === 'admin' && !isAdmin && !isOwner) {
                return reply(`⛔ The \`${cmdName}\` command requires admin permission.`);
            }

            try {
                await plugin.run(sock, message, restArgs, ctx);
                return;
            } catch (err) {
                return reply(`❌ Error running \`${cmdName}\`: ${err.message}`);
            }
        }

        if (agentActions.about_bot.test(query)) {
            const pm = pluginMap();
            const plat = getPlatformInfo();
            response =
                `🤖 *About ${BOT_IDENTITY.name}*\n\n` +
                `I'm a feature-rich multi-device WhatsApp bot built by *${BOT_IDENTITY.developer}*.\n\n` +
                `📊 *Stats*\n` +
                `• Version: *v${BOT_IDENTITY.version}*\n` +
                `• Commands: *${pm.size}+*\n` +
                `• Plugins: *${new Set([...pm.values()]).size}* files\n` +
                `• Uptime: *${plat.uptime}*\n\n` +
                `⚙️ *Tech Stack*\n` +
                `• Runtime: *${BOT_IDENTITY.language} ${plat.nodeVersion}*\n` +
                `• Library: *${BOT_IDENTITY.library}*\n` +
                `• Platform: *${BOT_IDENTITY.platform}*\n` +
                `• License: *Apache-2.0*\n\n` +
                `🌐 *Links*\n` +
                `• Repo: ${BOT_IDENTITY.repo}\n` +
                `• Website: ${BOT_IDENTITY.website}\n\n` +
                `👑 *Owner:* ${config.OWNER_NAME}\n` +
                `📞 *Number:* +${(config.OWNER_NUMBER || '').replace(/\D/g, '')}`;
        }

        else if (agentActions.about_platform.test(query)) {
            const plat = getPlatformInfo();
            const activeFeatures = getActiveFeatures();
            response =
                `🖥️ *Platform & System Info*\n\n` +
                `☁️ *Hosting*\n` +
                `• Platform: *${plat.platform}*\n` +
                `• OS: *${plat.os}*\n` +
                `• Architecture: *${plat.arch}*\n` +
                `• Hostname: *${plat.hostname}*\n\n` +
                `⚡ *Performance*\n` +
                `• Node.js: *${plat.nodeVersion}*\n` +
                `• Memory: *${plat.memory}*\n` +
                `• CPUs: *${plat.cpus}*\n` +
                `• PID: *${plat.pid}*\n` +
                `• Uptime: *${plat.uptime}*\n\n` +
                `✅ *Active Features (${activeFeatures.length})*\n` +
                activeFeatures.map(f => `• ${f}`).join('\n');
        }

        else if (agentActions.about_owner.test(query)) {
            const sudoCount = global.sudoUsers?.size || 0;
            response =
                `👑 *Bot Owner*\n\n` +
                `• Name: *${config.OWNER_NAME || 'Silva MD'}*\n` +
                `• Number: *+${(config.OWNER_NUMBER || '').replace(/\D/g, '')}*\n` +
                `• Bot: *${config.BOT_NAME || 'Silva MD'}*\n` +
                `• Developer: *${BOT_IDENTITY.developer}*\n` +
                `• Website: ${BOT_IDENTITY.website}\n` +
                `• GitHub: ${BOT_IDENTITY.repo}\n` +
                `• Sudo Users: *${sudoCount}*\n\n` +
                `_${BOT_IDENTITY.name} was created by ${BOT_IDENTITY.developer} and is maintained with love._`;
        }

        else if (agentActions.features.test(query)) {
            const active = getActiveFeatures();
            response =
                `⚡ *${BOT_IDENTITY.name} Features*\n\n` +
                `*All 19 Features:*\n` +
                BOT_IDENTITY.features.map((f, i) => `${i + 1}. ${f} ${active.includes(f) ? '✅' : '⬚'}`).join('\n') +
                `\n\n✅ = Active  ⬚ = Inactive\n\n` +
                `_Use \`.setsetting\` to toggle features on/off._`;
        }

        else if (agentActions.settings.test(query)) {
            response =
                `⚙️ *Current Bot Settings*\n\n` +
                `• Bot Name: *${config.BOT_NAME}*\n` +
                `• Prefix: *${config.PREFIX}*\n` +
                `• Mode: *${config.MODE}*\n` +
                `• Theme: *${config.THEME}*\n\n` +
                `📡 *Auto Features*\n` +
                `• Auto Status View: ${config.AUTO_STATUS_SEEN ? '✅' : '❌'}\n` +
                `• Auto Status React: ${config.AUTO_STATUS_REACT ? '✅' : '❌'}\n` +
                `• Auto Status Reply: ${config.AUTO_STATUS_REPLY ? '✅' : '❌'}\n` +
                `• Auto Typing: ${config.AUTO_TYPING ? '✅' : '❌'}\n` +
                `• Auto Recording: ${config.AUTO_RECORDING ? '✅' : '❌'}\n` +
                `• Always Online: ${config.ALWAYS_ONLINE ? '✅' : '❌'}\n` +
                `• Auto Read: ${config.READ_MESSAGE ? '✅' : '❌'}\n\n` +
                `🛡️ *Protection*\n` +
                `• Anti-Delete (Groups): ${config.ANTIDELETE_GROUP ? '✅' : '❌'}\n` +
                `• Anti-Delete (Private): ${config.ANTIDELETE_PRIVATE ? '✅' : '❌'}\n` +
                `• Anti-Link: ${config.ANTILINK ? '✅' : '❌'}\n` +
                `• Anti-Bad Words: ${config.ANTI_BAD ? '✅' : '❌'}\n` +
                `• View-Once Recovery: ${config.ANTIVV ? '✅' : '❌'}`;
        }

        else if (agentActions.sudo.test(query)) {
            const sudoList = global.sudoUsers?.size ? [...global.sudoUsers].map((j, i) => `${i + 1}. +${j.split('@')[0]}`).join('\n') : 'No sudo users set.';
            response = `👤 *Sudo Users*\n\n${sudoList}\n\n_Sudo users have owner-level access to all commands._`;
        }

        else if (agentActions.create_bio.test(query)) {
            const topic = query.replace(agentActions.create_bio, '').trim();
            const bios = [
                `✨ ${config.BOT_NAME} | Always Online | Powered by ${BOT_IDENTITY.developer} ⚡`,
                `🤖 ${config.BOT_NAME} v${BOT_IDENTITY.version} | ${pluginMap().size}+ Commands | ${BOT_IDENTITY.website}`,
                `👑 Owned by ${config.OWNER_NAME} | Bot: ${config.BOT_NAME} | 24/7 Active`,
                `🔥 ${config.BOT_NAME} | Multi-Device WhatsApp Bot | ${BOT_IDENTITY.features.length} Smart Features`,
                `⚡ Powered by ${BOT_IDENTITY.developer} | ${config.BOT_NAME} | The Ultimate WA Bot`,
                `🌟 ${config.BOT_NAME} | AI-Powered | Anti-Ban Safe | ${config.OWNER_NAME}`,
            ];
            response = `✍️ *Bio Ideas${topic ? ` (${topic})` : ''}*\n\n${bios.map((b, i) => `*${i + 1}.* ${b}`).join('\n\n')}\n\n_Copy any bio above! Use \`.setbio <text>\` to set it._`;
        }

        else if (agentActions.create_welcome.test(query)) {
            const groupName = ctx.groupMetadata?.subject || 'Our Group';
            response =
                `✍️ *Welcome Message Ideas*\n\n` +
                `*1.* 👋 Welcome to *${groupName}*! We're glad to have you here.\n` +
                `Please read the group description and follow the rules.\n` +
                `Enjoy your stay! 🎉\n\n` +
                `*2.* 🌟 Hey there! Welcome to *${groupName}*!\n` +
                `Feel free to introduce yourself and join the conversation.\n` +
                `Bot: ${config.BOT_NAME} | Prefix: ${config.PREFIX}\n\n` +
                `*3.* 🎊 *New Member Alert!*\n` +
                `Welcome aboard, @user! 🙌\n` +
                `📌 Read the rules\n` +
                `💬 Introduce yourself\n` +
                `🤖 Use ${config.PREFIX}menu for bot commands\n\n` +
                `_Use \`.setwelcome <message>\` to set your welcome message._`;
        }

        else if (agentActions.create_goodbye.test(query)) {
            response =
                `✍️ *Goodbye Message Ideas*\n\n` +
                `*1.* 👋 Goodbye @user! We'll miss you. Take care! 💙\n\n` +
                `*2.* 😢 @user has left the group. Wishing you all the best!\n\n` +
                `*3.* 🚪 @user just left. Hope to see you again soon! ✌️\n\n` +
                `_Use \`.setgoodbye <message>\` to set it._`;
        }

        else if (agentActions.create_announcement.test(query)) {
            const topic = query.replace(agentActions.create_announcement, '').trim();
            response =
                `✍️ *Announcement Templates*\n\n` +
                `*1.* 📢 *ANNOUNCEMENT*\n\n` +
                `${topic || 'Your announcement content here...'}\n\n` +
                `— *${config.OWNER_NAME}*\n` +
                `_${config.BOT_NAME}_\n\n` +
                `*2.* 🔔 *IMPORTANT NOTICE*\n\n` +
                `Attention all members!\n\n` +
                `${topic || 'Details of the announcement...'}\n\n` +
                `Please take note. Thank you! 🙏\n\n` +
                `*3.* ⚡ *UPDATE*\n\n` +
                `${topic || 'What\'s new...'}\n\n` +
                `For questions, contact: @${(config.OWNER_NUMBER || '').replace(/\D/g, '')}\n\n` +
                `_Use \`.broadcast <message>\` to send to all groups._`;
        }

        else if (agentActions.create_rules.test(query)) {
            const groupName = ctx.groupMetadata?.subject || 'this group';
            response =
                `✍️ *Group Rules Template*\n\n` +
                `📜 *Rules for ${groupName}*\n\n` +
                `1️⃣ Be respectful to all members\n` +
                `2️⃣ No spamming or flooding\n` +
                `3️⃣ No NSFW or inappropriate content\n` +
                `4️⃣ No unauthorized links or promotions\n` +
                `5️⃣ English only (or specify language)\n` +
                `6️⃣ No personal attacks or bullying\n` +
                `7️⃣ Follow admin instructions\n` +
                `8️⃣ No voice notes abuse\n` +
                `9️⃣ Stay on topic\n` +
                `🔟 Have fun and be kind! 😊\n\n` +
                `_Violations may result in a warning or removal._\n` +
                `_Bot: ${config.BOT_NAME} | Prefix: ${config.PREFIX}_\n\n` +
                `_Use \`.setdesc <text>\` to set as group description._`;
        }

        else if (agentActions.create_greeting.test(query)) {
            response =
                `✍️ *Greeting Message Ideas*\n\n` +
                `*1.* 👋 Hey there! I'm *${config.BOT_NAME}*, your WhatsApp assistant.\n` +
                `Type *${config.PREFIX}menu* to see what I can do! 🤖\n\n` +
                `*2.* 🌟 Welcome! I'm *${config.BOT_NAME}* by *${config.OWNER_NAME}*.\n` +
                `I have ${pluginMap().size}+ commands. Start with *${config.PREFIX}help*\n\n` +
                `*3.* Hey! 👋 Thanks for messaging.\n` +
                `I'm an AI-powered bot with tons of features.\n` +
                `Try: *${config.PREFIX}agent help* for my capabilities.\n\n` +
                `_Set with \`.setgreet <message>\` or via GREETING env var._`;
        }

        else if (agentActions.create_group_desc.test(query)) {
            const topic = query.replace(agentActions.create_group_desc, '').trim();
            response =
                `✍️ *Group Description Ideas*\n\n` +
                `*1.* 🌟 *${topic || 'Group Name'}*\n\n` +
                `Welcome to our community! 🎉\n` +
                `📋 Read the rules before posting\n` +
                `🤖 Bot: ${config.BOT_NAME} (${config.PREFIX}menu)\n` +
                `👑 Owner: ${config.OWNER_NAME}\n\n` +
                `*2.* ⚡ *${topic || 'Group Name'}*\n\n` +
                `A group for ${topic || 'our community'}.\n` +
                `🔗 ${BOT_IDENTITY.website}\n` +
                `📱 Powered by ${config.BOT_NAME}\n\n` +
                `_Use \`.setdesc <text>\` to apply._`;
        }

        else if (agentActions.create_caption.test(query)) {
            const topic = query.replace(agentActions.create_caption, '').trim();
            response =
                `✍️ *Caption Ideas*\n\n` +
                `*1.* ${topic ? `✨ ${topic} ✨` : '✨ Living my best life ✨'}\n_— ${config.OWNER_NAME}_\n\n` +
                `*2.* 🔥 ${topic || 'Powered by ambition, driven by purpose'} 💯\n\n` +
                `*3.* 🌍 ${topic || 'Making moves in silence'} 🤫\n_${config.BOT_NAME} © ${new Date().getFullYear()}_\n\n` +
                `*4.* ⚡ ${topic || 'Success is the only option'} 👑\n\n` +
                `_Use \`.setcaption <text>\` to set bot caption._`;
        }

        else if (agentActions.create_quote.test(query)) {
            const topic = query.replace(agentActions.create_quote, '').trim();
            const quotes = [
                { text: `The best bot is the one that makes life easier.`, author: BOT_IDENTITY.developer },
                { text: `${topic || 'Technology'} is not just a tool, it's a mindset.`, author: config.OWNER_NAME },
                { text: `In a world of followers, be a ${topic || 'creator'}.`, author: `${config.BOT_NAME} Wisdom` },
                { text: `Every expert was once a beginner. Keep ${topic || 'coding'}.`, author: BOT_IDENTITY.developer },
                { text: `Dream big. ${topic || 'Code'} bigger.`, author: config.OWNER_NAME },
            ];
            response = `✍️ *Custom Quotes${topic ? ` about ${topic}` : ''}*\n\n` +
                quotes.map((q, i) => `*${i + 1}.* _"${q.text}"_\n   — *${q.author}*`).join('\n\n');
        }

        else if (agentActions.create_poem.test(query)) {
            const topic = query.replace(agentActions.create_poem, '').trim() || 'technology';
            response =
                `✍️ *Poem: ${topic}*\n\n` +
                `_In the world of ${topic},_\n` +
                `_Where dreams and code align,_\n` +
                `_We build with passion daily,_\n` +
                `_One commit at a time._\n\n` +
                `_Through errors and through trials,_\n` +
                `_We learn, we grow, we shine,_\n` +
                `_For ${topic} is the future,_\n` +
                `_And the future's yours and mine._\n\n` +
                `— *${config.BOT_NAME} Poetry* ✨`;
        }

        else if (agentActions.create_story.test(query)) {
            const topic = query.replace(agentActions.create_story, '').trim() || 'a developer';
            response =
                `✍️ *Short Story: The Tale of ${topic}*\n\n` +
                `Once upon a time, there was ${topic} who dreamed of building something amazing. ` +
                `Day after day, they worked tirelessly, learning from failures and celebrating small wins.\n\n` +
                `One day, their creation — *${config.BOT_NAME}* — came to life. It could talk, help people, ` +
                `and bring joy to thousands of WhatsApp users around the world.\n\n` +
                `"This is just the beginning," they whispered, typing one more line of code.\n\n` +
                `*The End.* ✨\n\n— _${config.BOT_NAME} Stories_`;
        }

        else if (agentActions.create_joke.test(query)) {
            const topic = query.replace(agentActions.create_joke, '').trim();
            response =
                `✍️ *Custom Jokes${topic ? ` about ${topic}` : ''}*\n\n` +
                `*1.* Why did ${topic || 'the bot'} go to school?\nBecause it wanted more *class*! 😂\n\n` +
                `*2.* What's ${topic || 'a programmer'}'s favorite hangout?\nFoo Bar! 🍻😂\n\n` +
                `*3.* Why was ${topic || 'the WhatsApp bot'} so good at its job?\nBecause it never left anyone on *read*! 😂\n\n` +
                `_Want more? Try: .joke or .agent tell a joke_`;
        }

        else if (agentActions.create_rap.test(query)) {
            const topic = query.replace(agentActions.create_rap, '').trim() || 'the bot life';
            response =
                `✍️ *Rap: ${topic}*\n\n` +
                `🎤 _Yeah, yeah, uh..._\n\n` +
                `_They call me ${config.BOT_NAME}, running all day,_\n` +
                `_${pluginMap().size} commands, I don't play,_\n` +
                `_${topic}, that's what I'm about,_\n` +
                `_Online 24/7, never down and out._\n\n` +
                `_Built by ${BOT_IDENTITY.developer}, coded with care,_\n` +
                `_Multi-device bot, beyond compare,_\n` +
                `_Anti-ban safe, I'm always clean,_\n` +
                `_The smartest WhatsApp bot you've ever seen._ 🔥\n\n` +
                `— *${config.BOT_NAME} Bars* 🎵`;
        }

        else if (agentActions.create_song.test(query)) {
            const topic = query.replace(agentActions.create_song, '').trim() || 'connection';
            response =
                `✍️ *Song: ${topic}*\n\n` +
                `🎵 *Verse 1*\n` +
                `_In a world of messages and calls,_\n` +
                `_${config.BOT_NAME} stands tall through it all,_\n` +
                `_${topic}, it's what we share,_\n` +
                `_Through every chat, we show we care._\n\n` +
                `🎵 *Chorus*\n` +
                `_Oh, ${topic}, ${topic},_\n` +
                `_Bringing us together every day,_\n` +
                `_With ${config.BOT_NAME} by our side,_\n` +
                `_Everything will be okay._ 🎶\n\n` +
                `— *${config.BOT_NAME} Music* 🎵`;
        }

        else if (agentActions.write.test(query)) {
            const writeMatch = query.match(agentActions.write);
            const contentType = writeMatch ? writeMatch[2] : 'message';
            const topic = query.replace(agentActions.write, '').trim();

            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
                if (apiKey) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
                    const prompt = `Write a ${contentType}${topic ? ` about: ${topic}` : ''}. Keep it concise, well-formatted, and professional. Do not use markdown headers. Sign off as "${config.OWNER_NAME}" if appropriate.`;
                    const result = await model.generateContent(prompt);
                    response = `✍️ *${contentType.charAt(0).toUpperCase() + contentType.slice(1)}*\n\n${result.response.text()}`;
                } else {
                    response =
                        `✍️ *${contentType.charAt(0).toUpperCase() + contentType.slice(1)}${topic ? `: ${topic}` : ''}*\n\n` +
                        `Dear recipient,\n\n` +
                        `${topic || 'I am writing to share something important with you'}.\n\n` +
                        `Thank you for your time and attention.\n\n` +
                        `Best regards,\n` +
                        `*${config.OWNER_NAME}*\n` +
                        `_${config.BOT_NAME}_\n\n` +
                        `_For better AI-generated content, set a GEMINI_API_KEY._`;
                }
            } catch {
                response = `❌ Could not generate the ${contentType}. Try again later.`;
            }
        }

        else if (agentActions.menu.test(query)) {
            const pm = pluginMap();
            const menuPlugin = pm.get('menu');
            if (menuPlugin) {
                try { await menuPlugin.run(sock, message, [], ctx); return; } catch {}
            }
            response = `📋 I have ${pm.size} commands. Type .menu to see them all.`;
        }

        else if (agentActions.plugin_list.test(query)) {
            const pm = pluginMap();
            response = `📋 *Plugin Stats*\n\n• Total commands: *${pm.size}*\n• Plugin files: *${new Set([...pm.values()]).size}*\n• Platform: *${BOT_IDENTITY.platform}*\n\nType \`.menu\` for the full categorized list.`;
        }

        else if (agentActions.time.test(query)) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            response = `🕐 *Current Time*\n\n${timeStr} (EAT - Africa/Nairobi)`;
        } else if (agentActions.date.test(query)) {
            const now = new Date();
            const dateStr = now.toLocaleDateString('en-US', { timeZone: 'Africa/Nairobi', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
            response = `📅 *Today's Date*\n\n${dateStr}`;
        } else if (agentActions.calc.test(query)) {
            try {
                const expr = query.replace(/[^0-9\+\-\*\/\.\(\)\s\%\^]/g, '').replace(/\^/g, '**');
                if (!expr.trim()) throw new Error('no expression');
                const result = Function('"use strict"; return (' + expr + ')')();
                response = `🔢 *Calculator*\n\n${expr.trim()} = *${result}*`;
            } catch {
                response = '❌ Could not calculate that. Try: .agent calc 25 * 4';
            }
        } else if (agentActions.joke.test(query)) {
            try {
                const res = await axios.get('https://official-joke-api.appspot.com/random_joke', { timeout: 5000 });
                response = `😂 *Joke Time*\n\n${res.data.setup}\n\n${res.data.punchline}`;
            } catch {
                const jokes = [
                    "Why don't scientists trust atoms? Because they make up everything! 😂",
                    "What do you call a fake noodle? An impasta! 🍝😂",
                    "Why did the scarecrow win an award? He was outstanding in his field! 🌾😂",
                    "Why did the coffee file a police report? It got mugged! ☕😂",
                ];
                response = `😂 *Joke Time*\n\n${jokes[Math.floor(Math.random() * jokes.length)]}`;
            }
        } else if (agentActions.fact.test(query)) {
            try {
                const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 5000 });
                response = `🧠 *Fun Fact*\n\n${res.data.text}`;
            } catch {
                const facts = [
                    "Honey never spoils. Archaeologists found 3000-year-old honey that was still edible! 🍯",
                    "Octopuses have three hearts and blue blood. 🐙",
                    "A group of flamingos is called a 'flamboyance'. 🦩",
                    "Bananas are berries, but strawberries aren't. 🍌",
                ];
                response = `🧠 *Fun Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}`;
            }
        } else if (agentActions.quote.test(query)) {
            try {
                const res = await axios.get('https://api.quotable.io/random', { timeout: 5000 });
                response = `💫 *Quote*\n\n_"${res.data.content}"_\n\n— *${res.data.author}*`;
            } catch {
                const quotes = [
                    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
                    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
                ];
                const q = quotes[Math.floor(Math.random() * quotes.length)];
                response = `💫 *Quote*\n\n_"${q.text}"_\n\n— *${q.author}*`;
            }
        } else if (agentActions.flip.test(query)) {
            response = `🪙 *Coin Flip*\n\nResult: *${Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙'}*`;
        } else if (agentActions.roll.test(query)) {
            const sides = parseInt(query.match(/\d+/)?.[0]) || 6;
            response = `🎲 *Dice Roll* (${sides}-sided)\n\nResult: *${Math.floor(Math.random() * sides) + 1}*`;
        } else if (agentActions.password.test(query)) {
            const len = Math.min(parseInt(query.match(/\d+/)?.[0]) || 16, 64);
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
            let pass = '';
            for (let i = 0; i < len; i++) pass += chars[Math.floor(Math.random() * chars.length)];
            response = `🔐 *Password Generator*\n\nLength: ${len}\nPassword: \`${pass}\`\n\n_Copy and store safely!_`;
        } else if (agentActions.color.test(query)) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            response = `🎨 *Random Color*\n\nHEX: *${hex}*\nRGB: *rgb(${r}, ${g}, ${b})*`;
        } else if (agentActions.uptime.test(query)) {
            const plat = getPlatformInfo();
            response = `⏱️ *Bot Uptime*\n\nUptime: *${plat.uptime}*\nBot: ${config.BOT_NAME}\nMode: ${config.MODE}\nPlatform: ${BOT_IDENTITY.platform}\nMemory: ${plat.memory}`;
        } else if (agentActions.love.test(query)) {
            const percentage = Math.floor(Math.random() * 101);
            let emoji = percentage > 80 ? '💕' : percentage > 50 ? '💛' : percentage > 30 ? '💙' : '💔';
            response = `${emoji} *Love Calculator*\n\nCompatibility: *${percentage}%*\n\n${percentage > 80 ? 'Perfect match! 🥰' : percentage > 50 ? 'Good potential! 😊' : percentage > 30 ? 'Could work with effort! 🤔' : 'Maybe just friends... 😅'}`;
        } else if (agentActions.group.test(query) && isGroup && ctx.groupMetadata) {
            const gm = ctx.groupMetadata;
            response = `👥 *Group Info*\n\nName: ${gm.subject}\nMembers: ${gm.participants?.length || 'N/A'}\nCreated: ${gm.creation ? new Date(gm.creation * 1000).toLocaleDateString() : 'N/A'}\nDescription: ${gm.desc || 'None'}`;
        } else if (agentActions.search.test(query)) {
            const searchQuery = query.replace(/^(search|google|look\s*up|find\s+(info|about|on))\s*/i, '').trim();
            if (!searchQuery) return reply('❌ What should I search? Try: .agent search Node.js');
            try {
                const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1`, { timeout: 8000 });
                const data = res.data;
                if (data.Abstract) {
                    response = `🔍 *Search: ${searchQuery}*\n\n${data.Abstract}\n\n_Source: ${data.AbstractSource || 'DuckDuckGo'}_`;
                } else if (data.RelatedTopics?.length) {
                    const top3 = data.RelatedTopics.slice(0, 3).filter(t => t.Text).map((t, i) => `${i + 1}. ${t.Text}`).join('\n\n');
                    response = `🔍 *Search: ${searchQuery}*\n\n${top3 || 'No detailed results.'}\n\n_Source: DuckDuckGo_`;
                } else {
                    response = `🔍 *Search: ${searchQuery}*\n\nNo instant results. Try rephrasing your query.`;
                }
            } catch {
                response = `🔍 Search temporarily unavailable. Try again later.`;
            }
        } else if (agentActions.news.test(query)) {
            try {
                const res = await axios.get('https://saurav.tech/NewsAPI/top-headlines/category/technology/us.json', { timeout: 8000 });
                const articles = res.data?.articles?.slice(0, 5) || [];
                if (articles.length) {
                    const newsText = articles.map((a, i) => `*${i + 1}.* ${a.title}\n   _${a.source?.name || 'Unknown'}_`).join('\n\n');
                    response = `📰 *Latest Tech News*\n\n${newsText}`;
                } else {
                    response = '📰 No news available right now.';
                }
            } catch {
                response = '📰 News service temporarily unavailable.';
            }
        } else if (agentActions.weather.test(query)) {
            const city = query.replace(/weather|temperature|forecast|climate|in|at|for/gi, '').trim() || 'Nairobi';
            try {
                const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 8000 });
                const cur = res.data?.current_condition?.[0];
                if (cur) {
                    response = `🌤️ *Weather in ${city}*\n\n🌡️ Temp: *${cur.temp_C}°C* (${cur.temp_F}°F)\n💧 Humidity: ${cur.humidity}%\n🌬️ Wind: ${cur.windspeedKmph} km/h\n☁️ Condition: ${cur.weatherDesc?.[0]?.value || 'N/A'}\n👁️ Visibility: ${cur.visibility} km`;
                } else {
                    response = `❌ Could not find weather for "${city}".`;
                }
            } catch {
                response = `❌ Weather service unavailable.`;
            }
        } else if (agentActions.ip.test(query)) {
            try {
                const res = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
                const d = res.data;
                response = `🌐 *IP Info*\n\nIP: *${d.ip}*\nCity: ${d.city}\nRegion: ${d.region}\nCountry: ${d.country_name}\nISP: ${d.org}\nTimezone: ${d.timezone}`;
            } catch {
                response = '❌ Could not fetch IP information.';
            }
        } else if (agentActions.help.test(query)) {
            const pm = pluginMap();
            response =
                `🤖 *${BOT_IDENTITY.name} Agent — Full Capabilities*\n\n` +
                `📋 *Run Commands* (${pm.size} available)\n` +
                `• "run menu" • "do alive" • "use sticker"\n` +
                `• "run <any command name>"\n\n` +
                `✍️ *Create Content*\n` +
                `• Bio • Welcome/Goodbye messages\n` +
                `• Announcements • Group rules\n` +
                `• Poems • Stories • Songs • Raps\n` +
                `• Jokes • Quotes • Captions\n` +
                `• Letters • Emails • Essays\n\n` +
                `🌐 *Web Access*\n` +
                `• Search • News • Weather • IP lookup\n\n` +
                `ℹ️ *Bot Knowledge*\n` +
                `• About bot • Platform info • Owner\n` +
                `• Features • Settings • Sudo users\n\n` +
                `🛠️ *Tools*\n` +
                `• Calculator • Password • Color gen\n` +
                `• Coin flip • Dice • Love calc\n\n` +
                `🧠 *AI Chat*\n` +
                `• Ask anything — powered by AI\n\n` +
                `_Platform: ${BOT_IDENTITY.platform} | ${BOT_IDENTITY.language} ${process.version}_`;
        } else {
            const cmdMatch = query.match(/^\.?(\w+)$/);
            if (cmdMatch) {
                const pm = pluginMap();
                const potentialCmd = cmdMatch[1].toLowerCase();
                if (pm.has(potentialCmd)) {
                    const plugin = pm.get(potentialCmd);
                    if (plugin.permission === 'owner' && !isOwner) {
                        return reply(`⛔ \`${potentialCmd}\` requires owner permission.`);
                    }
                    if (plugin.permission === 'admin' && !isAdmin && !isOwner) {
                        return reply(`⛔ \`${potentialCmd}\` requires admin permission.`);
                    }
                    try { await plugin.run(sock, message, [], ctx); return; } catch (err) {
                        return reply(`❌ Error running \`${potentialCmd}\`: ${err.message}`);
                    }
                }
            }

            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
                if (apiKey) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
                    const systemPrompt =
                        `You are ${BOT_IDENTITY.name} v${BOT_IDENTITY.version}, an intelligent WhatsApp bot assistant. ` +
                        `You were created by ${BOT_IDENTITY.developer} (${config.OWNER_NAME}). ` +
                        `You run on ${BOT_IDENTITY.platform} using ${BOT_IDENTITY.language} and the ${BOT_IDENTITY.library} library. ` +
                        `You have ${pluginMap().size}+ commands and ${BOT_IDENTITY.features.length} smart features. ` +
                        `Your website is ${BOT_IDENTITY.website} and repo is ${BOT_IDENTITY.repo}. ` +
                        `Be concise, friendly, and helpful. Use simple formatting suitable for WhatsApp.`;
                    const result = await model.generateContent(`${systemPrompt}\n\nUser says: ${query}`);
                    response = `🤖 *Silva Agent*\n\n${result.response.text()}`;
                } else {
                    try {
                        const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&owner=Silva+MD&botname=Silva+Agent`, { timeout: 10000 });
                        response = `🤖 *Silva Agent*\n\n${res.data?.response || 'I understood your request.'}`;
                    } catch {
                        response = `🤖 *Silva Agent*\n\nI received: "${query}"\n\n_For better AI responses, set a GEMINI_API_KEY._`;
                    }
                }
            } catch {
                response = `🤖 *Silva Agent*\n\nI received: "${query}"\n\n_Try asking about time, math, jokes, or type ".agent help" for capabilities._`;
            }
        }

        if (response) await safeSend({ text: response }, { quoted: message });
    }
};
