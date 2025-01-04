let handler = async (_0x50d676, {
  conn: _0x1b7311,
  text: _0x289e89
}) => {
  const _0x420c05 = Buffer.from('RGV2ZWxvcGVkIGJ5', "base64");
  const _0x1e2119 = Buffer.from("U2hpem8gVGhl", "base64");
  const _0x22be20 = Buffer.from("VGVjaGllIChTaGl6byBEZXZzKSDinaTvuI/inKg=", "base64");
  const _0x556146 = Buffer.from('KlN1cHBvcnQ6KiA=', 'base64');
  const _0x3b0fea = Buffer.from("aHR0cHM6Ly93d3cuZ29vZ2xlLmNvbS9zZWFyY2g/cT1zaGl6byt0aGUrdGVjaGll", "base64");
  let _0x1288ba = _0x420c05.toString('utf-8');
  let _0x5ad655 = _0x1e2119.toString("utf-8");
  let _0x1eac60 = _0x22be20.toString("utf-8");
  let _0x19bf1a = _0x556146.toString("utf-8");
  let _0x11f6e6 = _0x3b0fea.toString("utf-8");
  let _0x5f3640 = '' + (_0x1288ba + " " + _0x5ad655 + _0x1eac60 + "\n" + _0x19bf1a + _0x11f6e6);
  let _0x44c030 = _0x50d676.sender;
  if (global.db.data.users[_0x44c030].exlover == '') {
    _0x1b7311.reply(_0x50d676.chat, "*Silva says: You has no ex-Relations\n\n" + _0x5f3640, _0x50d676);
  } else {
    let _0x5dd154 = global.db.data.users[_0x44c030].exlover;
    let _0x126e1b = global.db.data.users[_0x5dd154].name;
    _0x1b7311.reply(_0x50d676.chat, '*' + _0x126e1b + " is your ex-lover 🙂💔*\n\n" + _0x5f3640, _0x50d676, {
      'mentions': [global.db.data.users[_0x44c030].exlover]
    });
  }
};
handler.help = ["myex"];
handler.tags = ["relation"];
handler.command = /^(myex)$/i;
handler.couple = true;
handler.register = true;
export default handler;
