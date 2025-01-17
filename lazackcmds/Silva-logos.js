import _0x8dd0bd from 'node-fetch';
let handler = async (_0x2c63c8, {
  conn: _0x3f272f,
  args: _0x35d1a6,
  text: _0x53ef65,
  usedPrefix: _0x556804,
  command: _0x5ddc2d
}) => {
  let _0x3cf1a0 = "✳️ " + mssg.notext + "\n\n📌 " + mssg.example + ": *" + (_0x556804 + _0x5ddc2d) + "* SILVA BOTS";
  _0x2c63c8.react(rwait);
  let _0x334d7c;
  switch (_0x5ddc2d) {
    case "papercut":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/papercut?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "logomaker":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/logomaker?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "cartoon":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/cartoonstyle?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "writetext":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/writetext?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "glossy":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/glossysilver?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "bpstyle":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/blackpinkstyle?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "pixelglitch":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/pixelglitch?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "advancedglow":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/advancedglow?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "lighteffect":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/lighteffect?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "texteffect":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/texteffect?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "galaxy":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/galaxy?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "beach":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/summerbeach?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    case "clouds":
      if (!_0x53ef65) {
        throw _0x3cf1a0;
      }
      _0x334d7c = "https://api.giftedtech.web.id/api/ephoto360/effectclouds?apikey=gifted-md&text=" + encodeURIComponent(_0x53ef65);
      break;
    default:
      throw "Command not recognized.";
  }
  try {
    const _0x514625 = await _0x8dd0bd(_0x334d7c);
    const _0x3a39a6 = await _0x514625.json();
    if (_0x3a39a6.success && _0x3a39a6.result && _0x3a39a6.result.image_url) {
      _0x3f272f.sendFile(_0x2c63c8.chat, _0x3a39a6.result.image_url, "logo.png", "*𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 © SILVA MD BOT*", _0x2c63c8);
      _0x2c63c8.react(done);
    } else {
      throw "Failed to generate the image. Please try again later.";
    }
  } catch (_0x4201dd) {
    console.error("Error fetching image:", _0x4201dd);
    _0x2c63c8.reply("An error occurred while fetching the image. Please try again later.");
  }
};
handler.help = ["papercut", "logomaker", "bpstyle", "writetext", "glossy", "cartoon", "pixelglitch", "advancedglow", "lighteffect", "texteffect", "galaxy", "beach", "clouds"];
handler.tags = ["maker"];
handler.command = /^(papercut|logomaker|bpstyle|pixelglitch|advancedglow|lighteffect|texteffect|galaxy|writetext|glossy|cartoon|beach|clouds)$/i;
export default handler;
