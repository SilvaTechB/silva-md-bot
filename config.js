/**
/**
//════════════════════════════════════════════════════════════════════════════════════════════//
//                                                                                            //
//                                ＷＨＡＴＳＡＰＰ ＢＯＴ－ＭＤ ＢＥＴＡ                          //
//                                                                                            // 
//                                         Ｖ：2．5．0                                         // 
 //          ▄▄    ▄▄                                                 ▄▄                      //
  //         ██  ▀███                                               ▀███                      //
  //               ██                                                 ██                      //
//   ▄██▀██████    ██ ▀██▀   ▀██▀ ▄█▀██▄     ▀████████▄█████▄    ▄█▀▀███                      //
 //  ██   ▀▀ ██    ██   ██   ▄█  ██   ██       ██    ██    ██  ▄██    ██                      //
 //  ▀█████▄ ██    ██    ██ ▄█    ▄█████       ██    ██    ██  ███    ██                      //
 //  █▄   ██ ██    ██     ███    ██   ██       ██    ██    ██  ▀██    ██                      //
//   ██████▀████▄▄████▄    █     ▀████▀██▄   ▄████  ████  ████▄ ▀████▀███▄                    //                                                                                                                                                                                                          
//════════════════════════════════════════════════════════════════════════════════════════════//
*                                                                 
  * @project_name : silva-md-bot
   * @author : silva Tech.
   * @youtube : https://www.youtube.com/@silvaedits254
   * @description : silva-Md ,A Multi-functional whatsapp user bot.
   * @version 2.5.0
*
* 
   * Created By silva Tech.
   * © 2024 silva-Md.


*/













const fs = require('fs-extra')
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname+'/.env' })


//═══════[Required Variables]════════\\
global.audio= "" ;  
global.video= "https://telegra.ph/file/bd7de62f35507d6b4c2de.mp4" ;
global.port =process.env.PORT
global.appUrl=process.env.APP_URL || ""                       // put your app url here,
global.email ="sylivanusmomanyi@gmail.com"
global.location="Kisii,Kenya."


global.mongodb= process.env.MONGODB_URI || "mongodb+srv://wasitech10:WASImd##12@cluster0.eclhxiz.mongodb.net/?retryWrites=true&w=majority"
global.allowJids= process.env.ALLOW_JID || "null" 
global.blockJids= process.env.BLOCK_JID || "120363180849475037@g.us"
global.DATABASE_URL = process.env.DATABASE_URL || ""

global.timezone= process.env.TZ || process.env.TIME_ZONE || "Africa/Nairobi";
global.github=process.env.GITHUB|| "https://github.com/SilvaTechB/silva-md-bot";
global.gurl  =process.env.GURL  || "https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v";
global.website=process.env.GURL || "https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v" ; 
global.THUMB_IMAGE = process.env.THUMB_IMAGE || process.env.IMAGE || "https://telegra.ph/file/9c522f89834cfb510738d.jpg" ; // SET LOGO FOR IMAGE 
global.caption = process.env.CAPTION || global.caption || "𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉-ᴍᴅ" 


global.devs = "254700143167" // Developer Contact
global.sudo = process.env.SUDO ? process.env.SUDO.replace(/[\s+]/g, '') : "254743706010";
global.owner= process.env.OWNER_NUMBER ? process.env.OWNER_NUMBER.replace(/[\s+]/g, '') : "254743706010";




//========================= [ BOT SETTINGS ] =========================\\
global.style = process.env.STYLE   || '1'  // put '1' to "5" here to check bot styles
global.flush = process.env.FLUSH   || "false"; // Make it "true" if bot not responed
global.gdbye = process.env.GOODBYE || "false"; 
global.wlcm  = process.env.WELCOME || "false";  // Make it "false" for disable WELCOME 

global.warncount = process.env.WARN_COUNT || 3
global.disablepm = process.env.DISABLE_PM || "false"
global.disablegroup = process.env.DISABLE_GROUPS || "false", // disable bot in groups when public mode

global.MsgsInLog = process.env.MSGS_IN_LOG|| "false" // "true"  to see messages , "log" to show logs , "false" to hide logs messages
global.userImages= process.env.USER_IMAGES || "https://telegra.ph/file/9c522f89834cfb510738d.jpg" // set Image/video urls here
global.waPresence= process.env.WAPRESENCE ||  "null" ; // 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'


