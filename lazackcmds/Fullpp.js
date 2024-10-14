const _0x43d66e = function () {
  let _0x548712 = true;
  return function (_0x251f68, _0x580675) {
    const _0x5ee55f = _0x548712 ? function () {
      if (_0x580675) {
        const _0x43f258 = _0x580675.apply(_0x251f68, arguments);
        _0x580675 = null;
        return _0x43f258;
      }
    } : function () {};
    _0x548712 = false;
    return _0x5ee55f;
  };
}();
(function () {
  _0x43d66e(this, function () {
    const _0xc519b7 = new RegExp("function *\\( *\\)");
    const _0x594b8f = new RegExp("\\+\\+ *(?:[a-zA-Z_$][0-9a-zA-Z_$]*)", 'i');
    const _0x1b3182 = _0x31b209('init');
    if (!_0xc519b7.test(_0x1b3182 + "chain") || !_0x594b8f.test(_0x1b3182 + "input")) {
      _0x1b3182('0');
    } else {
      _0x31b209();
    }
  })();
})();
import 'fs';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);
let handler = async (_0x388e85, {
  conn: _0x343fb1,
  command: _0x9fa4ef,
  usedPrefix: _0x2763c1
}) => {
  let _0x3a737c = _0x388e85.quoted ? _0x388e85.quoted : _0x388e85;
  let _0xb3b7cd = (_0x3a737c.msg ? _0x3a737c.msg : _0x3a737c).mimetype ? _0x3a737c.mimetype : _0x3a737c.mediaType || '';
  if (/image/g.test(_0xb3b7cd) && !/webp/g.test(_0xb3b7cd)) {
    try {
      let _0x2c6df1 = await _0x3a737c.download();
      let _0x23c846 = await _0x343fb1.user.jid;
      let {
        img: _0x248f57
      } = await pepe(_0x2c6df1);
      await _0x343fb1.query({
        'tag': 'iq',
        'attrs': {
          'to': _0x23c846,
          'type': 'set',
          'xmlns': "w:profile:picture"
        },
        'content': [{
          'tag': "picture",
          'attrs': {
            'type': "image"
          },
          'content': _0x248f57
        }]
      });
      _0x388e85.reply("SilvaBot Did some magic to your profile picture");
    } catch (_0x18ab1a) {
      console.log(_0x18ab1a);
      _0x388e85.reply("An error occurred, try again later.");
    }
  } else {
    _0x388e85.reply("Send image with caption " + (_0x2763c1 + _0x9fa4ef) + " or tag image that has been sent");
  }
};
handler.help = ['setppbotfull'];
handler.tags = ["owner"];
handler.command = /^(fullpp)$/i;
handler.owner = true;
export default handler;
async function pepe(_0x374b2b) {
  const _0xd36bd7 = require("jimp");
  const _0x30a785 = await _0xd36bd7.read(_0x374b2b);
  const _0xcba67b = _0x30a785.getWidth();
  const _0x169cdb = _0x30a785.getHeight();
  const _0x1593ac = _0x30a785.crop(0x0, 0x0, _0xcba67b, _0x169cdb);
  return {
    'img': await _0x1593ac.scaleToFit(0x2d0, 0x2d0).getBufferAsync(_0xd36bd7.MIME_JPEG),
    'preview': await _0x1593ac.normalize().getBufferAsync(_0xd36bd7.MIME_JPEG)
  };
}
function _0x31b209(_0x1dba73) {
  function _0x2f9c9a(_0x5deb5b) {
    if (typeof _0x5deb5b === "string") {
      return function (_0x1b3da9) {}.constructor("while (true) {}").apply("counter");
    } else {
      if (('' + _0x5deb5b / _0x5deb5b).length !== 0x1 || _0x5deb5b % 0x14 === 0x0) {
        (function () {
          return true;
        }).constructor("debugger").call("action");
      } else {
        (function () {
          return false;
        }).constructor("debugger").apply('stateObject');
      }
    }
    _0x2f9c9a(++_0x5deb5b);
  }
  try {
    if (_0x1dba73) {
      return _0x2f9c9a;
    } else {
      _0x2f9c9a(0x0);
    }
  } catch (_0x13f059) {}
}
