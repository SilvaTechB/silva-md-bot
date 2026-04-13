'use strict';
const config = require('../config');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

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

const agentActions = {
    run_command: /^(run|execute|do|use|try)\s+(\.?\w+)/i,
    menu: /^(show\s+)?(menu|commands|help|list\s+commands)/i,
    time: /what\s*(time|hour|clock)|current\s*time|time\s*now/i,
    date: /what\s*(date|day|today)|current\s*date|today/i,
    calc: /calc|compute|math|solve|\d+\s*[\+\-\*\/\%\^]\s*\d+/i,
    joke: /joke|funny|laugh|humor/i,
    fact: /fact|did\s*you\s*know|interesting/i,
    quote: /quote|motivat|inspir/i,
    flip: /flip\s*(a\s*)?coin|coin\s*flip|heads\s*or\s*tails/i,
    roll: /roll\s*(a\s*)?dice|dice\s*roll|random\s*number/i,
    translate: /translat/i,
    define: /define|meaning\s*of|what\s*(is|does)\s*\w+\s*mean/i,
    weather: /weather|temperature|forecast|climate/i,
    wiki: /wiki|who\s*(is|was)|what\s*(is|are|was|were)/i,
    love: /love\s*calc|love\s*meter|compatib/i,
    password: /password|pass\s*gen|random\s*pass/i,
    color: /color|colour|hex|rgb/i,
    uptime: /uptime|running|alive|status/i,
    search: /search|google|look\s*up|find\s+(info|about|on)/i,
    news: /news|headlines|latest\s+news|breaking/i,
    ip: /ip\s*(info|address|lookup|check)|my\s*ip|what.*ip/i,
    owner: /who\s*(is\s*)?(the\s*)?(owner|creator|developer|made)/i,
    group: /group\s*(info|details|members|count)/i,
    plugin_list: /list\s*plugins|how\s*many\s*(commands|plugins)|plugin\s*count/i,
    help: /^help$|what\s*can\s*you\s*do|your\s*capabilities/i,
};

