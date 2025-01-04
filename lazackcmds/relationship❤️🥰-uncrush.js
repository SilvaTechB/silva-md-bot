let handler = async (_0x2c5a31, {
  conn: _0x58bda3,
  text: _0x903e10
}) => {
  const _0x855c = Buffer.from('RGV2ZWxvcGVkIGJ5', "base64");
  const _0x3808cf = Buffer.from('U2hpem8gVGhl', "base64");
  const _0x9348ba = Buffer.from("VGVjaGllIChTaGl6byBEZXZzKSDinaTvuI/inKg=", "base64");
  const _0x1d5291 = Buffer.from('KlN1cHBvcnQ6KiA=', "base64");
  const _0xfaca63 = Buffer.from("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT1zaGl6byt0aGUrdGVjaGll", "base64");
  let _0x2e7131 = _0x855c.toString('utf-8');
  let _0x545984 = _0x3808cf.toString("utf-8");
  let _0x24fada = _0x9348ba.toString("utf-8");
  let _0x4b415f = _0x1d5291.toString("utf-8");
  let _0x59ddbe = _0xfaca63.toString('utf-8');
  let _0x149dfc = '' + (_0x2e7131 + decshiz1 + _0x545984 + _0x24fada + "\n" + _0x4b415f + _0x59ddbe);
  let _0x39d6de = _0x2c5a31.sender;
  if (global.db.data.users[_0x2c5a31.sender].lover == '') {
    return _0x58bda3.reply(_0x2c5a31.chat, "You do not have crush on anyone 😀🔥\n\n" + _0x149dfc, _0x2c5a31);
  }
  if (global.db.data.users[global.db.data.users[_0x2c5a31.sender].lover].lover == _0x2c5a31.sender) {
    let _0x5c3fca = global.db.data.users[_0x39d6de].lover;
    let _0x3b6aea = global.db.data.users[_0x5c3fca].name;
    _0x58bda3.reply(_0x2c5a31.chat, "You are in love with " + _0x3b6aea + " 💖🥰\n\n" + _0x149dfc, _0x2c5a31, {
      'mentions': [global.db.data.users[_0x2c5a31.sender].lover]
    });
  } else {
    let _0x217afd = global.db.data.users[_0x39d6de].lover;
    let _0x29764a = global.db.data.users[_0x217afd].name;
    _0x58bda3.reply(_0x2c5a31.chat, "You have removed your crush " + _0x29764a + " from your heart 💯😳💔\n\n" + _0x149dfc, _0x2c5a31, {
      'mentions': [global.db.data.users[_0x2c5a31.sender].lover]
    });
    global.db.data.users[_0x2c5a31.sender].lover = '';
  }
};
handler.help = ["uncrush @tag"];
handler.tags = ["relation"];
handler.command = /^(uncrush)$/i;
handler.group = true;
handler.register = true;
export default handler;
