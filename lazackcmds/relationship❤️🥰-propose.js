let handler = async (_0x11470a, {
  conn: _0x36637b,
  text: _0x390f3e,
  usedPrefix: _0x98f943
}) => {
  const _0x41f2f2 = Buffer.from("RGV2ZWxvcGVkIGJ5", "base64");
  const _0x34de2c = Buffer.from("U2hpem8gVGhl", "base64");
  const _0x394c18 = Buffer.from('VGVjaGllIChTaGl6byBEZXZzKSDinaTvuI/inKg=', "base64");
  const _0x257b97 = Buffer.from('KlN1cHBvcnQ6KiA=', "base64");
  const _0x1f9218 = Buffer.from("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT1zaGl6byt0aGUrdGVjaGll", "base64");
  let _0x4f023f = _0x41f2f2.toString('utf-8');
  let _0x2f21fb = _0x34de2c.toString("utf-8");
  let _0x4ade7a = _0x394c18.toString("utf-8");
  let _0x5152e3 = _0x257b97.toString('utf-8');
  let _0x597d69 = _0x1f9218.toString("utf-8");
  let _0x25e5cd = '' + (_0x4f023f + " " + _0x2f21fb + _0x4ade7a + "\n" + _0x5152e3 + _0x597d69);
  if (isNaN(_0x390f3e)) {
    var _0x35a69b = _0x390f3e.split`@`[0x1];
  } else {
    if (!isNaN(_0x390f3e)) {
      var _0x35a69b = _0x390f3e;
    }
  }
  let _0x54ec77 = _0x11470a.sender;
  if (!_0x390f3e && !_0x11470a.quoted) {
    return _0x36637b.reply(_0x11470a.chat, "You have not mentioned anyone ❌. Tag a person that you want to reject their proposal🙂\n\n" + _0x25e5cd, _0x11470a);
  }
  if (isNaN(_0x35a69b)) {
    return _0x36637b.reply(_0x11470a.chat, "The Number you have enter is not valid 🌎\n\n" + _0x25e5cd, _0x11470a);
  }
  if (_0x35a69b.length > 0xf) {
    return _0x36637b.reply(_0x11470a.chat, "Number format is not valid ❌\n\n" + _0x25e5cd, _0x11470a);
  }
  try {
    if (_0x390f3e) {
      var _0x7ef4f3 = _0x35a69b + "@s.whatsapp.net";
    } else {
      if (_0x11470a.quoted.sender) {
        var _0x7ef4f3 = _0x11470a.quoted.sender;
      } else {
        if (_0x11470a.mentions) {
          var _0x7ef4f3 = _0x35a69b + "@s.whatsapp.net";
        }
      }
    }
  } catch (_0x3cc6fa) {} finally {
    if (!_0x7ef4f3) {
      return _0x36637b.reply(_0x11470a.chat, "Target person not found ❌, may have left or not a member of this group 👀\n\n" + _0x25e5cd, _0x11470a);
    }
    if (_0x7ef4f3 === _0x11470a.sender) {
      return _0x36637b.reply(_0x11470a.chat, "You cant reject loving yourself 💖😀\n\n" + _0x25e5cd, _0x11470a);
    }
    if (_0x7ef4f3 === _0x36637b.user.jid) {
      return _0x36637b.reply(_0x11470a.chat, "You cant date me as i'm WhatsApp AI 🤖\n\n" + _0x25e5cd, _0x11470a);
    }
    if (typeof global.db.data.users[_0x7ef4f3] == 'undefined') {
      return _0x11470a.reply("Registration in Bot is required before performing this action 💯😳\n\n" + _0x25e5cd);
    }
    if (global.db.data.users[_0x11470a.sender].lover != '' && global.db.data.users[global.db.data.users[_0x11470a.sender].lover].lover == _0x11470a.sender && global.db.data.users[_0x11470a.sender].lover != _0x7ef4f3) {
      var _0x29dceb = Math.ceil(global.db.data.users[_0x11470a.sender].exp / 0x3e8 * 0x14);
      global.db.data.users[_0x11470a.sender].exp -= _0x29dceb;
      let _0x9ba4b9 = global.db.data.users[_0x54ec77].lover;
      let _0x598d3c = global.db.data.users[_0x9ba4b9].name;
      await _0x36637b.reply(_0x9ba4b9 + "@s.whatsapp.net", "Hey " + _0x598d3c + "\nSorry to say that your partner is trying to propose @" + _0x7ef4f3.split('@')[0x0] + " in the group\nWe not allowed your partner to propose\nKeep your Love & beloved one Safe 🙂🥺\n\n" + _0x25e5cd, _0x11470a, {
        'mentions': [_0x7ef4f3]
      });
      _0x36637b.reply(_0x11470a.chat, "You are already dating " + _0x598d3c + "\nBe Loyal and Love " + _0x598d3c + " because " + _0x598d3c + " loves you more than themself 😘💕 And You are lucky to have " + _0x598d3c + " in your life 🔮❤️✨\n\n" + _0x25e5cd, _0x11470a);
    } else {
      if (global.db.data.users[_0x7ef4f3].lover != '') {
        var _0x2ab047 = global.db.data.users[_0x7ef4f3].lover;
        if (global.db.data.users[_0x2ab047].lover == _0x7ef4f3) {
          var _0x4712a7 = Math.ceil(global.db.data.users[_0x11470a.sender].exp / 0x3e8 * 0x14);
          global.db.data.users[_0x11470a.sender].exp -= _0x4712a7;
          if (_0x11470a.sender == _0x2ab047 && global.db.data.users[_0x11470a.sender].lover == _0x7ef4f3) {}
          let _0xcdeea = global.db.data.users[_0x7ef4f3].lover;
          let _0x25941c = global.db.data.users[_0xcdeea].name;
          return _0x36637b.reply(_0x11470a.chat, "Sorry to say that @" + _0x7ef4f3.split('@')[0x0] + " is already in love with " + _0x25941c + "\nLet them keep going. Please dont be the 3rd person in @" + _0x7ef4f3.split('@')[0x0] + " & " + _0x25941c + " life 🙂\nDonn't be sad shizo is always with you 🥺😊\nYou will find Someone suitable for you 😀\n\n" + _0x25e5cd, _0x11470a, {
            'mentions': [_0x7ef4f3, _0x2ab047]
          });
        } else {
          global.db.data.users[_0x11470a.sender].lover = _0x7ef4f3;
          _0x36637b.reply(_0x11470a.chat, "Hey, @" + _0x7ef4f3.split('@')[0x0] + " You are being crushed & proposed @" + _0x11470a.sender.split('@')[0x0] + " 😳❤️\nPlease accept or reject@" + _0x11470a.sender.split('@')[0x0] + " Love or proposal 💕✨\n Type " + _0x98f943 + "accept @user or " + _0x98f943 + "reject @user\n\n" + _0x25e5cd, _0x11470a, {
            'mentions': [_0x7ef4f3, _0x11470a.sender]
          });
        }
      } else if (global.db.data.users[_0x7ef4f3].lover == _0x11470a.sender) {
        global.db.data.users[_0x11470a.sender].lover = _0x7ef4f3;
        _0x36637b.reply(_0x11470a.chat, "Congratulations, you're officially dating @" + _0x7ef4f3.split('@')[0x0] + "\nMay it last forever and always be happy 🥺❤️🥰\n\n" + _0x25e5cd, _0x11470a, {
          'mentions': [_0x7ef4f3]
        });
      } else {
        global.db.data.users[_0x11470a.sender].lover = _0x7ef4f3;
        _0x36637b.reply(_0x11470a.chat, "Hey, @" + _0x7ef4f3.split('@')[0x0] + " You are being crushed & proposed @" + _0x11470a.sender.split('@')[0x0] + " 😳❤️\nPlease accept or reject @" + _0x11470a.sender.split('@')[0x0] + " Love or Proposal 💕✨\n Type " + _0x98f943 + "accept @user or " + _0x98f943 + "reject @user\n\n" + _0x25e5cd, _0x11470a, {
          'mentions': [_0x7ef4f3, _0x11470a.sender]
        });
      }
    }
  }
};
handler.help = ["propose"].map(_0x15823c => _0x15823c + " *@tag*");
handler.tags = ["relation"];
handler.command = /^(propose)$/i;
handler.group = true;
handler.register = true;
export default handler;
