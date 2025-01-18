import pkg from '@whiskeysockets/baileys';
const { proto, prepareWAMessageMedia, generateWAMessageFromContent } = pkg;
import moment from 'moment-timezone';
import { createHash } from 'crypto';
import { xpRange } from '../lib/levelling.js';

let handler = async (m, { conn, usedPrefix }) => {
    let d = new Date(new Date() + 3600000);
    let locale = 'en';
    let week = d.toLocaleDateString(locale, { weekday: 'long' });
    let date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);

    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
    if (!(who in global.db.data.users)) throw `✳️ The user is not found in my database`;

    let user = global.db.data.users[who];
    let { level } = user;
    let { min, xp, max } = xpRange(level, global.multiplier);
    let greeting = ucapan();

    let str = `
      『 *silva md bot* 』  
      © 2025 *silvatechinc*`;

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
            message: {
                "messageContextInfo": {
                    "deviceListMetadata": {},
                    "deviceListMetadataVersion": 2
                },
                interactiveMessage: proto.Message.InteractiveMessage.create({
                    body: proto.Message.InteractiveMessage.Body.create({
                        text: str
                    }),
                    footer: proto.Message.InteractiveMessage.Footer.create({
                        text: "Use The Below Buttons"
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        ...(await prepareWAMessageMedia({ image: { url: './media/shizo.jpg' } }, { upload: conn.waUploadToServer })),
                        title: null,
                        subtitle: null,
                        hasMediaAttachment: false
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                "name": "single_select",
                                "buttonParamsJson": JSON.stringify({
                                    "title": "TAP TO OPEN",
                                    "sections": [{
                                        "title": "HERE IS BUTTONS MENU",
                                        "highlight_label": "silva",
                                        "rows": [
                                            { "header": "", "title": "🎁 Bot Menu", "description": "The Bot's secret control panel.", "id": `${usedPrefix}botmenu` },
                                            { "header": "", "title": "🖲️ Owner Menu", "description": "Yep, that's for you, Boss!", "id": `${usedPrefix}ownermenu` },
                                            { "header": "", "title": "🎉 AI Menu", "description": "Your Personal Artificial Intelligence Copilots", "id": `${usedPrefix}aimenu` },
                                            { "header": "", "title": "🎧 Audio Menu", "description": "Tune The Mp3/Audio As You Wish", "id": `${usedPrefix}aeditor` },
                                            { "header": "", "title": "🍫 Anime Menu", "description": "Animated Images, Stickers and Videos", "id": `${usedPrefix}animemenu` },
                                            { "header": "", "title": "🪁 Anime Info", "description": "Full Information About Animes Like IMDB", "id": `${usedPrefix}infoanime` },
                                            { "header": "", "title": "🛫 Group Menu", "description": "Group shenanigans central!", "id": `${usedPrefix}groupmenu` },
                                            { "header": "", "title": "🗂️ Download Menu", "description": "'DL' stands for 'Delicious Loot'.", "id": `${usedPrefix}dlmenu` },
                                            { "header": "", "title": "🎭 Fun Menu", "description": "The bot's party hat. Games, jokes and instant ROFLs.", "id": `${usedPrefix}funmenu` },
                                            { "header": "", "title": "💵 Economy Menu", "description": "Your personal vault of virtual economy.", "id": `${usedPrefix}economymenu` },
                                            { "header": "", "title": "🎮 Game Menu", "description": "Enter the gaming arena.", "id": `${usedPrefix}gamemenu` },
                                            { "header": "", "title": "🫐 Sticker Menu", "description": "A rainbow of stickers.", "id": `${usedPrefix}stickermenu` },
                                            { "header": "", "title": "🖍️ Fancy Text", "description": "Fancy Text Generator.", "id": `${usedPrefix}fancy` },
                                            { "header": "", "title": "🎊 Tool Menu", "description": "Your handy-dandy toolkit.", "id": `${usedPrefix}toolmenu` },
                                            { "header": "", "title": "🏵️ Logo Menu", "description": "Create a logo that screams You.", "id": `${usedPrefix}logomenu` },
                                            { "header": "", "title": "🖌️ Fancy Text2", "description": "From Text To Fancy Text As jpg", "id": `${usedPrefix}fancy2` },
                                            { "header": "", "title": "🌄 NSFW Menu", "description": "The After Dark menu.", "id": `${usedPrefix}nsfwmenu` }
                                        ]
                                    }]
                                })
                            },
                            {
                                "name": "quick_reply",
                                "buttonParamsJson": JSON.stringify({
                                    "display_text": "MENU ❇️",
                                    "id": `${usedPrefix}menu`
                                })
                            },
                            {
                                "name": "cta_url",
                                "buttonParamsJson": JSON.stringify({
                                    "display_text": "OWNER 🌟",
                                    "url": "https://wa.me/message/254700143167"
                                })
                            },
                            {
                                "name": "cta_url",
                                "buttonParamsJson": JSON.stringify({
                                    "display_text": "SCRIPT 💕",
                                    "url": "https://github.com/SilvaTechB/silva-md-bot"
                                })
                            }
                        ],
                    })
                })
            }
        }
    }, {});

    await conn.relayMessage(msg.key.remoteJid, msg.message, {
        messageId: msg.key.id
    });
}

handler.help = ['main'];
handler.tags = ['group'];
handler.command = ['menu2', 'help2', 'h', 'commands2'];

export default handler;

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

function ucapan() {
    const time = moment.tz('Asia/Karachi').format('HH');
    let res = "happy early in the day☀️";
    if (time >= 4) {
        res = "Good Morning 🥱";
    }
    if (time >= 10) {
        res = "Good Afternoon 🫠";
    }
    if (time >= 15) {
        res = "Good Afternoon 🌇";
    }
    if (time >= 18) {
        res = "Good Night 🌙";
    }
    return res;
}