//========================= [ AUTO READ MSGS & CMDS ] =========================\\
global.readcmds = process.env.READ_COMMAND || "true"
global.readmessage = process.env.READ_MESSAGE || "false"
global.readmessagefrom = process.env.READ_MESSAGE_FROM || "null,254xxxxxxxx";


//========================= [ AUTO SAVE & READ STATUS ] =========================\\
global.read_status = process.env.AUTO_READ_STATUS || "true"
global.save_status = process.env.AUTO_SAVE_STATUS || "true"
global.save_status_from =  process.env.SAVE_STATUS_FROM  || "null,254700143167";
global.read_status_from =  process.env.READ_STATUS_FROM  ||  "254700143167, 254743706010";

global.api_smd = "https://api-smd.onrender.com" //  || "https://api-smd-1.vercel.app" // expires
global.scan = "https://silvatech.vercel.app";


global.SESSION_ID = process.env.SESSION_ID ||  ""  // PUT your SESSION_ID 


module.exports = {

  menu: process.env.MENU || "1", /**  Available @MENU @Schemes 1: Aztec_Md, 2: A17_Md, 3: Suhail-Md Default ---------- If Not Choose then it Randomely Pic One Of Them Each time **/

  HANDLERS: process.env.PREFIX  || ".",
  BRANCH  : process.env.BRANCH  || "main",
  VERSION : process.env.VERSION || "2.3.9",
  caption : global.caption || "『𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉-ᴍᴅ 』" , // ```『 𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉-ᴍᴅ 』```", //*『𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉』*\n tiktok.com/@silva.edits6"),
 
  author : process.env.PACK_AUTHER|| "silva",
  packname: process.env.PACK_NAME || "tech",
  botname : process.env.BOT_NAME  || "𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉-ᴍᴅ",
  ownername:process.env.OWNER_NAME|| "𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉",


  errorChat : process.env.ERROR_CHAT || "254743706010",
  KOYEB_API : process.env.KOYEB_API  || "false",

  REMOVE_BG_KEY : process.env.REMOVE_BG_KEY  || "DJwc34NaWmhXmDxEeh6YUEmm",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "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",
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || "",
  HEROKU_APP_NAME:process.env.HEROKU_APP_NAME|| "",
  antilink_values:process.env.ANTILINK_VALUES|| "all",
  HEROKU: process.env.HEROKU_APP_NAME && process.env.HEROKU_API_KEY,


  WORKTYPE: process.env.WORKTYPE || process.env.MODE|| "public",
  LANG: ( process.env.THEME ||  "SILVA"  ).toUpperCase(),



};



global.ELEVENLAB_API_KEY = process.env.ELEVENLAB_API_KEY || "0cdb1aed858329b9793413672094ce0d";
global.aitts_Voice_Id = process.env.AITTS_ID|| "37";





















global.rank = "updated"
global.isMongodb = false; 
let file = require.resolve(__filename)
fs.watchFile(file, () => { fs.unwatchFile(file);console.log(`Update'${__filename}'`);delete require.cache[file];	require(file); })
 

// ========================= [ Disables in V.1.2.8 ] ===============================\\  
  //style : process.env.STYLE || "2",  // put '1' & "2" here to check bot styles
  //readmessage:process.env.READ_MESSAGE|| "false",
  //warncount: process.env.WARN_COUNT || 3,
  //userImages:process.env.USER_IMAGES|| "text",  // SET IMAGE AND VIDEO URL FOR BOT MENUS 
  //disablepm: process.env.DISABLE_PM || "false",
  //MsgsInLog: process.env.MSGS_IN_LOG|| "false", // "true"  to see messages , "log" to open logs , "false" to hide logs messages
  //readcmds:process.env.READ_COMMANDS|| "false", 
  //alwaysonline:process.env.WAPRESENCE|| "unavailable", // 'unavailable' | 'online' | 'composing' | 'recording' | 'paused'
  //read_status: process.env.AUTO_READ_STATUS || "false",
  //save_status: process.env.AUTO_SAVE_STATUS || "false",
  //aitts_Voice_Id : process.env.AITTS_ID || "37",
  //ELEVENLAB_API_KEY: process.env.ELEVENLAB_API_KEY  || "",
