let handler = async (_0x56f898, {
  conn: _0x287808,
  text: _0x251204
}) => {
  const _0x2cf6b2 = Buffer.from('RGV2ZWxvcGVkIGJ5', "base64");
  const _0x4d4c50 = Buffer.from("U2hpem8gVGhl", "base64");
  const _0x3a1bd2 = Buffer.from('VGVjaGllIChTaGl6byBEZXZzKSDinaTvuI/inKg=', 'base64');
  const _0x2e3075 = Buffer.from("KlN1cHBvcnQ6KiA=", "base64");
  const _0x278c9d = Buffer.from("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT1zaGl6byt0aGUrdGVjaGll", "base64");
  let _0x59c07d = _0x2cf6b2.toString('utf-8');
  let _0x167bc1 = _0x4d4c50.toString("utf-8");
  let _0x4afd2b = _0x3a1bd2.toString("utf-8");
  let _0x385cb6 = _0x2e3075.toString("utf-8");
  let _0x2453cb = _0x278c9d.toString("utf-8");
  let _0x90ed4c = '' + (_0x59c07d + " " + _0x167bc1 + _0x4afd2b + "\n" + _0x385cb6 + _0x2453cb);
  if (isNaN(_0x251204)) {
    var _0x4230e2 = _0x251204.split`@`[0x1];
  } else {
    if (!isNaN(_0x251204)) {
      var _0x4230e2 = _0x251204;
    }
  }
  if (!_0x251204 && !_0x56f898.quoted) {
    return _0x287808.reply(_0x56f898.chat, "You have not mentioned anyone ❌. Tag a person that you want to reject their proposal🙂\n\n" + _0x90ed4c, _0x56f898);
  }
  if (isNaN(_0x4230e2)) {
    return _0x287808.reply(_0x56f898.chat, "The Number you have enter is not valid 🌎\n\n" + _0x90ed4c, _0x56f898);
  }
  if (_0x4230e2.length > 0xf) {
    return _0x287808.reply(_0x56f898.chat, "Number format is not valid ❌\n\n" + _0x90ed4c, _0x56f898);
  }
  try {
    if (_0x251204) {
      var _0x401305 = _0x4230e2 + "@s.whatsapp.net";
    } else {
      if (_0x56f898.quoted.sender) {
        var _0x401305 = _0x56f898.quoted.sender;
      } else {
        if (_0x56f898.mentions) {
          var _0x401305 = _0x4230e2 + "@s.whatsapp.net";
        }
      }
    }
  } catch (_0x35c3c4) {} finally {
    if (!_0x401305) {
      return _0x287808.reply(_0x56f898.chat, "Target person not found ❌, may have left or not a member of this group 👀\n\n" + _0x90ed4c, _0x56f898);
    }
    if (_0x401305 === _0x56f898.sender) {
      return _0x287808.reply(_0x56f898.chat, "You cant reject loving yourself 💖😀\n\n" + _0x90ed4c, _0x56f898);
    }
    if (_0x401305 === _0x287808.user.jid) {
      return _0x287808.reply(_0x56f898.chat, "You cant date me as i'm WhatsApp AI 🤖\n\n" + _0x90ed4c, _0x56f898);
    }
    if (global.db.data.users[_0x401305].lover != _0x56f898.sender) {
      let _0x2cc1a3 = global.db.data.users[_0x401305].lover;
      let _0x3d1aee = global.db.data.users[_0x2cc1a3].name;
      _0x287808.reply(_0x56f898.chat, _0x3d1aee + " is not loving you. So how you can reject him 😂\n\n" + _0x90ed4c, _0x56f898, {
        'mentions': [_0x401305]
      });
    } else {
      let _0x2af26b = global.db.data.users[_0x401305].lover;
      let _0x59003e = global.db.data.users[_0x2af26b].name;
      global.db.data.users[_0x401305].lover = '';
      _0x287808.reply(_0x56f898.chat, "Succesfully rejected " + _0x59003e + " and Removed from your heart 🙂💔\n\n" + _0x90ed4c, _0x56f898, {
        'mentions': [_0x401305]
      });
    }
  }
};
handler.help = ["reject *@tag*"];
handler.tags = ["relation"];
handler.command = /^(reject)$/i;
handler.group = true;
export default handler;
