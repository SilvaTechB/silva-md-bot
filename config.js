const fs = require('fs-extra')
if (fs.existsSync('.env')) require('dotenv').config({ path: __dirname+'/.env' })


//═══════[Required Variables]════════\\
global.audio= "" ;  
global.video= "" ;
global.port =process.env.PORT
global.appUrl=process.env.APP_URL || ""                       // put your app url here,
global.email ="sylivanusmomanyi@gmail.com"
global.location="Kisii,Kenya."


global.mongodb= process.env.MONGODB_URI || ""
global.allowJids= process.env.ALLOW_JID || "null" 
global.blockJids= process.env.BLOCK_JID || "120363180849475037@g.us"
global.DATABASE_URL = process.env.DATABASE_URL || "postgres://u4orkeulqa5b9m:pc90e97423c91d1aa0a9e1722ec790b8d753d1948a04d49e6e9da45f0ca6f40a0@ceqbglof0h8enj.cluster-czrs8kj4isg7.us-east-1.rds.amazonaws.com:5432/d1cogn2pmpblbr"

global.timezone= process.env.TZ || process.env.TIME_ZONE || "Africa/Nairobi";
global.github=process.env.GITHUB|| "https://github.com/SilvaTechB/silva-md-bot";
global.gurl  =process.env.GURL  || "https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v";
global.website=process.env.GURL || "https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v" ; 
global.THUMB_IMAGE = process.env.THUMB_IMAGE || process.env.IMAGE || "https://telegra.ph/file/751eef74109e0e5c8916c.jpg" ; // SET LOGO FOR IMAGE 
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
global.userImages= process.env.USER_IMAGES || "text" // set Image/video urls here
global.waPresence= process.env.WAPRESENCE ||  "null" ; // 'unavailable' | 'available' | 'composing' | 'recording' | 'paused'


//========================= [ AUTO READ MSGS & CMDS ] =========================\\
global.readcmds = process.env.READ_COMMAND || "true"
global.readmessage = process.env.READ_MESSAGE || "false"
global.readmessagefrom = process.env.READ_MESSAGE_FROM || "null,254xxxxxxxx";


//========================= [ AUTO SAVE & READ STATUS ] =========================\\
global.read_status = process.env.AUTO_READ_STATUS || "true"
global.save_status = process.env.AUTO_SAVE_STATUS || "false"
global.save_status_from =  process.env.SAVE_STATUS_FROM  || "null,254xxxxxxxx";
global.read_status_from =  process.env.READ_STATUS_FROM  ||  "254700143167, 254743706010";

global.api_smd = "https://api-smd.onrender.com" //  || "https://api-smd-1.vercel.app" // expires
global.scan = "https://silvatech.vercel.app";


