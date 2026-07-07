'use strict';
const fs = require('fs');

let src = fs.readFileSync('plugins/silva-agent.js', 'utf8');

// ── 1. Replace askFreeAI with parallel version ─────────────────────────────
const newAskFreeAI = `// ── Free AI APIs: parallel race — ch.at primary, all backends race, first wins ──
async function askFreeAI(query, jid, systemPrompt) {
    const contextPrompt = jid ? buildContextPrompt(jid, query) : query;
    const fullPrompt    = systemPrompt
        ? systemPrompt + '\n\nUser: ' + contextPrompt
        : contextPrompt;

    const tryOne = async (fn) => {
        const r = await fn();
        if (r && String(r).trim().length > 2) return String(r).trim();
        throw new Error('empty');
    };

    try {
        return await Promise.any([
            tryOne(async () => {
                const res = await axios.post('https://ch.at/api/chat',
                    { message: fullPrompt },
                    { headers: { 'Content-Type': 'application/json', 'User-Agent': 'SilvaMD-Bot/2.0' }, timeout: 10000 }
                );
                return res.data?.reply || res.data?.message || res.data?.response || res.data?.result || res.data?.text || null;
            }),
            tryOne(async () => {
                const res = await axios.get('https://api.paxsenix.biz.id/ai/gpt4o?text=' + encodeURIComponent(fullPrompt), { timeout: 10000 });
                return res.data?.message || res.data?.result || null;
            }),
            tryOne(async () => {
                const res = await axios.get('https://api.siputzx.my.id/api/ai/deepseek-r1?content=' + encodeURIComponent(fullPrompt), { timeout: 10000 });
                return res.data?.data || null;
            }),
            tryOne(async () => {
                const res = await axios.get('https://api.popcat.xyz/chatbot?msg=' + encodeURIComponent(query) + '&owner=' + encodeURIComponent(config.OWNER_NAME || 'Silva') + '&botname=Silva', { timeout: 8000 });
                return res.data?.response || null;
            }),
            tryOne(async () => {
                const res = await axios.get('https://api.paxsenix.biz.id/ai/claude?text=' + encodeURIComponent(fullPrompt), { timeout: 10000 });
                return res.data?.message || res.data?.result || null;
            }),
            tryOne(async () => {
                const res = await axios.get('https://vapis.my.id/api/openai?q=' + encodeURIComponent(fullPrompt), { timeout: 10000 });
                return res.data?.message || res.data?.result || res.data?.response || null;
            }),
            tryOne(async () => {
                const res = await axios.get('https://lance-frank-asta.onrender.com/api/gpt?q=' + encodeURIComponent(fullPrompt), { timeout: 10000 });
                return res.data?.message || res.data?.result || null;
            }),
        ]);
    } catch {
        return null;
    }
}`;

const askStart = src.indexOf('// \u2500\u2500 Free AI APIs (ch.at primary');
const askEnd   = src.indexOf('\nconst agentActions');
if (askStart === -1) { console.error('askFreeAI start not found'); process.exit(1); }
if (askEnd   === -1) { console.error('agentActions not found');    process.exit(1); }
src = src.slice(0, askStart) + newAskFreeAI + '\n\n' + src.slice(askEnd + 1);
console.log('✅ askFreeAI replaced (parallel)');

// ── 2. Replace the entire else block (agent fallback) ──────────────────────
const elseStart = src.indexOf('        } else {\n            // \u2500\u2500 Step 1: Send query to ch.at first');
if (elseStart === -1) { console.error('else block start not found'); process.exit(1); }

// Find the matching closing brace for this else block by counting braces
let depth = 0, i = elseStart + 8; // skip 8 chars to get past "        "
let blockStart = src.indexOf('{', i);
depth = 1;
let pos = blockStart + 1;
while (pos < src.length && depth > 0) {
    if (src[pos] === '{') depth++;
    else if (src[pos] === '}') depth--;
    pos++;
}
const elseEnd = pos; // pos is right after the closing }

