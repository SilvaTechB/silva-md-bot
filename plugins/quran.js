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

































const _0x2ed59a=_0x3888;function _0x3888(_0x5b1663,_0x37e4af){const _0x31ea91=_0x31ea();return _0x3888=function(_0x388838,_0x521bb4){_0x388838=_0x388838-0x115;let _0x7fc2e8=_0x31ea91[_0x388838];return _0x7fc2e8;},_0x3888(_0x5b1663,_0x37e4af);}(function(_0x1e99e1,_0x250267){const _0x2fa1ed=_0x3888,_0x1bfe44=_0x1e99e1();while(!![]){try{const _0x592d3f=-parseInt(_0x2fa1ed(0x116))/0x1*(-parseInt(_0x2fa1ed(0x124))/0x2)+-parseInt(_0x2fa1ed(0x130))/0x3+parseInt(_0x2fa1ed(0x11d))/0x4*(-parseInt(_0x2fa1ed(0x117))/0x5)+-parseInt(_0x2fa1ed(0x123))/0x6*(parseInt(_0x2fa1ed(0x12b))/0x7)+-parseInt(_0x2fa1ed(0x122))/0x8*(parseInt(_0x2fa1ed(0x131))/0x9)+parseInt(_0x2fa1ed(0x119))/0xa+-parseInt(_0x2fa1ed(0x118))/0xb*(-parseInt(_0x2fa1ed(0x11a))/0xc);if(_0x592d3f===_0x250267)break;else _0x1bfe44['push'](_0x1bfe44['shift']());}catch(_0x598e58){_0x1bfe44['push'](_0x1bfe44['shift']());}}}(_0x31ea,0xbbd35));function _0x31ea(){const _0x177ad8=['Error:\x20','\x0a\x0a🔮\x20*Explanation\x20(English):*\x0a\x0a','Couldn\x27t\x20find\x20surah\x20with\x20number\x20or\x20name\x20\x22','status','12971AYkXuD','recitation.mp3','reply','error','quran','1302030tIeVxS','518418eeAqUd','\x0a\x0a🔮\x20*Explanation\x20(Urdu):*\x0a\x0a','type','find','message','chat',')*\x0a\x0aType:\x20','\x0a🕌\x20*Quran:\x20The\x20Holy\x20Book*\x0a\x0a📜\x20*Surah\x20','number','full','long','help','asma','43082DHlgbS','15CTZfiu','24176658fHKQkS','1118960KcWFcX','24XOVidm','json','data','1342780ZPdFFW','toLowerCase','recitation','text','tafsir','208WpvWyl','3984WNdNtd','20IhDjnQ','split','tags'];_0x31ea=function(){return _0x177ad8;};return _0x31ea();}import _0x22e09a from'node-fetch';import{translate}from'@vitalets/google-translate-api';let quranSurahHandler=async(_0x4399c6,{conn:_0x2ae649})=>{const _0x240ea1=_0x3888;try{let _0x1be24d=_0x4399c6[_0x240ea1(0x120)][_0x240ea1(0x125)]('\x20')[0x1];if(!_0x1be24d)throw new Error('Please\x20specify\x20the\x20surah\x20number\x20or\x20name');let _0x5c77fd=await _0x22e09a('https://quran-endpoint.vercel.app/quran'),_0x4a24af=await _0x5c77fd[_0x240ea1(0x11b)](),_0x12fbbf=_0x4a24af[_0x240ea1(0x11c)][_0x240ea1(0x134)](_0x2ead0a=>_0x2ead0a['number']===Number(_0x1be24d)||_0x2ead0a[_0x240ea1(0x115)]['ar']['short']['toLowerCase']()===_0x1be24d[_0x240ea1(0x11e)]()||_0x2ead0a[_0x240ea1(0x115)]['en']['short'][_0x240ea1(0x11e)]()===_0x1be24d['toLowerCase']());if(!_0x12fbbf)throw new Error(_0x240ea1(0x129)+_0x1be24d+'\x22');let _0x225322=await _0x22e09a('https://quran-endpoint.vercel.app/quran/'+_0x12fbbf[_0x240ea1(0x139)]);if(!_0x225322['ok']){let _0x13522e=await _0x225322[_0x240ea1(0x11b)]();throw new Error('API\x20request\x20failed\x20with\x20status\x20'+_0x225322[_0x240ea1(0x12a)]+'\x20and\x20message\x20'+_0x13522e[_0x240ea1(0x135)]);}let _0x20517f=await _0x225322[_0x240ea1(0x11b)](),_0x5e7dd1=await translate(_0x20517f[_0x240ea1(0x11c)][_0x240ea1(0x121)]['id'],{'to':'ur','autoCorrect':!![]}),_0x16a6a8=await translate(_0x20517f[_0x240ea1(0x11c)][_0x240ea1(0x121)]['id'],{'to':'en','autoCorrect':!![]}),_0x3f947a=_0x240ea1(0x138)+_0x20517f[_0x240ea1(0x11c)][_0x240ea1(0x139)]+':\x20'+_0x20517f['data']['asma']['ar'][_0x240ea1(0x13b)]+'\x20('+_0x20517f[_0x240ea1(0x11c)][_0x240ea1(0x115)]['en'][_0x240ea1(0x13b)]+_0x240ea1(0x137)+_0x20517f[_0x240ea1(0x11c)][_0x240ea1(0x133)]['en']+'\x0a\x0aNumber\x20of\x20verses:\x20'+_0x20517f[_0x240ea1(0x11c)]['ayahCount']+_0x240ea1(0x132)+_0x5e7dd1[_0x240ea1(0x120)]+_0x240ea1(0x128)+_0x16a6a8[_0x240ea1(0x120)];_0x4399c6[_0x240ea1(0x12d)](_0x3f947a),_0x20517f[_0x240ea1(0x11c)][_0x240ea1(0x11f)][_0x240ea1(0x13a)]&&_0x2ae649['sendFile'](_0x4399c6[_0x240ea1(0x136)],_0x20517f[_0x240ea1(0x11c)]['recitation'][_0x240ea1(0x13a)],_0x240ea1(0x12c),null,_0x4399c6,!![],{'type':'audioMessage','ptt':!![]});}catch(_0x5cb45f){console[_0x240ea1(0x12e)](_0x5cb45f),_0x4399c6[_0x240ea1(0x12d)](_0x240ea1(0x127)+_0x5cb45f['message']);}};quranSurahHandler[_0x2ed59a(0x13c)]=['quran\x20[surah_number|surah_name]'],quranSurahHandler[_0x2ed59a(0x126)]=[_0x2ed59a(0x12f),'surah'],quranSurahHandler['command']=[_0x2ed59a(0x12f),'surah'];export default quranSurahHandler;
