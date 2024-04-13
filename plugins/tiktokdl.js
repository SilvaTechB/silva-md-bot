/**
//════════════════════════════════════════════════════════════════════════════════════════════//
//                                                                                            //
//                                ＷＨＡＴＳＡＰＰ ＢＯＴ－ＭＤ ＢＥＴＡ                          //
//                                                                                            // 
//                                         Ｖ：2．5．0                                         // 
//                                                                                            // 
//                                                                                            // 
//          ██████╗ ██╗███████╗████████╗███████╗██████╗     ███╗   ███╗██████╗                // 
//         ██╔════╝ ██║██╔════╝╚══██╔══╝██╔════╝██╔══██╗    ████╗ ████║██╔══██╗               // 
//         ██║  ███╗██║█████╗     ██║   █████╗  ██║  ██║    ██╔████╔██║██║  ██║               // 
//         ██║   ██║██║██╔══╝     ██║   ██╔══╝  ██║  ██║    ██║╚██╔╝██║██║  ██║               // 
//         ╚██████╔╝██║██║        ██║   ███████╗██████╔╝    ██║ ╚═╝ ██║██████╔╝               // 
//          ╚═════╝ ╚═╝╚═╝        ╚═╝   ╚══════╝╚═════╝     ╚═╝     ╚═╝╚═════╝                //
//                                                                                            //
//                                                                                            //
//                                                                                            //
//                                                                                            //
//════════════════════════════════════════════════════════════════════════════════════════════//
*                                                                 
  * @project_name : Gifted-Md
   * @author : Gifted Tech.
   * @youtube : https://www.youtube.com/@giftedtechnexus
   * @description : Gifted-Md ,A Multi-functional whatsapp user bot.
   * @version 2.5.0
*
* 
   * Created By Gifted Tech.
   * © 2024 Gifted-Md.


*/



























let baseApi = process.env.API_SMD || global.api_smd || "https://api-smd-1.vercel.app";
let maher_api = "https://api.maher-zubair.tech";
const {
  smd,
  fetchJson,
  smdJson,
  fancytext,
  yt,
  getBuffer,
  smdBuffer,
  pinterest,
  prefix,
  Config,
  mediafire,
} = require("../lib");
const { search, download } = require("aptoide-scraper");
const googleTTS = require("google-tts-api");
const ytdl = require("ytdl-secktor");
const yts = require("secktor-pack");
const fs = require("fs-extra");
const axios = require("axios");
const fetch = require("node-fetch");
var videotime = 2000;
const { cmd } = require("../lib/plugins");
smd(
  {
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Downloads Tiktok Videos Via Url.",
    category: "downloader",
    filename: __filename,
    use: "<add tiktok url.>",
  },
  async (bot, message, url) => {
    try {
      let videoUrl = url.split(" ")[0];
      if (!/tiktok/.test(videoUrl)) {
        return await message.send("*Please Give Me Valid Tiktok Video Link*");
      }
      let response = await axios.get(`${maher_api}download/tiktok2?url=${videoUrl}`);
      const data = response.data;
      const video = data.result.url.nowm;
      const res = await fetch(video);
      const buffer = await res.buffer();
      await bot.send(message.chat, buffer); 
    } catch (error) {
      message.send(`\n*_Error Occured While Downloading Your Media_*\n_${error}_`);
      console.log(error);
    }
  }
);