const newElse = `        } else {
            // ── Natural language: intent map first (instant), then AI races in parallel ──
            const pm = pluginMap();

            // Step 1: fast regex intent matching
            const intent = findIntent(query);
            if (intent) {
                const plugin = pm.get(intent.cmd);
                if (plugin) {
                    if (plugin.permission === 'owner' && !isOwner)
                        return reply('\\u26d4 That action requires owner permission.');
                    if (plugin.permission === 'admin' && !isAdmin && !isOwner)
                        return reply('\\u26d4 That action requires admin permission.');
                    const argDisplay = intent.pluginArgs.length ? ' *"' + intent.pluginArgs.join(' ') + '"*' : '';
                    await safeSend({ text: intent.label + argDisplay + '...' }, { quoted: message });
                    try {
                        await plugin.run(sock, message, intent.pluginArgs, ctx);
                    } catch (err) {
                        await safeSend({ text: '\\u274c Failed: ' + (err.message || 'Something went wrong.') }, { quoted: message });
                    }
                    return;
                }
            }

            // Step 2: bare single word — try as direct command
            const cmdMatch = query.match(/^\\.?(\\w+)$/);
            if (cmdMatch) {
                const potentialCmd = cmdMatch[1].toLowerCase();
                if (pm.has(potentialCmd)) {
                    const plugin = pm.get(potentialCmd);
                    if (plugin.permission === 'owner' && !isOwner)
                        return reply('\\u26d4 \`' + potentialCmd + '\` requires owner permission.');
                    if (plugin.permission === 'admin' && !isAdmin && !isOwner)
                        return reply('\\u26d4 \`' + potentialCmd + '\` requires admin permission.');
                    try { await plugin.run(sock, message, [], ctx); return; } catch (err) {
                        return reply('\\u274c Error running \`' + potentialCmd + '\`: ' + err.message);
                    }
                }
            }

            // Step 3: instant smart local responses (no API)
            const smart = getSmartResponse(query);
            if (smart) {
                response = '\\ud83e\\udd16 *Silva*\\n\\n' + smart;
                rememberMessage(jid, 'user', query);
                rememberMessage(jid, 'bot', smart);
            } else {
                // Step 4: AI — all backends race in parallel, first response wins
                rememberMessage(jid, 'user', query);
                await sock.sendPresenceUpdate('composing', jid);

                const toolList = [...pm.keys()].slice(0, 80).join(', ');
                const systemPrompt =
                    'You are Silva, an intelligent WhatsApp bot assistant. ' +
                    'Owner: ' + (config.OWNER_NAME || 'Silva') + '. Bot: ' + (config.BOT_NAME || 'Silva MD') + '. ' +
                    'Available commands: ' + toolList + '.\\n' +
                    'If the user request should run a bot command, reply with ONLY: TOOL:<command>|<args>\\n' +
                    'Examples: TOOL:play|Shape of You  or  TOOL:weather|Nairobi  or  TOOL:wiki|black holes\\n' +
                    'Otherwise answer naturally and concisely for WhatsApp. Use *bold* for emphasis. Max 200 words.';

                let aiReply = await askFreeAI(query, jid, systemPrompt);

                // Gemini fallback if all free APIs failed
                if (!aiReply) {
                    try {
                        const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_AI_KEY || '';
                        if (apiKey) {
                            const { GoogleGenerativeAI } = require('@google/generative-ai');
                            const genAI = new GoogleGenerativeAI(apiKey);
                            const model = genAI.getGenerativeModel({
                                model: 'gemini-1.5-flash',
                                generationConfig: { temperature: 0.85, maxOutputTokens: 800 },
                            });
                            const mem = getMemory(jid).slice(-6);
                            const geminiHistory = [
                                { role: 'user',  parts: [{ text: systemPrompt }] },
                                { role: 'model', parts: [{ text: 'Got it! I am Silva, ready to help.' }] },
                                ...mem.slice(0, -1).map(m => ({
                                    role: m.role === 'user' ? 'user' : 'model',
                                    parts: [{ text: m.text }],
                                })),
                            ];
                            const chat = model.startChat({ history: geminiHistory });
                            const result = await chat.sendMessage(query);
                            aiReply = result.response.text();
                        }
                    } catch { /* Gemini unavailable */ }
                }

                if (aiReply) {
                    // Check if AI decided to run a tool
                    if (/^TOOL:/i.test(aiReply.trim())) {
                        const toolLine = aiReply.trim().replace(/^TOOL:/i, '').split('\\n')[0].trim();
                        const pipeIdx  = toolLine.indexOf('|');
                        const cmdName  = (pipeIdx >= 0 ? toolLine.slice(0, pipeIdx) : toolLine).trim().toLowerCase();
                        const argStr   = pipeIdx >= 0 ? toolLine.slice(pipeIdx + 1).trim() : '';
                        const toolArgs = argStr ? argStr.split(/\\s+/).filter(Boolean) : [];
                        const plugin   = pm.get(cmdName);

                        if (plugin) {
                            if (plugin.permission === 'owner' && !isOwner)
                                return reply('\\u26d4 That action requires owner permission.');
                            if (plugin.permission === 'admin' && !isAdmin && !isOwner)
                                return reply('\\u26d4 That action requires admin permission.');
                            const argDisplay = toolArgs.length ? ' *"' + toolArgs.join(' ') + '"*' : '';
                            await safeSend({ text: '\\ud83d\\udd27 _' + cmdName + argDisplay + '..._' }, { quoted: message });
                            try {
                                await plugin.run(sock, message, toolArgs, ctx);
                            } catch (err) {
                                await safeSend({ text: '\\u274c Failed: ' + (err.message || 'Something went wrong.') }, { quoted: message });
                            }
                            return;
                        }
                    }
                    // Conversational AI response
                    response = '\\ud83e\\udd16 *Silva*\\n\\n' + aiReply;
                    rememberMessage(jid, 'bot', aiReply.slice(0, 300));
                }
            }
        }`;

src = src.slice(0, elseStart) + newElse + src.slice(elseEnd);
console.log('✅ else block replaced');

fs.writeFileSync('plugins/silva-agent.js', src, 'utf8');
console.log('✅ File written, length:', src.length);
