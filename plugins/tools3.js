'use strict';

const axios  = require('axios');
const fs     = require('fs');
const path   = require('path');
const { fmt } = require('../lib/theme');

const FANCY_MAP = {
    bold:        s => s.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D3BF);
        if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D3B9);
        if (code >= 48 && code <= 57) return String.fromCodePoint(code + 0x1D7CE);
        return c;
    }).join(''),
    italic:      s => s.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 65 && code <= 90) return String.fromCodePoint(code + 0x1D3F3);
        if (code >= 97 && code <= 122) return String.fromCodePoint(code + 0x1D3ED);
        return c;
    }).join(''),
    script:      s => s.split('').map(c => {
        const map = { a:'𝒶',b:'𝒷',c:'𝒸',d:'𝒹',e:'𝑒',f:'𝒻',g:'𝑔',h:'𝒽',i:'𝒾',j:'𝒿',k:'𝓀',l:'𝓁',m:'𝓂',n:'𝓃',o:'𝑜',p:'𝓅',q:'𝓆',r:'𝓇',s:'𝓈',t:'𝓉',u:'𝓊',v:'𝓋',w:'𝓌',x:'𝓍',y:'𝓎',z:'𝓏' };
        return map[c.toLowerCase()] || c;
    }).join(''),
    bubble:      s => s.split('').map(c => {
        const map = { a:'ⓐ',b:'ⓑ',c:'ⓒ',d:'ⓓ',e:'ⓔ',f:'ⓕ',g:'ⓖ',h:'ⓗ',i:'ⓘ',j:'ⓙ',k:'ⓚ',l:'ⓛ',m:'ⓜ',n:'ⓝ',o:'ⓞ',p:'ⓟ',q:'ⓠ',r:'ⓡ',s:'ⓢ',t:'ⓣ',u:'ⓤ',v:'ⓥ',w:'ⓦ',x:'ⓧ',y:'ⓨ',z:'ⓩ',A:'Ⓐ',B:'Ⓑ',C:'Ⓒ',D:'Ⓓ',E:'Ⓔ',F:'Ⓕ',G:'Ⓖ',H:'Ⓗ',I:'Ⓘ',J:'Ⓙ',K:'Ⓚ',L:'Ⓛ',M:'Ⓜ',N:'Ⓝ',O:'Ⓞ',P:'Ⓟ',Q:'Ⓠ',R:'Ⓡ',S:'Ⓢ',T:'Ⓣ',U:'Ⓤ',V:'Ⓥ',W:'Ⓦ',X:'Ⓧ',Y:'Ⓨ',Z:'Ⓩ' };
        return map[c] || c;
    }).join(''),
    square:      s => s.split('').map(c => {
        const map = { a:'🄰',b:'🄱',c:'🄲',d:'🄳',e:'🄴',f:'🄵',g:'🄶',h:'🄷',i:'🄸',j:'🄹',k:'🄺',l:'🄻',m:'🄼',n:'🄽',o:'🄾',p:'🄿',q:'🅀',r:'🅁',s:'🅂',t:'🅃',u:'🅄',v:'🅅',w:'🅆',x:'🅇',y:'🅈',z:'🅉' };
        return map[c.toLowerCase()] || c;
    }).join(''),
    vaporwave:   s => s.split('').map(c => {
        const code = c.charCodeAt(0);
        if (code >= 33 && code <= 126) return String.fromCodePoint(code + 0xFEE0);
        return c;
    }).join(''),
};

