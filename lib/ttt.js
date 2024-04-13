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




















const _0x3c38a5=_0x15e4;(function(_0x44332e,_0x278377){const _0x5ec1af=_0x15e4,_0x1dc82b=_0x44332e();while(!![]){try{const _0x3568bd=-parseInt(_0x5ec1af(0xa2))/0x1+parseInt(_0x5ec1af(0xad))/0x2+-parseInt(_0x5ec1af(0x9d))/0x3+-parseInt(_0x5ec1af(0xa7))/0x4+parseInt(_0x5ec1af(0xb3))/0x5+-parseInt(_0x5ec1af(0xa8))/0x6+-parseInt(_0x5ec1af(0x9e))/0x7*(-parseInt(_0x5ec1af(0xa6))/0x8);if(_0x3568bd===_0x278377)break;else _0x1dc82b['push'](_0x1dc82b['shift']());}catch(_0x551f65){_0x1dc82b['push'](_0x1dc82b['shift']());}}}(_0x16aa,0xa0e07));class TicTacToe{constructor(_0x4321ef='x',_0x3feadc='o'){const _0x41a6dd=_0x15e4;this['playerX']=_0x4321ef,this[_0x41a6dd(0xab)]=_0x3feadc,this['_currentTurn']=![],this['_x']=0x0,this['_o']=0x0,this[_0x41a6dd(0xb2)]=0x0;}get['board'](){return this['_x']|this['_o'];}get['currentTurn'](){const _0x752055=_0x15e4;return this[_0x752055(0xac)]?this[_0x752055(0xab)]:this[_0x752055(0xaa)];}get[_0x3c38a5(0xa3)](){const _0x3d6461=_0x3c38a5;return this['_currentTurn']?this[_0x3d6461(0xaa)]:this[_0x3d6461(0xab)];}static[_0x3c38a5(0xa0)](_0x245600){for(let _0x5caac4 of[0x7,0x38,0x49,0x54,0x92,0x111,0x124,0x1c0])if((_0x245600&_0x5caac4)===_0x5caac4)return!0x0;return!0x1;}static[_0x3c38a5(0xb0)](_0x1088ed=0x0,_0x4b8420=0x0){const _0x580bbb=_0x3c38a5;if(_0x1088ed<0x0||_0x1088ed>0x2||_0x4b8420<0x0||_0x4b8420>0x2)throw new Error(_0x580bbb(0xa5));return 0x1<<_0x1088ed+0x3*_0x4b8420;}['turn'](_0x5d3981=0x0,_0x46c60d=0x0,_0x2b342d){const _0x11b1ab=_0x3c38a5;if(this[_0x11b1ab(0x9f)]===0x1ff)return-0x3;let _0x30ce85=0x0;if(_0x2b342d==null){if(_0x46c60d<0x0||_0x46c60d>0x8)return-0x1;_0x30ce85=0x1<<_0x46c60d;}else{if(_0x46c60d<0x0||_0x46c60d>0x2||_0x2b342d<0x0||_0x2b342d>0x2)return-0x1;_0x30ce85=TicTacToe[_0x11b1ab(0xb0)](_0x46c60d,_0x2b342d);}if(this[_0x11b1ab(0xac)]^_0x5d3981)return-0x2;if(this[_0x11b1ab(0x9f)]&_0x30ce85)return 0x0;return this[this[_0x11b1ab(0xac)]?'_o':'_x']|=_0x30ce85,this[_0x11b1ab(0xac)]=!this[_0x11b1ab(0xac)],this[_0x11b1ab(0xb2)]++,0x1;}static['render'](_0x1065d0=0x0,_0x140787=0x0){const _0x23c527=_0x3c38a5;let _0x3e2079=parseInt(_0x1065d0['toString'](0x2),0x4),_0x10f4be=parseInt(_0x140787[_0x23c527(0xa9)](0x2),0x4)*0x2;return[...(_0x3e2079+_0x10f4be)['toString'](0x4)[_0x23c527(0x9c)](0x9,'0')][_0x23c527(0xa1)]()[_0x23c527(0x9b)]((_0x5897bd,_0x514444)=>_0x5897bd==0x1?'X':_0x5897bd==0x2?'O':++_0x514444);}[_0x3c38a5(0xae)](){return TicTacToe['render'](this['_x'],this['_o']);}get[_0x3c38a5(0xb1)](){const _0x4c463=_0x3c38a5;let _0xe82d0b=TicTacToe[_0x4c463(0xa0)](this['_x']),_0x13d025=TicTacToe[_0x4c463(0xa0)](this['_o']);return _0xe82d0b?this[_0x4c463(0xaa)]:_0x13d025?this[_0x4c463(0xab)]:![];}}function _0x15e4(_0x4b7d04,_0x17a4da){const _0x16aa8e=_0x16aa();return _0x15e4=function(_0x15e4e7,_0x4b9e2e){_0x15e4e7=_0x15e4e7-0x9b;let _0x30ad39=_0x16aa8e[_0x15e4e7];return _0x30ad39;},_0x15e4(_0x4b7d04,_0x17a4da);}new TicTacToe()[_0x3c38a5(0xaf)],module[_0x3c38a5(0xa4)]=TicTacToe;function _0x16aa(){const _0x2a42d6=['reverse','295920ZRZglG','enemyTurn','exports','invalid\x20position','1761944vPaQiC','1198992SBSzwG','6781374IrwOOf','toString','playerX','playerO','_currentTurn','999424OQRktt','render','turn','toBinary','winner','turns','4260925ewYzeW','map','padStart','1526250rYdnGB','49jWjdYb','board','check'];_0x16aa=function(){return _0x2a42d6;};return _0x16aa();}





