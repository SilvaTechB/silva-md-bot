'use strict';
const config = require('../config');
const axios = require('axios');

module.exports = {
    commands: ['agent', 'do', 'silva', 'assistant', 'ask'],
    description: 'AI Agent - Tell Silva what to do and it will try to execute it',
    permission: 'public',
    run: async (sock, message, args, ctx) => {
        const { jid, reply, safeSend, isOwner, isGroup, isAdmin } = ctx;
        const query = args.join(' ').trim();
        if (!query) return reply('🤖 *Silva Agent*\n\nTell me what to do!\n\nExample:\n• .agent what time is it\n• .agent tell a joke\n• .agent translate hello to spanish\n• .agent calculate 25 * 4\n• .agent weather in Nairobi');

        const agentActions = {
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
            help: /help|commands|menu|what\s*can\s*you/i,
            owner: /who\s*(is\s*)?(the\s*)?(owner|creator|developer|made)/i,
            group: /group\s*(info|details|members|count)/i,
        };

        let response = '';

        if (agentActions.time.test(query)) {
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
                "Why don't skeletons fight each other? They don't have the guts! 💀😂",
                "What do you call cheese that isn't yours? Nacho cheese! 🧀😂",
                "How do you organize a space party? You planet! 🪐😂",
                "Why did the bicycle fall over? It was two-tired! 🚲😂",
                "What do you call a dog that does magic? A Labracadabrador! 🐕😂"
            ];
            response = `😂 *Joke Time*\n\n${jokes[Math.floor(Math.random() * jokes.length)]}`;
        } else if (agentActions.fact.test(query)) {
            const facts = [
                "Honey never spoils. Archaeologists found 3000-year-old honey in Egyptian tombs that was still edible! 🍯",
                "Octopuses have three hearts and blue blood. 🐙",
                "A group of flamingos is called a 'flamboyance'. 🦩",
                "The shortest war in history lasted 38 minutes (Anglo-Zanzibar War, 1896). ⚔️",
                "Bananas are berries, but strawberries aren't. 🍌",
                "Venus is the only planet that spins clockwise. 🪐",
                "A bolt of lightning is five times hotter than the surface of the sun. ⚡",
                "The Eiffel Tower can grow up to 6 inches in summer due to heat expansion. 🗼",
                "Cows have best friends and get stressed when separated. 🐄",
                "There are more possible iterations of a game of chess than atoms in the observable universe. ♟️",
                "The human brain uses 20% of the body's total energy. 🧠",
                "Polar bears' skin is black under their white fur. 🐻‍❄️",
                "The first oranges weren't orange — they were green! 🍊",
                "A cloud can weigh more than a million pounds. ☁️",
                "Your nose can remember 50,000 different scents. 👃"
            ];
            response = `🧠 *Fun Fact*\n\n${facts[Math.floor(Math.random() * facts.length)]}`;
        } else if (agentActions.quote.test(query)) {
            const quotes = [
                { text: "The only way to do great work is to love what you do.", author: "Steve Jobs" },
                { text: "Innovation distinguishes between a leader and a follower.", author: "Steve Jobs" },
                { text: "Life is what happens when you're busy making other plans.", author: "John Lennon" },
                { text: "The future belongs to those who believe in the beauty of their dreams.", author: "Eleanor Roosevelt" },
                { text: "It is during our darkest moments that we must focus to see the light.", author: "Aristotle" },
                { text: "In the middle of every difficulty lies opportunity.", author: "Albert Einstein" },
                { text: "Success is not final, failure is not fatal: it is the courage to continue that counts.", author: "Winston Churchill" },
                { text: "Be yourself; everyone else is already taken.", author: "Oscar Wilde" },
                { text: "Two things are infinite: the universe and human stupidity; and I'm not sure about the universe.", author: "Albert Einstein" },
                { text: "The only impossible journey is the one you never begin.", author: "Tony Robbins" },
                { text: "Education is the most powerful weapon which you can use to change the world.", author: "Nelson Mandela" },
                { text: "Not everything that is faced can be changed, but nothing can be changed until it is faced.", author: "James Baldwin" }
            ];
            const q = quotes[Math.floor(Math.random() * quotes.length)];
            response = `💫 *Inspirational Quote*\n\n_"${q.text}"_\n\n— *${q.author}*`;
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
        } else if (agentActions.uptime.test(query)) {
            const uptime = process.uptime();
            const h = Math.floor(uptime / 3600);
            const m = Math.floor((uptime % 3600) / 60);
            const s = Math.floor(uptime % 60);
            response = `⏱️ *Bot Status*\n\nUptime: *${h}h ${m}m ${s}s*\nBot: ${config.BOT_NAME}\nMode: ${config.MODE}\nPrefix: ${config.PREFIX}`;
        } else if (agentActions.owner.test(query)) {
            response = `👑 *Bot Owner*\n\nName: ${config.OWNER_NAME}\nNumber: ${config.OWNER_NUMBER}\nBot: ${config.BOT_NAME}`;
        } else if (agentActions.love.test(query)) {
            const percentage = Math.floor(Math.random() * 101);
            let emoji = percentage > 80 ? '💕' : percentage > 50 ? '💛' : percentage > 30 ? '💙' : '💔';
            response = `${emoji} *Love Calculator*\n\nCompatibility: *${percentage}%*\n\n${percentage > 80 ? 'Perfect match! 🥰' : percentage > 50 ? 'Good potential! 😊' : percentage > 30 ? 'Could work with effort! 🤔' : 'Maybe just friends... 😅'}`;
        } else if (agentActions.color.test(query)) {
            const r = Math.floor(Math.random() * 256);
            const g = Math.floor(Math.random() * 256);
            const b = Math.floor(Math.random() * 256);
            const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
            response = `🎨 *Random Color*\n\nHEX: *${hex}*\nRGB: *rgb(${r}, ${g}, ${b})*`;
        } else if (agentActions.group.test(query) && isGroup && ctx.groupMetadata) {
            const gm = ctx.groupMetadata;
            response = `👥 *Group Info*\n\nName: ${gm.subject}\nMembers: ${gm.participants?.length || 'N/A'}\nCreated: ${gm.creation ? new Date(gm.creation * 1000).toLocaleDateString() : 'N/A'}\nDescription: ${gm.desc || 'None'}`;
        } else if (agentActions.help.test(query)) {
            response = `🤖 *Silva Agent Help*\n\nI can help you with:\n\n• *Time/Date* — "what time is it"\n• *Math* — "calculate 25 * 4"\n• *Jokes* — "tell me a joke"\n• *Facts* — "tell me a fact"\n• *Quotes* — "give me a quote"\n• *Coin Flip* — "flip a coin"\n• *Dice Roll* — "roll a dice"\n• *Password* — "generate password"\n• *Love Calc* — "love calculator"\n• *Color* — "random color"\n• *Group Info* — "group info"\n• *General AI* — ask anything else!\n\nJust type: .agent <your question>`;
        } else {
            try {
                const { GoogleGenerativeAI } = require('@google/generative-ai');
                const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
                if (apiKey) {
                    const genAI = new GoogleGenerativeAI(apiKey);
                    const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
                    const result = await model.generateContent(`You are Silva MD, a helpful WhatsApp bot assistant. Be concise, friendly, and helpful. User says: ${query}`);
                    const text = result.response.text();
                    response = `🤖 *Silva Agent*\n\n${text}`;
                } else {
                    try {
                        const res = await axios.get(`https://api.popcat.xyz/chatbot?msg=${encodeURIComponent(query)}&owner=Silva+MD&botname=Silva+Agent`, { timeout: 10000 });
                        response = `🤖 *Silva Agent*\n\n${res.data?.response || 'I understood your request. Let me think about that...'}`;
                    } catch {
                        response = `🤖 *Silva Agent*\n\nI received your request: "${query}"\n\n_Processing with built-in intelligence..._\n\nFor better AI responses, the bot owner can set a GEMINI_API_KEY.`;
                    }
                }
            } catch (err) {
                response = `🤖 *Silva Agent*\n\nI received your request: "${query}"\n\n_I'll do my best to help! Try asking about time, math, jokes, facts, or quotes._`;
            }
        }

        await safeSend({ text: response }, { quoted: message });
    }
};
