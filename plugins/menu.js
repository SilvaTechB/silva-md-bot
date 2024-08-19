  import { generateWAMessageFromContent, prepareWAMessageMedia } from '@shizodevs/shizoweb';
import { createHash } from 'crypto';
import PhoneNumber from 'awesome-phonenumber';
import { canLevelUp, xpRange } from '../lib/levelling.js'; 
import fetch from 'node-fetch';
import fs from 'fs';
import moment from 'moment-timezone';
import { promises as fsPromises } from 'fs';
import { join } from 'path';

const time = moment.tz('Asia/Kolkata').format('HH');
let wib = moment.tz('Asia/Kolkata').format('HH:mm:ss');

let handler = async (m, { conn, usedPrefix, command }) => {
    let d = new Date(Date.now() + 3600000);
    let locale = 'en';
    let week = d.toLocaleDateString(locale, { weekday: 'long' });
    let date = d.toLocaleDateString(locale, { day: 'numeric', month: 'long', year: 'numeric' });
    let _uptime = process.uptime() * 1000;
    let uptime = clockString(_uptime);

    let who = m.quoted ? m.quoted.sender : m.mentionedJid && m.mentionedJid[0] ? m.mentionedJid[0] : m.fromMe ? conn.user.jid : m.sender;
    if (!(who in global.db.data.users)) throw 'UNKNOW USER DETECTED OPINION REJECTED';

    let user = global.db.data.users[m.sender];
    let { name, exp, diamond, lastclaim, registered, regTime, age, level, role, warn } = global.db.data.users[who];
    let { min, xp, max } = xpRange(user.level, global.multiplier);
    let username = conn.getName(who);
    let math = max - xp;
    let prem = global.prems.includes(who.split('@')[0]);
    let sn = createHash('md5').update(who).digest('hex');
    let totaluser = Object.values(global.db.data.users).length;
    let rtotalreg = Object.values(global.db.data.users).filter(user => user.registered == true).length;
    let more = String.fromCharCode(8206);
    let readMore = more.repeat(850);
    let greeting = ucapan();
    let taguser = '@' + m.sender.split("@s.whatsapp.net")[0];

    let str = `┏━━━━━━⊱ 𝑺𝑰𝑳𝑽𝑨 𝑩𝑶𝑻 ⊰━━━━━━⸙
┏━━━━❮❮ CMD LINE ❯❯━━━━━━
┃💫 *𝙽𝚊𝚖𝚎:* ${global.author}
┃🫠 *𝚃𝚘𝚝𝚊𝚕:* ${totalf} + Features
┃💥 *Network:* LTE
┃📍 ᴠᴇʀꜱɪᴏɴ: 2.5.3
┃👨‍💻 ᴏᴡɴᴇʀ : *𝕊𝕀𝕃𝕍𝔸*      
┃👤 ɴᴜᴍʙᴇʀ: 254743706010
┃💻 HOSTER: *Silva Platform*
┃🛡 ᴍᴏᴅᴇ: *Unkown*
┃💫 ᴘʀᴇғɪx: *Multi-Prefix*
┖─────────┈┈┈〠⸙࿉༐
Thank you for choosing silva md
powered by Sylivanus❤️
─═✧✧═─ 𝕊𝕀𝕃𝕍𝔸 𝔹𝕆𝕋 ─═✧✧═─`;

    let media = await prepareWAMessageMedia({ image: { url: 'https://telegra.ph/file/751eef74109e0e5c8916c.jpg' } }, { upload: conn.waUploadToServer });

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
                        text: "𝚂𝚎𝚕𝚎𝚌𝚝 𝚋𝚞𝚝𝚝𝚘𝚗 𝚝𝚘 𝚌𝚘𝚗𝚝𝚒𝚗𝚞𝚎"
                    }),
                    header: proto.Message.InteractiveMessage.Header.create({
                        ...media,
                        title: null,
                        subtitle: null,
                        hasMediaAttachment: false
                    }),
                    nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                        buttons: [
                            {
                                "name": "single_select",
                                "buttonParamsJson": "{\"title\":\"TAP TO OPEN\",\"sections\":[{\"title\":\"HERE IS ALL LIST OF MENU\",\"highlight_label\":\"xei\",\"rows\":[{\"header\":\"\",\"title\":\"🤖 Bot Menu\",\"description\":\"The Bot's secret control panel. What's your command, oh great one?\",\"id\":\".botmenu\"},{\"header\":\"\",\"title\":\"👑 Owner Menu\",\"description\":\"The sacred scroll only for the chosen one. Yep, that's you, Boss!\",\"id\":\".ownermenu\"},{\"header\":\"\",\"title\":\"🧑‍🤝‍🧑 Group Menu\",\"description\":\"Group shenanigans central! Unite, chat, conquer!\",\"id\":\".groupmenu\"},{\"header\":\"\",\"title\":\"📥 Download Menu\",\"description\":\"'DL' stands for 'Delicious Loot'. Come grab your goodies!\",\"id\":\".dlmenu\"},{\"header\":\"\",\"title\":\"🎉 Fun Menu\",\"description\":\"The bot's party hat. Games, jokes and instant ROFLs. Let's get this party started!\",\"id\":\".funmenu\"},{\"header\":\"\",\"title\":\"💰 Economy Menu\",\"description\":\"Bling bling! Your personal vault of virtual economy. Spend or save? Choose wisely!\",\"id\":\".economymenu\"},{\"header\":\"\",\"title\":\"🎮 Game Menu\",\"description\":\"Enter the gaming arena. May the odds be ever in your favor!\",\"id\":\".gamemenu\"},{\"header\":\"\",\"title\":\"🎨 Sticker Menu\",\"description\":\"A rainbow of stickers for your inner artist. Make your chats pop!\",\"id\":\".stickermenu\"},{\"header\":\"\",\"title\":\"🧰 Tool Menu\",\"description\":\"Your handy-dandy toolkit. What's your pick, genius?\",\"id\":\".toolmenu\"},{\"header\":\"\",\"title\":\"🎩 Logo Menu\",\"description\":\"Create a logo that screams YOU. Or whispers. You choose the volume.\",\"id\":\".logomenu\"},{\"header\":\"\",\"title\":\"🌙 NSFW Menu\",\"description\":\"The After Dark menu. But remember, sharing adult secrets must be consent-based.\",\"id\":\".nsfwmenu\"}]}]}"
                            },
                            {
                                "name": "quick_reply",
                                "buttonParamsJson": "{\"display_text\":\"Owner 🐈\",\"id\":\".owner\"}"
                            },
                            {
                                "name": "cta_url",
                                "buttonParamsJson": "{\"display_text\":\"Bot Repo ✨💛\",\"url\":\"https://github.com/SilvaTechB/silva-md-bot\",\"merchant_url\":\"https://github.com/SilvaTechB/silva-md-bot\"}"
                            }
                        ],
                    })
                })
            }
        }
    }, {});

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
};

handler.help = ['main'];
handler.tags = ['group'];
handler.command = ['menu', 'help', 'h', 'commands2'];

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