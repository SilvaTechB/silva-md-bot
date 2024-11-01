import _0x309083 from "node-fetch";
const regex = /(?:https|git)(?::\/\/|@)github\.com[\/:]([^\/:]+)\/(.+)/i;
let handler = async (_0x5cf5e9, {
  conn: _0x31bdf6,
  args: _0x1219b6,
  usedPrefix: _0x5154b1,
  command: _0x44a989
}) => {
  let _0x517d4d;
  if (!_0x1219b6[0]) {
    _0x517d4d = "https://github.com/SilvaTechB/silva-md-bot";
  } else {
    if (!regex.test(_0x1219b6[0])) {
      throw "⚠️ link incorrect";
    }
    _0x517d4d = _0x1219b6[0];
  }
  let [_0x111c39, _0x5e6b2b, _0x110021] = _0x517d4d.match(regex) || [];
  _0x110021 = _0x110021.replace(/.git$/, '');
  let _0x370572 = "https://api.github.com/repos/" + _0x5e6b2b + "/" + _0x110021 + "/zipball";
  const _0x386684 = {
    "method": "HEAD"
  };
  let _0x1136a3 = (await _0x309083(_0x370572, _0x386684)).headers.get("content-disposition").match(/attachment; filename=(.*)/)[1];
  _0x5cf5e9.reply("✳️ *Wait, sending repository..*");
  _0x31bdf6.sendFile(_0x5cf5e9.chat, _0x370572, _0x1136a3, null, _0x5cf5e9);
};
handler.help = ["gitprince <url>"];
handler.tags = ["downloader"];
handler.command = ["gitp", "gitsilva"];
export default handler;
