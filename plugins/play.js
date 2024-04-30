const {
  search,
  download
} = require("aptoide-scraper");
const googleTTS = require('google-tts-api');
const ytdl = require("ytdl-secktor");
const yts = require('secktor-pack');
const fs = require("fs-extra");
const axios = require("axios");
const fetch = require('node-fetch');
const {
  cmd
} = require("../lib/plugins");
smd({
   pattern: "play",
   alias: ["music"],
   desc: "Sends info about the query(of youtube video/audio).",
   category: "downloader",
   filename: __filename,
   use: "<faded-Alan walker.>"
 }, async (_0x54463e, _0x1f76d0) => {
   try {
     let _0x25d045 = _0x1f76d0 ? _0x1f76d0 : _0x54463e.reply_text;
     var _0x2e913a = _0x25d045.toLowerCase().includes("doc") ? "document" : "audio";
     if (!_0x25d045) {
       return _0x54463e.reply("*" + prefix + "play back in black*");
     }
     let _0x2eca3d = ytIdRegex.exec(_0x25d045) || [];
     let _0xb6fd2d = _0x2eca3d[0] || false;
     if (!_0xb6fd2d) {
       let _0x4bcf6d = await yts(_0x25d045);
       let _0xa244ed = _0x4bcf6d.videos[0];
       _0xb6fd2d = _0xa244ed.url;
     }
     _0x2eca3d = ytIdRegex.exec(_0xb6fd2d) || [];
     let _0x6845ab = await yt.getInfo(_0x2eca3d[1]);
     let _0x516e89 = _0x6845ab.title || _0x37323e || _0x2eca3d[1];
     if (_0x6845ab && _0x6845ab.duration >= videotime) {
       return await _0x54463e.reply("*_Can't dowanload, file duration too big_*");
     }
     await _0x54463e.send("_Downloading " + _0x6845ab.title + "..._");
     let _0x37323e = await yt.download(_0x2eca3d[1], {
       type: "audio",
       quality: "best"
     });
     var _0x28302f = {
       ...(await _0x54463e.bot.contextInfo(Config.botname, "ꜱᴏɴɢ ᴅᴏᴡɴʟᴏᴀᴅᴇʀ"))
     };
     if (_0x37323e) {
       await _0x54463e.bot.sendMessage(_0x54463e.jid, {
         [_0x2e913a]: {
           url: _0x37323e
         },
         fileName: _0x516e89,
         mimetype: "audio/mpeg",
         contextInfo: _0x28302f
       });
     } else {
       _0x54463e.send("*_Video not Found_*");
     }
     try {
       fs.unlinkSync(_0x37323e);
     } catch {}
   } catch (_0x593953) {
     return _0x54463e.error(_0x593953 + "\n\ncommand: play", _0x593953, "*_Video not Found_*");
   }
 });
