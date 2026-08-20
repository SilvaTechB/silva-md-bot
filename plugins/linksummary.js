'use strict';

const https = require('https');
const http = require('http');

function fetchPage(url, timeout = 8000) {
    return new Promise((resolve, reject) => {
        const mod = url.startsWith('https') ? https : http;
        const req = mod.get(url, { timeout, headers: { 'User-Agent': 'Mozilla/5.0 (compatible; SilvaMDBot/2.0)' } }, (res) => {
            if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
                return fetchPage(res.headers.location, timeout).then(resolve).catch(reject);
            }
            let data = '';
            res.setEncoding('utf8');
            res.on('data', chunk => {
                data += chunk;
                if (data.length > 100000) { res.destroy(); resolve(data); }
            });
            res.on('end', () => resolve(data));
        });
        req.on('error', reject);
        req.on('timeout', () => { req.destroy(); reject(new Error('Timeout')); });
    });
}

function extractMeta(html) {
    const getTag = (name) => {
        const regex = new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']+)["']`, 'i');
        const match = html.match(regex);
        return match ? match[1].trim() : '';
    };

    const title = (html.match(/<title[^>]*>([^<]+)<\/title>/i) || [])[1] || '';
    const description = getTag('og:description') || getTag('description') || getTag('twitter:description') || '';
    const siteName = getTag('og:site_name') || '';
    const type = getTag('og:type') || '';
    const author = getTag('author') || getTag('article:author') || '';

    const textContent = html
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();

    const sentences = textContent.split(/[.!?]+/).filter(s => s.trim().length > 30).slice(0, 5);
    const excerpt = sentences.join('. ').substring(0, 500);

    return {
        title: title.trim(),
        description: description.substring(0, 300),
        siteName,
        type,
        author,
        excerpt: excerpt ? excerpt + '...' : ''
    };
}

function extractUrl(text) {
    const match = text.match(/https?:\/\/[^\s<>"{}|\\^`[\]]+/i);
    return match ? match[0] : null;
}

module.exports = {
    commands: ['summarize', 'linkpreview', 'summarizelink', 'readlink', 'tldr'],
    description: 'Summarize and preview any shared link/article',
    usage: '.summarize <url> or reply to a message with a link',
    permission: 'public',
    group: true,
    private: true,

    run: async (sock, message, args, ctx) => {
        const { jid, contextInfo } = ctx;

        let url = args[0];
        if (!url) {
            const quoted = message.message?.extendedTextMessage?.contextInfo?.quotedMessage;
            const quotedText = quoted?.conversation || quoted?.extendedTextMessage?.text || '';
            url = extractUrl(quotedText);
        }
        if (!url) url = extractUrl(args.join(' '));

        if (!url) {
            return sock.sendMessage(jid, {
                text: '🔗 *Link Summarizer*\n\nSummarize any article or webpage!\n\n*Usage:*\n• `.summarize https://example.com/article`\n• Reply to a message containing a link with `.summarize`\n\n_Extracts title, description, and key content._',
                contextInfo
            }, { quoted: message });
        }

        await sock.sendMessage(jid, { text: '🔍 Fetching and summarizing...', contextInfo }, { quoted: message });

        try {
            const html = await fetchPage(url);
            const meta = extractMeta(html);

            if (!meta.title && !meta.description && !meta.excerpt) {
                return sock.sendMessage(jid, {
                    text: '❌ Could not extract content from this URL. The page may be dynamic or protected.',
                    contextInfo
                }, { quoted: message });
            }

            let summary = `🔗 *Link Summary*\n\n`;
            if (meta.title) summary += `📰 *Title:* ${meta.title}\n`;
            if (meta.siteName) summary += `🌐 *Site:* ${meta.siteName}\n`;
            if (meta.author) summary += `✍️ *Author:* ${meta.author}\n`;
            if (meta.type) summary += `📂 *Type:* ${meta.type}\n`;
            summary += `\n`;
            if (meta.description) summary += `📝 *Description:*\n${meta.description}\n\n`;
            if (meta.excerpt) summary += `📖 *Excerpt:*\n${meta.excerpt}\n`;
            summary += `\n🔗 ${url}`;

            return sock.sendMessage(jid, { text: summary, contextInfo }, { quoted: message });
        } catch (err) {
            return sock.sendMessage(jid, {
                text: `❌ Failed to fetch the link. Error: ${err.message}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
