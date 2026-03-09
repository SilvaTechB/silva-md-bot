'use strict';

const axios  = require('axios');
const moment = require('moment-timezone');

const REPO_URL    = 'https://github.com/SilvaTechB/silva-md-bot';
const WEBSITE_URL = 'https://silvatech.co.ke';
const WA_CHANNEL  = 'https://whatsapp.com/channel/0029VaksrRh6GcGnT0J05n0j';
const SUPPORT_URL = 'https://chat.whatsapp.com/GzCZZxVnAHMINWdPQkGwJR';

module.exports = {
    commands:    ['repo', 'repository', 'github'],
    description: 'Show Silva MD repository info with quick-access buttons',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid = message.key.remoteJid;

        let data = null;
        try {
            const res = await axios.get(
                'https://api.github.com/repos/SilvaTechB/silva-md-bot',
                { timeout: 10000 }
            );
            data = res.data;
        } catch { /* use fallback */ }

        const caption = data
            ? `*✨ SILVA MD — REPOSITORY INFO*\n\n` +
              `📦 *Repo:* ${data.name}\n` +
              `📝 *About:* ${data.description || 'WhatsApp MD Bot'}\n\n` +
              `⭐ *Stars:* ${data.stargazers_count.toLocaleString()}\n` +
              `🍴 *Forks:* ${data.forks_count.toLocaleString()}\n` +
              `💻 *Language:* ${data.language || 'JavaScript'}\n` +
              `📦 *Size:* ${(data.size / 1024).toFixed(1)} MB\n` +
              `📜 *License:* ${data.license?.name || 'MIT'}\n` +
              `⚠️ *Open Issues:* ${data.open_issues}\n` +
              `🕒 *Updated:* ${moment(data.updated_at).fromNow()}\n\n` +
            `https://github.com/SilvaTechB/silva-md-bot` +
              `⚡ _Powered by Silva Tech Inc_`
            : `*✨ SILVA MD — REPOSITORY*\n\n` +
              `📦 *Repo:* silva-md-bot\n` +
              `💻 *Language:* JavaScript\n` +
              `📜 *License:* MIT\n\n` +
              `⚡ _Powered by Silva Tech Inc_`;

        const imgUrl = 'https://files.catbox.moe/5uli5p.jpeg';

        await sock.sendMessage(jid, {
            image:   { url: imgUrl },
            caption,
            contextInfo: {
                ...contextInfo,
                externalAdReply: {
                    title:               'Silva MD — Open Source Bot',
                    body:                'Star us on GitHub!',
                    thumbnailUrl:        imgUrl,
                    sourceUrl:           REPO_URL,
                    mediaType:           1,
                    renderLargerThumbnail: true
                }
            }
        }, { quoted: message });

        const buttons = [
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📂 Open Bot Repo',
                    url:          REPO_URL,
                    merchant_url: REPO_URL
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '🌐 Visit Website',
                    url:          WEBSITE_URL,
                    merchant_url: WEBSITE_URL
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '📢 Follow Newsletter',
                    url:          WA_CHANNEL,
                    merchant_url: WA_CHANNEL
                })
            },
            {
                name: 'cta_url',
                buttonParamsJson: JSON.stringify({
                    display_text: '💬 Join Support',
                    url:          SUPPORT_URL,
                    merchant_url: SUPPORT_URL
                })
            }
        ];

        try {
            const { generateWAMessageFromContent, proto } = require('@whiskeysockets/baileys');
            const interactiveMsg = generateWAMessageFromContent(jid, {
                viewOnceMessage: {
                    message: {
                        messageContextInfo: {
                            deviceListMetadata:        {},
                            deviceListMetadataVersion: 2
                        },
                        interactiveMessage: proto.Message.InteractiveMessage.create({
                            body:   proto.Message.InteractiveMessage.Body.create({ text: '🔗 *Quick Links — Silva MD*' }),
                            footer: proto.Message.InteractiveMessage.Footer.create({ text: 'Tap a button to open' }),
                            header: proto.Message.InteractiveMessage.Header.create({
                                title:             'Silva Tech',
                                hasMediaAttachment: false
                            }),
                            nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                                buttons,
                                messageParamsJson: ''
                            })
                        })
                    }
                }
            }, { userJid: jid });

            await sock.relayMessage(jid, interactiveMsg.message, { messageId: interactiveMsg.key.id });
        } catch {
            await sock.sendMessage(jid, {
                text:
                    `🔗 *Quick Links*\n\n` +
                    `📂 Repo: ${REPO_URL}\n` +
                    `🌐 Website: ${WEBSITE_URL}\n` +
                    `📢 Newsletter: ${WA_CHANNEL}\n` +
                    `💬 Support: ${SUPPORT_URL}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
