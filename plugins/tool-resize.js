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






























const _0x2c4897=_0x55f1;(function(_0x142e1d,_0x5a3e6e){const _0x1e47a3=_0x55f1,_0x9fce2a=_0x142e1d();while(!![]){try{const _0x256340=-parseInt(_0x1e47a3(0x73))/0x1+parseInt(_0x1e47a3(0x74))/0x2+parseInt(_0x1e47a3(0x7b))/0x3+-parseInt(_0x1e47a3(0x82))/0x4+-parseInt(_0x1e47a3(0x7e))/0x5*(parseInt(_0x1e47a3(0x71))/0x6)+-parseInt(_0x1e47a3(0x79))/0x7*(parseInt(_0x1e47a3(0x7c))/0x8)+parseInt(_0x1e47a3(0x78))/0x9*(parseInt(_0x1e47a3(0x76))/0xa);if(_0x256340===_0x5a3e6e)break;else _0x9fce2a['push'](_0x9fce2a['shift']());}catch(_0xbe98){_0x9fce2a['push'](_0x9fce2a['shift']());}}}(_0x1199,0xe7dd0));import _0x117bd5 from'../lib/uploadImage.js';function _0x1199(){const _0x2cc979=['8qbsJOZ','download','5ZjvAkS','Here\x20you\x20go','🔢\x20Only\x20numbers\x20are\x20allowed.','sendMessage','3682976fVpCSJ','msg','quoted','tags','1555542MjfXDf','tools','185103BpOpFw','281840mEKlCc','mimetype','121190zcknyM','chat','711RxGzaf','3971359DcvBnv','test','5351496rRtrls'];_0x1199=function(){return _0x2cc979;};return _0x1199();}import _0x2ef5d9 from'node-fetch';let handler=async(_0x1cf05c,{conn:_0x375249,usedPrefix:_0x378a64,command:_0x5e24e6,args:_0x576e53,text:_0x54f9fb})=>{const _0x57722e=_0x55f1;let _0x5bfc05=_0x1cf05c[_0x57722e(0x84)]?_0x1cf05c['quoted']:_0x1cf05c,_0x30c81a=(_0x5bfc05[_0x57722e(0x83)]||_0x5bfc05)[_0x57722e(0x75)]||'';if(!_0x30c81a)throw'⚠️️\x20Reply\x20to\x20an\x20image\x20or\x20video.';if(!_0x54f9fb)throw'⚠️️\x20Enter\x20the\x20new\x20file\x20size\x20for\x20the\x20image/video.';if(isNaN(_0x54f9fb))throw _0x57722e(0x80);if(!/image\/(jpe?g|png)|video|document/['test'](_0x30c81a))throw'⚠️️\x20Unsupported\x20format.';let _0x7fdde2=await _0x5bfc05[_0x57722e(0x7d)](),_0x45bf0a=await _0x117bd5(_0x7fdde2);if(/image\/(jpe?g|png)/[_0x57722e(0x7a)](_0x30c81a))_0x375249[_0x57722e(0x81)](_0x1cf05c['chat'],{'image':{'url':_0x45bf0a},'caption':'Here\x20you\x20go','fileLength':''+_0x54f9fb,'mentions':[_0x1cf05c['sender']]},{'ephemeralExpiration':0x18*0xe10,'quoted':_0x1cf05c});else{if(/video/[_0x57722e(0x7a)](_0x30c81a))return _0x375249[_0x57722e(0x81)](_0x1cf05c[_0x57722e(0x77)],{'video':{'url':_0x45bf0a},'caption':_0x57722e(0x7f),'fileLength':''+_0x54f9fb,'mentions':[_0x1cf05c['sender']]},{'ephemeralExpiration':0x18*0xe10,'quoted':_0x1cf05c});}};function _0x55f1(_0xcccb3f,_0x50fb2d){const _0x1199d9=_0x1199();return _0x55f1=function(_0x55f186,_0x432810){_0x55f186=_0x55f186-0x70;let _0x2662c0=_0x1199d9[_0x55f186];return _0x2662c0;},_0x55f1(_0xcccb3f,_0x50fb2d);}handler[_0x2c4897(0x70)]=[_0x2c4897(0x72)],handler['help']=['length\x20<amount>'],handler['command']=/^(length|filelength|edittamaño|totamaño|tamaño)$/i;export default handler;
