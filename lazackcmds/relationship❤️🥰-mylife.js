let handler = async (_0x4606f5, {
  conn: _0xa98982,
  text: _0x19dc26
}) => {
  const _0x4e6c4f = Buffer.from("RGV2ZWxvcGVkIGJ5", "base64");
  const _0x2100c1 = Buffer.from("U2hpem8gVGhl", "base64");
  const _0x1854c3 = Buffer.from("VGVjaGllIChTaGl6byBEZXZzKSDinaTvuI/inKg=", "base64");
  const _0x5675c0 = Buffer.from('KlN1cHBvcnQ6KiA=', "base64");
  const _0xd36a6d = Buffer.from("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT1zaGl6byt0aGUrdGVjaGll", "base64");
  let _0x35f6a8 = _0x4e6c4f.toString('utf-8');
  let _0x3dd2b7 = _0x2100c1.toString('utf-8');
  let _0x173d16 = _0x1854c3.toString("utf-8");
  let _0x4945fc = _0x5675c0.toString("utf-8");
  let _0x3985e9 = _0xd36a6d.toString("utf-8");
  let _0x546016 = '' + (_0x35f6a8 + " " + _0x3dd2b7 + _0x173d16 + "\n" + _0x4945fc + _0x3985e9);
  let _0x357212 = _0x4606f5.sender;
  if (global.db.data.users[_0x357212].lover == '') {
    _0xa98982.reply(_0x4606f5.chat, "*silva says: You has no partner and is not loving anyone*\n*Type /propose @user to propose someone* \n\n" + _0x546016, _0x4606f5);
  } else {
    if (global.db.data.users[global.db.data.users[_0x357212].lover].lover != _0x357212) {
      let _0x4c446d = global.db.data.users[_0x357212].lover;
      let _0xfafbf4 = global.db.data.users[_0x4c446d].name;
      _0xa98982.reply(_0x4606f5.chat, "silva says: You Crushing on " + _0xfafbf4 + " 💖🥰\nType #uncrush @tag to remove them from your crush list\n\n" + _0x546016, _0x4606f5, {
        'mentions': [global.db.data.users[_0x357212].lover]
      });
    } else {
      let _0x4e5ce8 = global.db.data.users[_0x357212].lover;
      let _0xc5d277 = global.db.data.users[_0x4e5ce8].name;
      _0xa98982.reply(_0x4606f5.chat, "*Silva says: You is in a relationship with " + _0xc5d277 + " 🥰☺️*\n\n" + _0x546016, _0x4606f5, {
        'mentions': [global.db.data.users[_0x357212].lover]
      });
    }
  }
};
handler.help = ["mylife"];
handler.tags = ["relation"];
handler.command = /^(mylife)$/i;
handler.couple = true;
handler.register = true;
export default handler;
