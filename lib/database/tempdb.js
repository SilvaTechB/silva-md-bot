/**
/**
//════════════════════════════════════════════════════════════════════════════════════════════//
//                                                                                            //
//                                ＷＨＡＴＳＡＰＰ ＢＯＴ－ＭＤ ＢＥＴＡ                          //
//                                                                                            // 
//                                         Ｖ：2．5．0                                         // 
//           ▄▄    ▄▄                                                 ▄▄                      //
//           ██  ▀███                                               ▀███                      //
//                 ██                                                 ██                      //
//   ▄██▀██████    ██ ▀██▀   ▀██▀ ▄█▀██▄     ▀████████▄█████▄    ▄█▀▀███                      //
//   ██   ▀▀ ██    ██   ██   ▄█  ██   ██       ██    ██    ██  ▄██    ██                      //
//   ▀█████▄ ██    ██    ██ ▄█    ▄█████       ██    ██    ██  ███    ██                      //
//   █▄   ██ ██    ██     ███    ██   ██       ██    ██    ██  ▀██    ██                      //
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

  const mongoose = require('mongoose');  
  const TempDb = new mongoose.Schema({
  id: { type: String,  unique: true ,required: true, default:"Suhail_Md"},
  data : { type: Object, default: {} } });  
  const dbtemp = mongoose.model("dbtemp", TempDb)
  module.exports = { dbtemp }
  