module.exports = {
    commands: ['agent', 'do', 'silva', 'assistant', 'ask'],
    description: 'AI Agent - Tell Silva what to do. Can run any bot command, search the web, and answer questions',
    permission: 'public',
    run: async (sock, message, args, ctx) => {
        const { jid, reply, safeSend, isOwner, isGroup, isAdmin } = ctx;
        const query = args.join(' ').trim();
        if (!query) return reply(
            '🤖 *Silva Agent*\n\n' +
            'Tell me what to do! I can:\n\n' +
            '• *Run any command* — "run menu", "do sticker", "use alive"\n' +
            '• *Search the web* — "search Node.js tutorials"\n' +
            '• *Get news* — "latest news"\n' +
            '• *Time/Date* — "what time is it"\n' +
            '• *Math* — "calculate 25 * 4"\n' +
            '• *Jokes/Facts/Quotes* — "tell a joke"\n' +
            '• *Weather* — "weather in Nairobi"\n' +
            '• *General AI* — ask anything!\n\n' +
            'Example: .agent run menu\nExample: .agent search WhatsApp bot'
        );

        let response = '';

        const runMatch = query.match(agentActions.run_command);
        if (runMatch) {
            const cmdName = runMatch[2].replace(/^\./, '').toLowerCase();
            const restArgs = query.replace(runMatch[0], '').trim().split(/\s+/).filter(Boolean);
            const pm = pluginMap();
            const plugin = pm.get(cmdName);

            if (!plugin) {
                return reply(`❌ Command \`${cmdName}\` not found.\n\nI have ${pm.size} commands available. Try: .agent list plugins`);
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

        if (agentActions.menu.test(query)) {
            const pm = pluginMap();
            const menuPlugin = pm.get('menu');
            if (menuPlugin) {
                try {
                    await menuPlugin.run(sock, message, [], ctx);
                    return;
                } catch {}
            }
            return reply(`📋 I have ${pm.size} commands available. Type .menu to see them all.`);
        }

        if (agentActions.plugin_list.test(query)) {
            const pm = pluginMap();
            const categories = {};
            for (const [cmd, p] of pm) {
                const cat = p.description?.split(' ')[0] || 'Other';
                if (!categories[cat]) categories[cat] = [];
                categories[cat].push(cmd);
            }
            response = `📋 *Plugin Stats*\n\n• Total commands: *${pm.size}*\n• Plugin files: *${new Set([...pm.values()]).size}*\n\nType \`.menu\` for the full categorized list.`;
        }

        else if (agentActions.time.test(query)) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('en-US', { timeZone: 'Africa/Nairobi', hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true });
            response = `🕐 *Current Time*\n\n${timeStr} (EAT)`;
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
                    "I told my wife she was drawing her eyebrows too high. She looked surprised. 😂",
                    "Why don't eggs tell jokes? They'd crack each other up! 🥚😂",
                    "What do you call a fake noodle? An impasta! 🍝😂",
                    "Why did the scarecrow win an award? He was outstanding in his field! 🌾😂",
                    "I'm reading a book about anti-gravity. It's impossible to put down! 📚😂",
                    "What do you call a bear with no teeth? A gummy bear! 🐻😂",
                    "Why did the coffee file a police report? It got mugged! ☕😂",
                    "What do you call a sleeping dinosaur? A dino-snore! 🦕😂",
                    "I used to hate facial hair, but then it grew on me. 🧔😂",
                ];
                response = `😂 *Joke Time*\n\n${jokes[Math.floor(Math.random() * jokes.length)]}`;
            }
        } else if (agentActions.fact.test(query)) {
            try {
                const res = await axios.get('https://uselessfacts.jsph.pl/random.json?language=en', { timeout: 5000 });
                response = `🧠 *Fun Fact*\n\n${res.data.text}`;
            } catch {
                const facts = [
                    "Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible! 🍯",
                    "Octopuses have three hearts and blue blood. 🐙",
                    "A group of flamingos is called a 'flamboyance'. 🦩",
                    "Bananas are berries, but strawberries aren't. 🍌",
                    "Venus is the only planet that spins clockwise. 🪐",
                    "A bolt of lightning is five times hotter than the surface of the sun. ⚡",
                    "Cows have best friends and get stressed when separated. 🐄",
                    "The human brain uses 20% of the body's total energy. 🧠",
                    "Polar bears' skin is black under their white fur. 🐻‍❄️",
                    "A cloud can weigh more than a million pounds. ☁️",
                ];
                response = `🧠 *Fun Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}`;
            }
        } else if (agentActions.quote.test(query)) {
            try {
                const res = await axios.get('https://api.quotable.io/random', { timeout: 5000 });
                response = `💫 *Inspirational Quote*\n\n_"${res.data.content}"_\n\n— *${res.data.author}*`;
            } catch {
                const quotes = [
                    { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                    { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
                    { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
                    { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                    { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
                    { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                    { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
                    { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
                ];
                const q = quotes[Math.floor(Math.random() * quotes.length)];
                response = `💫 *Inspirational Quote*\n\n_"${q.text}"_\n\n— *${q.author}*`;
            }
        } else if (agentActions.flip.test(query)) {
            const result = Math.random() < 0.5 ? 'Heads 🪙' : 'Tails 🪙';
            response = `🪙 *Coin Flip*\n\nResult: *${result}*`;
        } else if (agentActions.roll.test(query)) {
            const sides = parseInt(query.match(/\d+/)?.[0]) || 6;
            const result = Math.floor(Math.random() * sides) + 1;
            response = `🎲 *Dice Roll* (${sides}-sided)\n\nResult: *${result}*`;
        } else if (agentActions.password.test(query)) {
            const len = parseInt(query.match(/\d+/)?.[0]) || 16;
            const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
            let pass = '';
            for (let i = 0; i < Math.min(len, 64); i++) pass += chars[Math.floor(Math.random() * chars.length)];
            response = `🔐 *Password Generator*\n\nLength: ${Math.min(len, 64)}\nPassword: \`${pass}\`\n\n_Copy and store safely!_`;
        } else if (agentActions.color.test(query)) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            response = `🎨 *Random Color*\n\nHEX: *${hex}*\nRGB: *rgb(${r}, ${g}, ${b})*`;
        } else if (agentActions.uptime.test(query)) {
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);
            response = `⏱️ *Bot Status*\n\nUptime: *${h}h ${m}m ${s}s*\nBot: ${config.BOT_NAME}\nMode: ${config.MODE}\nPrefix: ${config.PREFIX}\nPlugins: ${pluginMap().size} commands`;
        } else if (agentActions.owner.test(query)) {
            response = `👑 *Bot Owner*\n\nName: ${config.OWNER_NAME}\nNumber: ${config.OWNER_NUMBER}\nBot: ${config.BOT_NAME}`;
        } else if (agentActions.love.test(query)) {
            const percentage = Math.floor(Math.random() * 101);
            let emoji = percentage > 80 ? '💕' : percentage > 50 ? '💛' : percentage > 30 ? '💙' : '💔';
            response = `${emoji} *Love Calculator*\n\nCompatibility: *${percentage}%*\n\n${percentage > 80 ? 'Perfect match! 🥰' : percentage > 50 ? 'Good potential! 😊' : percentage > 30 ? 'Could work with effort! 🤔' : 'Maybe just friends... 😅'}`;
        } else if (agentActions.group.test(query) && isGroup && ctx.groupMetadata) {
            const gm = ctx.groupMetadata;
            response = `👥 *Group Info*\n\nName: ${gm.subject}\nMembers: ${gm.participants?.length || 'N/A'}\nCreated: ${gm.creation ? new Date(gm.creation * 1000).toLocaleDateString() : 'N/A'}\nDescription: ${gm.desc || 'None'}`;
        } else if (agentActions.search.test(query)) {
            const searchQuery = query.replace(/^(search|google|look\s*up|find\s+(info|about|on))\s*/i, '').trim();
            if (!searchQuery) return reply('❌ What would you like me to search? Try: .agent search Node.js');
            try {
                const res = await axios.get(`https://api.duckduckgo.com/?q=${encodeURIComponent(searchQuery)}&format=json&no_html=1`, { timeout: 8000 });
                const data = res.data;
                if (data.Abstract) {
                    response = `🔍 *Search: ${searchQuery}*\n\n${data.Abstract}\n\n_Source: ${data.AbstractSource || 'DuckDuckGo'}_`;
                } else if (data.RelatedTopics?.length) {
                    const top3 = data.RelatedTopics.slice(0, 3).filter(t => t.Text).map((t, i) => `${i + 1}. ${t.Text}`).join('\n\n');
                    response = `🔍 *Search: ${searchQuery}*\n\n${top3 || 'No detailed results found.'}\n\n_Source: DuckDuckGo_`;
                } else {
                    response = `🔍 *Search: ${searchQuery}*\n\nNo instant results found. Try rephrasing your query or be more specific.`;
                }
            } catch {
                response = `🔍 *Search: ${searchQuery}*\n\nSearch is temporarily unavailable. Try again later.`;
            }
        } else if (agentActions.news.test(query)) {
            try {
                const res = await axios.get('https://saurav.tech/NewsAPI/top-headlines/category/technology/us.json', { timeout: 8000 });
                const articles = res.data?.articles?.slice(0, 5) || [];
                if (articles.length) {
                    const newsText = articles.map((a, i) => `*${i + 1}.* ${a.title}\n   _${a.source?.name || 'Unknown'}_`).join('\n\n');
                    response = `📰 *Latest Tech News*\n\n${newsText}`;
                } else {
                    response = '📰 No news articles available right now.';
                }
            } catch {
                response = '📰 News service is temporarily unavailable.';
            }
        } else if (agentActions.weather.test(query)) {
            const city = query.replace(/weather|temperature|forecast|climate|in|at|for/gi, '').trim() || 'Nairobi';
            try {
                const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`, { timeout: 8000 });
                const cur = res.data?.current_condition?.[0];
                if (cur) {
                    response = `🌤️ *Weather in ${city}*\n\n🌡️ Temp: *${cur.temp_C}°C* (${cur.temp_F}°F)\n💧 Humidity: ${cur.humidity}%\n🌬️ Wind: ${cur.windspeedKmph} km/h\n☁️ Condition: ${cur.weatherDesc?.[0]?.value || 'N/A'}\n👁️ Visibility: ${cur.visibility} km`;
                } else {
                    response = `❌ Could not find weather for "${city}". Try a different city name.`;
                }
            } catch {
                response = `❌ Weather service unavailable. Try again later.`;
            }
        } else if (agentActions.ip.test(query)) {
            try {
                const res = await axios.get('https://ipapi.co/json/', { timeout: 5000 });
                const d = res.data;
                response = `🌐 *IP Information*\n\nIP: *${d.ip}*\nCity: ${d.city}\nRegion: ${d.region}\nCountry: ${d.country_name}\nISP: ${d.org}\nTimezone: ${d.timezone}`;
            } catch {
                response = '❌ Could not fetch IP information.';
            }
        } else if (agentActions.help.test(query)) {
            const pm = pluginMap();
            response = `🤖 *Silva Agent — Full Capabilities*\n\n` +
                `📋 *Run Bot Commands*\n` +
                `• "run menu" — show the bot menu\n` +
                `• "run sticker" — make a sticker\n` +
                `• "run alive" — check bot status\n` +
                `• "run <any command>" — execute any of ${pm.size} commands\n\n` +
                `🌐 *Web Access*\n` +
                `• "search <query>" — search the web\n` +
                `• "news" — get latest headlines\n` +
                `• "weather in <city>" — weather info\n` +
                `• "ip info" — IP lookup\n\n` +
                `🛠️ *Built-in Tools*\n` +
                `• Time/Date • Calculator • Jokes\n` +
                `• Facts • Quotes • Coin Flip\n` +
                `• Dice Roll • Password Gen • Colors\n` +
                `• Love Calc • Group Info • Uptime\n\n` +
                `🧠 *AI Chat*\n` +
                `• Ask anything else — powered by AI\n\n` +
                `_Type: .agent <your request>_`;
        } else {
            const cmdMatch = query.match(/^\.?(\w+)$/);
            if (cmdMatch) {
                const pm = pluginMap();
                const potentialCmd = cmdMatch[1].toLowerCase();
                if (pm.has(potentialCmd)) {
                    const plugin = pm.get(potentialCmd);
                    if (plugin.permission === 'owner' && !isOwner) {
                        return reply(`⛔ The \`${potentialCmd}\` command requires owner permission.`);
                    }
                    if (plugin.permission === 'admin' && !isAdmin && !isOwner) {
                        return reply(`⛔ The \`${potentialCmd}\` command requires admin permission.`);
                    }
                    try {
                        await plugin.run(sock, message, [], ctx);
                        return;
                    } catch (err) {
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
                    const result = await model.generateContent(
                        `You are Silva MD, an intelligent WhatsApp bot assistant made by SilvaTech. ` +
                        `Be concise, friendly, and helpful. Use simple formatting. ` +
                        `User says: ${query}`
                    );
                    const text = result.response.text();
                    response = `🤖 *Silva Agent*\n\n${text}`;
                } else {
                    try {
                        const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&owner=Silva+MD&botname=Silva+Agent`, { timeout: 10000 });
                        response = `🤖 *Silva Agent*\n\n${res.data?.response || 'I understood your request. Let me think about that...'}`;
                    } catch {
                        response = `🤖 *Silva Agent*\n\nI received your request: "${query}"\n\n_For better AI responses, the bot owner can set a GEMINI_API_KEY._`;
                    }
                }
            } catch (err) {
                response = `🤖 *Silva Agent*\n\nI received your request: "${query}"\n\n_I'll do my best to help! Try asking about time, math, jokes, facts, or quotes._`;
            }
        }

        if (response) await safeSend({ text: response }, { quoted: message });
    }
};
