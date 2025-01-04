import _0x13d6c9 from 'node-fetch';
let handler = async (_0x3a0faf, {
  text: _0x1cb297,
  conn: _0x400ed0
}) => {
  if (!_0x1cb297) {
    return await _0x3a0faf.reply("Example :\n- tenor cat dancing\n- tenor cat dancing, 3");
  }
  const [_0x21d3af, _0x160e5b] = _0x1cb297.split(',');
  const _0x444f9f = "https://g.tenor.com/v1/search?q=" + encodeURIComponent(_0x21d3af) + "&key=LIVDSRZULELA&limit=" + (_0x160e5b && !isNaN(_0x160e5b) ? _0x160e5b : 1);
  try {
    await _0x3a0faf.react('⏳');
    const _0x3f0de8 = await _0x13d6c9(_0x444f9f);
    const _0x1e0536 = await _0x3f0de8.json();
    const _0x27628a = _0x1e0536.results;
    const _0x5e8cb4 = _0x27628a.length;
    if (_0x5e8cb4 > 1) {
      await _0x3a0faf.reply("Sending " + _0x5e8cb4 + " stickers from Tenor...");
    }
    for (const _0x49ee50 of _0x27628a) {
      try {
        const _0x5a47c2 = _0x49ee50.media[0].mp4.url;
        const _0x8d6362 = await _0x13d6c9(_0x5a47c2).then(_0x2e7cc3 => _0x2e7cc3.buffer());
        await _0x400ed0.sendMessage(_0x3a0faf.chat, {
          'video': _0x8d6362,
          'mimetype': "video/mp4",
          'caption': "Sticker from Tenor",
          'gifPlayback': true
        }, {
          'quoted': _0x3a0faf
        });
      } catch (_0x37bc1c) {
        console.error("Error sending sticker:", _0x37bc1c);
      }
    }
    await _0x3a0faf.react('✅');
  } catch (_0x1b9bcd) {
    await _0x3a0faf.react('❌');
    console.error("Error:", _0x1b9bcd);
    await _0x3a0faf.reply("❌ Something went wrong. Please try again later.");
  }
};
handler.help = ["tenor"];
handler.tags = ["sticker"];
handler.command = /^(tenor)$/i;
export default handler;