module.exports = {
    commands: [
        'ebinary', 'debinary', 'ebase', 'dbase',
        'fancy', 'ttp', 'domaincheck', 'rename', 'tinyurl', 'rebrandly', 'vgd', 'vurl',
        'adfoc', 'cleanuri', 'createpdf', 'createqr', 'readqr',
        'shortener', 'sspc', 'ssphone', 'sstab', 'ssur', 'ssweb',
        'web2zip', 'photoeditor', 'remini', 'met', 'onwa'
    ],
    description: 'Extended tools and utilities',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo, reply } = ctx;
        const cmd  = (message.message?.extendedTextMessage?.text
            || message.message?.conversation || '').trim().split(/\s+/)[0].replace(/^\./, '').toLowerCase();
        const text = args.join(' ').trim();
        const send = (t) => sock.sendMessage(jid, { text: fmt(t), contextInfo }, { quoted: message });

        if (cmd === 'ebinary') {
            if (!text) return send('❌ *Usage:* `.ebinary <text>`');
            const bin = text.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' ');
            return send(`🔢 *Text → Binary*\n\n*Input:* ${text}\n*Output:* ${bin}`);
        }

        if (cmd === 'debinary') {
            if (!text) return send('❌ *Usage:* `.debinary <binary>`');
            try {
                const decoded = text.trim().split(/\s+/).map(b => String.fromCharCode(parseInt(b, 2))).join('');
                return send(`🔢 *Binary → Text*\n\n*Input:* ${text}\n*Output:* ${decoded}`);
            } catch { return send('❌ Invalid binary input.'); }
        }

        if (cmd === 'ebase' || cmd === 'b64e') {
            if (!text) return send('❌ *Usage:* `.ebase <text>`');
            return send(`🔐 *Base64 Encode*\n\n*Input:* ${text}\n*Output:* ${Buffer.from(text).toString('base64')}`);
        }

        if (cmd === 'dbase' || cmd === 'b64d') {
            if (!text) return send('❌ *Usage:* `.dbase <base64>`');
            try {
                return send(`🔐 *Base64 Decode*\n\n*Input:* ${text}\n*Output:* ${Buffer.from(text, 'base64').toString('utf8')}`);
            } catch { return send('❌ Invalid base64 input.'); }
        }

        if (cmd === 'fancy') {
            if (!text) return send('❌ *Usage:* `.fancy <text>`\n\nStyles: bold, italic, script, bubble, square, vaporwave');
            const parts = text.split('|');
            const style = parts.length > 1 ? parts[0].trim().toLowerCase() : 'all';
            const input = parts.length > 1 ? parts.slice(1).join('|').trim() : text;

            if (style === 'all') {
                const results = Object.entries(FANCY_MAP).map(([name, fn]) => `*${name}:* ${fn(input)}`).join('\n');
                return send(`✨ *Fancy Text: "${input}"*\n\n${results}`);
            }
            const fn = FANCY_MAP[style];
            if (!fn) return send(`❌ Unknown style. Choose from: ${Object.keys(FANCY_MAP).join(', ')}`);
            return send(`✨ *${style}:* ${fn(input)}`);
        }

        if (cmd === 'ttp') {
            if (!text) return send('❌ *Usage:* `.ttp <text>`');
            try {
                await sock.sendPresenceUpdate('composing', jid);
                const url = `https://api.siputzx.my.id/api/tools/ttp?text=${encodeURIComponent(text)}&color=green`;
                const res = await axios.get(url, { responseType: 'arraybuffer', timeout: 20000 });
                await sock.sendMessage(jid, { image: Buffer.from(res.data), caption: fmt(`🖼️ Text: *${text}*`), contextInfo }, { quoted: message });
            } catch {
                return send(`🖼️ Text Picture: *${text}*\n\n_API unavailable — use \`.fancy ${text}\` for styled text instead_`);
            }
            return;
        }

        if (cmd === 'domaincheck') {
            if (!text) return send('❌ *Usage:* `.domaincheck <domain>`\n\nExample: `.domaincheck example.com`');
            try {
                const res = await axios.get(`https://api.api-ninjas.com/v1/dnslookup?domain=${encodeURIComponent(text)}`, {
                    timeout: 10000,
                    headers: { 'Accept': 'application/json' }
                });
                const available = !res.data || res.data.length === 0;
                return send(`🌐 *Domain Check: ${text}*\n\nStatus: ${available ? '✅ Possibly Available' : '❌ Registered'}\n\nRecords: ${res.data?.length || 0}`);
            } catch {
                return send(`🌐 *Domain Check: ${text}*\n\n_Use whois.domaintools.com for detailed info_`);
            }
        }

        if (cmd === 'fetch') {
            if (!text) return send('❌ *Usage:* `.fetch <url>`');
            const url = text.startsWith('http') ? text : `https://${text}`;
            try {
                await sock.sendPresenceUpdate('composing', jid);
                const res = await axios.get(url, { timeout: 15000, maxContentLength: 50000 });
                const body = typeof res.data === 'string' ? res.data.replace(/<[^>]+>/g, '').replace(/\s{2,}/g, ' ').slice(0, 800) : JSON.stringify(res.data).slice(0, 800);
                return send(`🌐 *Fetch: ${url}*\n\nStatus: ${res.status}\n\n${body}...`);
            } catch (e) { return send(`❌ Failed to fetch URL: ${e.message}`); }
        }

        if (cmd === 'tinyurl') {
            if (!text) return send('❌ *Usage:* `.tinyurl <url>`');
            try {
                const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`, { timeout: 10000 });
                return send(`🔗 *TinyURL*\n\n*Original:* ${text}\n*Short:* ${res.data}`);
            } catch { return send('❌ TinyURL failed.'); }
        }

        if (cmd === 'vgd') {
            if (!text) return send('❌ *Usage:* `.vgd <url>`');
            try {
                const res = await axios.get(`https://v.gd/create.php?format=simple&url=${encodeURIComponent(text)}`, { timeout: 10000 });
                return send(`🔗 *v.gd Short URL*\n\n*Original:* ${text}\n*Short:* ${res.data}`);
            } catch { return send('❌ v.gd failed.'); }
        }

        if (cmd === 'cleanuri') {
            if (!text) return send('❌ *Usage:* `.cleanuri <url>`');
            try {
                const res = await axios.post('https://cleanuri.com/api/v1/shorten', `url=${encodeURIComponent(text)}`, {
                    headers: { 'Content-Type': 'application/x-www-form-urlencoded' }, timeout: 10000
                });
                return send(`🔗 *Clean URI*\n\n*Original:* ${text}\n*Short:* ${res.data?.result_url || 'N/A'}`);
            } catch { return send('❌ CleanURI failed.'); }
        }

        if (cmd === 'rebrandly') {
            if (!text) return send('❌ *Usage:* `.rebrandly <url>`');
            try {
                const res = await axios.get(`https://api.shrtco.de/v2/shorten?url=${encodeURIComponent(text)}`, { timeout: 10000 });
                const short = res.data?.result?.full_short_link || res.data?.result?.short_link;
                return send(`🔗 *Short URL*\n\n*Original:* ${text}\n*Short:* ${short || 'N/A'}`);
            } catch { return send('❌ URL shortener failed.'); }
        }

        if (cmd === 'vurl' || cmd === 'adfoc' || cmd === 'shortener') {
            if (!text) return send(`❌ *Usage:* \`.${cmd} <url>\``);
            try {
                const res = await axios.get(`https://tinyurl.com/api-create.php?url=${encodeURIComponent(text)}`, { timeout: 10000 });
                return send(`🔗 *Short URL*\n\n*Original:* ${text}\n*Short:* ${res.data}`);
            } catch { return send('❌ URL shortener failed.'); }
        }

        if (cmd === 'createqr') {
            if (!text) return send('❌ *Usage:* `.createqr <text or URL>`');
            try {
                await sock.sendPresenceUpdate('composing', jid);
                const res = await axios.get(`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(text)}`, { responseType: 'arraybuffer', timeout: 15000 });
                await sock.sendMessage(jid, { image: Buffer.from(res.data), caption: fmt(`📱 QR Code for: ${text}`), contextInfo }, { quoted: message });
            } catch { return send('❌ Failed to generate QR code.'); }
            return;
        }

        if (cmd === 'readqr') {
            const msg    = message.message;
            const imgMsg = msg?.imageMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            if (!imgMsg) return send('❌ Send or reply to an image with `.readqr`');
            try {
                const { dlBuffer } = require('../lib/dlmedia');
                const buf = await dlBuffer(imgMsg, 'image');
                const form = new FormData();
                const { default: fetch2 } = await import('node-fetch').catch(() => ({ default: null }));
                if (!fetch2) return send('❌ QR reader requires node-fetch.');
                const res  = await axios.post('https://api.qrserver.com/v1/read-qr-code/', { file: buf.toString('base64') }, { timeout: 15000 });
                const qr   = res.data?.[0]?.symbol?.[0]?.data;
                return send(qr ? `📱 *QR Code Content:*\n\n${qr}` : '❌ Could not read QR code from image.');
            } catch { return send('❌ Failed to read QR code.'); }
        }

        if (['sspc', 'ssphone', 'sstab', 'ssur', 'ssweb', 'screenshot'].includes(cmd)) {
            const url = text.startsWith('http') ? text : `https://${text}`;
            if (!url || url === 'https://') return send(`❌ *Usage:* \`.${cmd} <url>\`\n\nExample: \`.ssweb google.com\``);
            try {
                await sock.sendPresenceUpdate('composing', jid);
                const device = cmd === 'ssphone' ? '375x812' : cmd === 'sstab' ? '768x1024' : '1280x900';
                const apiUrl = `https://image.thum.io/get/width/${device.split('x')[0]}/crop/${device.split('x')[1]}/${url}`;
                const res    = await axios.get(apiUrl, { responseType: 'arraybuffer', timeout: 30000 });
                await sock.sendMessage(jid, { image: Buffer.from(res.data), caption: fmt(`📸 Screenshot: ${url}`), contextInfo }, { quoted: message });
            } catch { return send(`❌ Failed to screenshot ${url}`); }
            return;
        }

        if (cmd === 'createpdf') {
            return send('📄 *Create PDF*\n\nSend text and this bot will format it as a PDF.\n\n_Use `.fetch <url>` to get webpage content first, then share as document._');
        }

        if (cmd === 'web2zip' || cmd === 'rename') {
            return send(`🔧 *${cmd}*\n\n_This feature requires desktop tools. Use your file manager or an online converter._`);
        }

        if (cmd === 'photoeditor') {
            return send('🖼️ *Photo Editor*\n\nUse these built-in commands:\n• `.sticker` — convert to sticker\n• `.toimg` — convert sticker to image\n• `.tojpeg` — convert to JPEG\n• `.togif` — convert to GIF\n• `.color` — color palette from image');
        }

        if (cmd === 'remini') {
            const msg    = message.message;
            const imgMsg = msg?.imageMessage || msg?.extendedTextMessage?.contextInfo?.quotedMessage?.imageMessage;
            if (!imgMsg) return send('❌ Send or reply to an image with `.remini` to enhance it.');
            try {
                await sock.sendPresenceUpdate('composing', jid);
                const { dlBuffer } = require('../lib/dlmedia');
                const buf  = await dlBuffer(imgMsg, 'image');
                const form = require('form-data') ? new (require('form-data'))() : null;
                if (!form) return send('❌ form-data package missing.');
                form.append('image', buf, { filename: 'photo.jpg', contentType: 'image/jpeg' });
                const res  = await axios.post('https://api.remini.ai/v1/enhance', form, {
                    headers: form.getHeaders(), timeout: 30000
                });
                if (res.data?.output_url) {
                    const enhanced = await axios.get(res.data.output_url, { responseType: 'arraybuffer', timeout: 20000 });
                    await sock.sendMessage(jid, { image: Buffer.from(enhanced.data), caption: fmt('✨ *Enhanced Photo*'), contextInfo }, { quoted: message });
                } else { return send('❌ Enhancement API returned no result.'); }
            } catch { return send('❌ Remini enhancement failed. Try again later.'); }
            return;
        }

        if (cmd === 'met') {
            const uptime   = process.uptime();
            const h = Math.floor(uptime / 3600), m = Math.floor((uptime % 3600) / 60), s = Math.floor(uptime % 60);
            const mem  = process.memoryUsage();
            const toMB = b => (b / 1024 / 1024).toFixed(1);
            return send(
                `📊 *Bot Metrics*\n\n` +
                `⏱ *Uptime:* ${h}h ${m}m ${s}s\n` +
                `🧠 *Heap Used:* ${toMB(mem.heapUsed)} MB\n` +
                `🧠 *Heap Total:* ${toMB(mem.heapTotal)} MB\n` +
                `📦 *RSS:* ${toMB(mem.rss)} MB\n` +
                `🕐 *Time:* ${new Date().toLocaleString()}`
            );
        }

        if (cmd === 'onwa') {
            const num = args[0]?.replace(/\D/g, '');
            if (!num) return send('❌ *Usage:* `.onwa <number>`\n\nExample: `.onwa 254712345678`');
            return send(`🔗 *Open in WhatsApp*\n\nhttps://wa.me/${num}\n\nClick the link to open a chat with +${num}`);
        }
    }
};
