import pkg from '@whiskeysockets/baileys';
const { generateWAMessageFromContent, prepareWAMessageMedia, proto } = pkg;
import moment from 'moment-timezone';
import { xpRange } from '../lib/levelling.js';

let handler = async (m, { conn, usedPrefix }) => {
    let d = new Date(new Date().getTime() + 3600000);
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
      『 *SILVA MD BOT* 』
      © 2025 *Silva Tech Inc.*`;

    let msg = generateWAMessageFromContent(m.chat, {
        viewOnceMessage: {
          message: {
            "messageContextInfo": {
              "deviceListMetadata": {},
              "deviceListMetadataVersion": 2
            },
            interactiveMessage: proto.Message.InteractiveMessage.create({
              body: proto.Message.InteractiveMessage.Body.create({
                text: "Silva MD Bot\n\n\n world class bot\n\n\n new generation bot framework"
              }),
              footer: proto.Message.InteractiveMessage.Footer.create({
                text: "Bot"
              }),
              header: proto.Message.InteractiveMessage.Header.create({
                title: "SILVA",
                subtitle: "Let us destroy",
                hasMediaAttachment: false
              }),
              nativeFlowMessage: proto.Message.InteractiveMessage.NativeFlowMessage.create({
                buttons: [
                  {
                    "name": "single_select",
                    "buttonParamsJson": "{\"title\":\"title\",\"sections\":[{\".menu\":\".play dj webito\",\"highlight_label\":\"label\",\"rows\":[{\"header\":\"header\",\"title\":\"title\",\"description\":\"description\",\"id\":\"id\"},{\"header\":\"header\",\"title\":\"title\",\"description\":\"description\",\"id\":\"id\"}]}]}"
                  },
                  {
                    "name": "cta_reply",
                    "buttonParamsJson": "{\"display_text\":\"MENU 📜","id":"" + usedPrefix + "botmenu\",\"id\":\"message\"}"
                  },
                  {
                    "name": "cta_Script 💕","url":"https://github.com/SilvaTechB/silva-md-bot","merchant_url":"https://github.com/SilvaTechB/silva-md-bot",
                    "buttonParamsJson": "{\"display_text\":\"url\",\"url\":\"https://www.google.com\",\"merchant_url\":\"https://www.google.com\"}"
                  },
                  {
                    "name": "cta_OWNER 🌟","url":"https://wa.me/message/254700143167",
                    "buttonParamsJson": "{\"display_text\":\"call\",\"id\":\"message\"}"
                  },
                  {
                    "name": "cta_copy",
                    "buttonParamsJson": "{\"display_text\":\"copy\",\"id\":\"123456789\",\"copy_code\":\"message\"}"
                  },
                  {
                    "name": "cta_reminder",
                    "buttonParamsJson": "{\"display_text\":\"Recordatorio\",\"id\":\"message\"}"
                  },
                  {
                    "name": "cta_cancel_reminder",
                    "buttonParamsJson": "{\"display_text\":\"cta_cancel_reminder\",\"id\":\"message\"}"
                  },
                  {
                    "name": "address_message",
                    "buttonParamsJson": "{\"display_text\":\"address_message\",\"id\":\"message\"}"
                  },
                  {
                    "name": "send_location",
                    "buttonParamsJson": ""
                  }
                ],
              })
            })
          }
        }
      }, {});

    await conn.relayMessage(m.chat, msg.message, { messageId: msg.key.id });
}

handler.help = ['menu', 'help'];
handler.tags = ['main'];
handler.command = ['menu1', 'help1', 'commands1'];

export default handler;

function clockString(ms) {
    let h = isNaN(ms) ? '--' : Math.floor(ms / 3600000);
    let m = isNaN(ms) ? '--' : Math.floor(ms / 60000) % 60;
    let s = isNaN(ms) ? '--' : Math.floor(ms / 1000) % 60;
    return [h, m, s].map(v => v.toString().padStart(2, 0)).join(':');
}

function ucapan() {
    const time = moment.tz('Africa/Nairobi').format('HH');
    let res = "Good Day";
    if (time >= 4 && time < 10) res = "Good Morning 🌅";
    if (time >= 10 && time < 15) res = "Good Afternoon 🌞";
    if (time >= 15 && time < 18) res = "Good Evening 🌇";
    if (time >= 18) res = "Good Night 🌙";
    return res;
}
