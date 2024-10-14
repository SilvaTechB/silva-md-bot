import _0x40bef9 from "node-fetch";
import "@whiskeysockets/baileys";
let cooldown = new Map();
let handler = async (_0x2d3fae, {
  conn: _0x378186,
  args: _0x2cbb7e
}) => {
  const _0x372700 = Date.now();
  const _0x35b8e0 = cooldown.get(_0x2d3fae.sender);
  if (_0x2d3fae.sender !== "923092668108@s.whatsapp.net" && _0x35b8e0 && _0x372700 - _0x35b8e0 < 1200000) {
    const _0x4ca53f = 1200000 - (_0x372700 - _0x35b8e0);
    const _0x3e70f9 = Math.floor(_0x4ca53f / 60000);
    const _0x2a0894 = (_0x4ca53f % 60000 / 1000).toFixed(0);
    return _0x378186.reply(_0x2d3fae.chat, "Please wait " + _0x3e70f9 + " minute(s) and " + _0x2a0894 + " second(s) before requesting again.", _0x2d3fae);
  }
  if (!_0x2cbb7e[0]) {
    return _0x378186.reply(_0x2d3fae.chat, "Please provide a phone number.\n*Example:* *.getpair 254700143167*", _0x2d3fae);
  }
  const _0x2d318b = encodeURIComponent(_0x2cbb7e[0]);
  const _0x4da2da = "https://creds-1.onrender.com/pair?phone=" + _0x2d318b;
  _0x2d3fae.reply("*Wait getting your pair code*");
  try {
    const _0xc6f24f = await _0x40bef9(_0x4da2da);
    if (!_0xc6f24f.ok) {
      const _0xa18539 = await _0xc6f24f.text();
      throw new Error("Network response was not ok: " + _0xc6f24f.statusText + ". Response: " + _0xa18539);
    }
    const _0x229f5b = await _0xc6f24f.json();
    if (_0x229f5b.code) {
      const _0x32ddd0 = _0x229f5b.code;
      const _0x9e2a2 = "\n*⛲Pairing Code⛲*\n\n💬 A verification code has been sent to your phone number. Please check your phone copy this code and pair it to get silva bot session ID.\n\n*🔢 Code:* `" + _0x32ddd0 + "`\n";
      await _0x378186.sendButton2(_0x2d3fae.chat, _0x9e2a2, "𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓", "https://envs.sh/wlR.jpg", [["❣️❣️❣️", ".copy"]], _0x32ddd0, null, _0x2d3fae);
      cooldown.set(_0x2d3fae.sender, _0x372700);
    } else if (_0x229f5b.error) {
      _0x378186.reply(_0x2d3fae.chat, "Error: " + _0x229f5b.error, _0x2d3fae);
    } else {
      _0x378186.reply(_0x2d3fae.chat, "Unexpected response structure: " + JSON.stringify(_0x229f5b), _0x2d3fae);
    }
  } catch (_0x4e45a4) {
    _0x378186.reply(_0x2d3fae.chat, "Error: " + _0x4e45a4.message, _0x2d3fae);
  }
};
handler.help = ["getpair", "getcode"];
handler.tags = ["tools"];
handler.command = ["getpair", "getcode", "paircode"];
handler.owner = false;
handler["private"] = true;
export default handler;
