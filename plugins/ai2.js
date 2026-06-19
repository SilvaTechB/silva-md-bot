'use strict';

const axios = require('axios');
const { fmt } = require('../lib/theme');

const AI_ENDPOINTS = {
    chatat:   [], // ch.at uses POST — handled separately in queryChatAt()
    chatai:   [
        q => `https://api.siputzx.my.id/api/ai/chatgpt?content=${encodeURIComponent(q)}`,
        q => `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`
    ],
    gemini:   [
        q => `https://api.siputzx.my.id/api/ai/gemini-pro?content=${encodeURIComponent(q)}`,
        q => `https://api.ryzendesu.vip/api/ai/gemini?text=${encodeURIComponent(q)}`
    ],
    giftedai: [
        q => `https://giftedtech.my.id/api/ai/gpt4o?query=${encodeURIComponent(q)}&apikey=gifted`
    ],
    gpt4:     [
        q => `https://api.siputzx.my.id/api/ai/gpt4?content=${encodeURIComponent(q)}`,
        q => `https://api.ryzendesu.vip/api/ai/chatgpt?text=${encodeURIComponent(q)}`
    ],
    venice:   [
        q => `https://api.ryzendesu.vip/api/ai/meta-llama?text=${encodeURIComponent(q)}`
    ],
    letmegpt: [
        q => `https://letmegpt.com/api?q=${encodeURIComponent(q)}`
    ]
};

async function queryChatAt(query) {
    try {
        const res = await axios.post('https://ch.at/api/chat',
            { message: query },
            { headers: { 'Content-Type': 'application/json', 'User-Agent': 'SilvaMD-Bot/2.0' }, timeout: 20000 }
        );
        const d = res.data;
        const answer = d?.reply || d?.message || d?.response || d?.result || d?.text ||
                       (typeof d === 'string' ? d : null);
        if (answer && typeof answer === 'string' && answer.trim().length > 2) return answer.trim();
    } catch {}
    return null;
}

async function queryAI(endpoints, query) {
    for (const buildUrl of endpoints) {
        try {
            const res = await axios.get(buildUrl(query), { timeout: 20000 });
            const d = res.data;
            const answer =
                d?.result || d?.message || d?.response || d?.answer ||
                d?.data?.result || d?.data?.message || d?.data?.answer ||
                (typeof d === 'string' ? d : null);
            if (answer && typeof answer === 'string' && answer.trim().length > 2) return answer.trim();
        } catch {}
    }
    return null;
}

function buildPlugin(cmds, label, endpointKey, fallbackKey = 'chatai') {
    const isChatAt = endpointKey === 'chatat';
    return {
        commands:    cmds,
        description: `Ask ${label} a question`,
        usage:       `.${cmds[0]} <question>`,
        permission:  'public',
        group:       true,
        private:     true,

        run: async (sock, message, args, ctx) => {
            const { jid, contextInfo } = ctx;
            const query = args.join(' ').trim();

            if (!query) {
                return sock.sendMessage(jid, {
                    text: fmt(`❌ *Usage:* \`.${cmds[0]} <question>\`\n\nExample: \`.${cmds[0]} What is quantum computing?\``),
                    contextInfo
                }, { quoted: message });
            }

            await sock.sendPresenceUpdate('composing', jid);

            let answer = null;

            if (isChatAt) {
                answer = await queryChatAt(query);
            }

            if (!answer) {
                const eps = AI_ENDPOINTS[endpointKey] || AI_ENDPOINTS[fallbackKey];
                if (eps && eps.length) answer = await queryAI(eps, query);
            }

            if (!answer) answer = await queryChatAt(query);
            if (!answer) answer = await queryAI(AI_ENDPOINTS.chatai, query);
            if (!answer) answer = '⚠️ All AI servers are currently busy. Please try again later.';

            await sock.sendMessage(jid, {
                text: fmt(`🤖 *${label}*\n\n❓ *Q:* ${query}\n\n💬 *A:* ${answer}`),
                contextInfo
            }, { quoted: message });
        }
    };
}

const chatat   = buildPlugin(['chatat', 'chat'],       'ch.at AI',   'chatat');
const chatai   = buildPlugin(['chatai'],                'ChatAI',     'chatai');
const gemini   = buildPlugin(['gemini', 'bard'],        'Gemini AI',  'gemini');
const giftedai = buildPlugin(['giftedai'],              'Gifted AI',  'giftedai');
const gpt4     = buildPlugin(['gpt4', 'gpt-4'],         'GPT-4',      'gpt4');
const gpt4o    = buildPlugin(['gpt4o', 'gpt-4o'],       'GPT-4o',     'gpt4');
const gpt4omini = buildPlugin(['gpt4o-mini'],           'GPT-4o Mini','gpt4');
const openai   = buildPlugin(['openai'],                'OpenAI',     'gpt4');
const venice   = buildPlugin(['venice'],                'Venice AI',  'venice');
const letmegpt = buildPlugin(['letmegpt'],              'LetMeGPT',   'letmegpt');

module.exports = [chatat, chatai, gemini, giftedai, gpt4, gpt4o, gpt4omini, openai, venice, letmegpt];