global.SESSION_ID = process.env.SESSION_ID ||  "eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiUUIvcjFJbnN0MFRKS2wvWWo1c041bmpNMThUZWsyQllYQVY0VGJCeVJWOD0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiZnArUEt1UU1MRWoyeWEzQVBHRVlidDNxZmlIbW45MC9iV2dpeDFwTjlEZz0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJnSHhaNjNDbHF4ZDRZdHNNY3BnWE8vYk9lWjhqcm5SeUhTc0VlWVJENjE4PSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJwakFQL2ZCb1pOTG1iajh0TEJSNXF6Wm43Z043RjU0bHhMbzdXcXk3R0c4PSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImFMVkN5aXlxVWpuNGkrVnNrVTRpTjlOSmdJUW5ValN1NCt4TkNSVHZISDg9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkNWMy9JUVRFMnhwc1hpTVBOZnhSNGpIQzh1V2liaDAzZ1hKaGtPTjk0aUU9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiNENRZHJPZjMyOUwwUytWWGdKV0UzbmxVVDczUXM1MlZRK1llREF2K1VYVT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoieFhkcSt6bTBIeGtIMnVRTWQrTkdEMVBGZzAzNW5zcUx3dGZsUWlrbnJsOD0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Imt5UkducDlLN3VNK3lkSk1Pc3A0UjVLTVBEWXZkRXFMT3RpMERFQ3hpZEZWcU1ONjI3YjM1eElFYktWR2t6SEpxL3kvL1ZrcG0wQmVqY2JicitFaUFnPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjAsImFkdlNlY3JldEtleSI6IlFDZU9rTmtVMDRyWEM5dVQ4UE9SOHJwZUUySm1ZWXZoUVFjK0RtRy9sRjg9IiwicHJvY2Vzc2VkSGlzdG9yeU1lc3NhZ2VzIjpbXSwibmV4dFByZUtleUlkIjozMSwiZmlyc3RVbnVwbG9hZGVkUHJlS2V5SWQiOjMxLCJhY2NvdW50U3luY0NvdW50ZXIiOjAsImFjY291bnRTZXR0aW5ncyI6eyJ1bmFyY2hpdmVDaGF0cyI6ZmFsc2V9LCJkZXZpY2VJZCI6IlllQkJhSFdnUVdpc0VtSkpWQmVPcHciLCJwaG9uZUlkIjoiZTYzYThmNDQtZjY2OC00ZmE2LThjMzEtYmQyMDY4OTFhZTE0IiwiaWRlbnRpdHlJZCI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6Ii9zamtHaTZjK2R6TW9uNUszK2MzZW9BRkVyZz0ifSwicmVnaXN0ZXJlZCI6dHJ1ZSwiYmFja3VwVG9rZW4iOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJkOHV0dGxjK1p1YVRQVEhDdXI3M2pvSWhuSUk9In0sInJlZ2lzdHJhdGlvbiI6e30sInBhaXJpbmdDb2RlIjoiNzQ4TkZSRkoiLCJtZSI6eyJpZCI6IjI1NDc0MzcwNjAxMDoyOUBzLndoYXRzYXBwLm5ldCJ9LCJhY2NvdW50Ijp7ImRldGFpbHMiOiJDSi9RN2NVR0VOemVxclFHR0FFZ0FDZ0EiLCJhY2NvdW50U2lnbmF0dXJlS2V5IjoiMzJkQU9CYTlyQ2VIMWFmSHljVnExOWhLVU1HUkM2aE9EcTBRVlljT0QzST0iLCJhY2NvdW50U2lnbmF0dXJlIjoiK1pmSngyVFA3aXUxSGZxYVJCWFJiV2FwVUgyQWhvTU5kYTBhUnZpVG04ckhnbzNwclVpMEZlcSs3MlJCb1R2SlMzZ1h2eCt3UGppWVlaYnhDMWg5Q2c9PSIsImRldmljZVNpZ25hdHVyZSI6IkcwbE9zNlNrRlBUY0c1dDdHZDhYUGk0MjVDeHB3VXpjOUd5L3haY2UwYVlsRFFnd2owWWE0ZjEzNGErQURraGlZdy9MSDR0R3RLZFZudC9YK0xWQkRnPT0ifSwic2lnbmFsSWRlbnRpdGllcyI6W3siaWRlbnRpZmllciI6eyJuYW1lIjoiMjU0NzQzNzA2MDEwOjI5QHMud2hhdHNhcHAubmV0IiwiZGV2aWNlSWQiOjB9LCJpZGVudGlmaWVyS2V5Ijp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiQmQ5blFEZ1d2YXduaDlXbng4bkZhdGZZU2xEQmtRdW9UZzZ0RUZXSERnOXkifX1dLCJwbGF0Zm9ybSI6ImFuZHJvaWQiLCJsYXN0QWNjb3VudFN5bmNUaW1lc3RhbXAiOjE3MjAzNjQ5MDV9"  // PUT your SESSION_ID 


module.exports = {

  menu: process.env.MENU || "", /**  Available @MENU @Schemes 1: Aztec_Md, 2: A17_Md, 3: Suhail-Md Default ---------- If Not Choose then it Randomely Pic One Of Them Each time **/

  HANDLERS: process.env.PREFIX  || ".",
  BRANCH  : process.env.BRANCH  || "main",
  VERSION : process.env.VERSION || "1.3.9",
  caption : global.caption || "『 𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉-ᴍᴅ 』" , // ```『 𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉-ᴍᴅ 』```", //*『𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉』*\n tiktok.com/@silva.edits6"),
 
  author : process.env.PACK_AUTHER|| "",
  packname: process.env.PACK_NAME || "",
  botname : process.env.BOT_NAME  || "𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉-ᴍᴅ",
  ownername:process.env.OWNER_NAME|| "𝑺𝒊𝒍𝒗𝒂 𝒕𝒆𝒄𝒉",


  errorChat : process.env.ERROR_CHAT || "254700143167",
  KOYEB_API : process.env.KOYEB_API  || "false",

  REMOVE_BG_KEY : process.env.REMOVE_BG_KEY  || "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY || "",
  HEROKU_API_KEY: process.env.HEROKU_API_KEY || "",
  HEROKU_APP_NAME:process.env.HEROKU_APP_NAME|| "",
  antilink_values:process.env.ANTILINK_VALUES|| "all",
  HEROKU: process.env.HEROKU_APP_NAME && process.env.HEROKU_API_KEY,


  WORKTYPE: process.env.WORKTYPE || process.env.MODE|| "public",
  LANG: ( process.env.THEME ||  "SILVA"  ).toUpperCase(),



};



global.ELEVENLAB_API_KEY = process.env.ELEVENLAB_API_KEY || "";
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
