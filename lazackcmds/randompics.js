import _0x3a0279 from 'node-fetch';
const imageUrls = {
 'chinese': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/china.json",
'hijab': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/hijab.json",
'malaysia': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/malaysia.json",
'japanese': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/japan.json",
'korean': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/korea.json",
'malay': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/malaysia.json",
'random': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/random.json",
'random2': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/random2.json",
'thai': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/thailand.json",
'vietnamese': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/vietnam.json",
'indo': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/tiktokpics/indonesia.json",
'boneka': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/boneka.json",
'blackpink3': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/blackpink.json",
'bike': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/bike.json",
'antiwork': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/antiwork.json",
'aesthetic': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/aesthetic.json",
'justina': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/justina.json",
'doggo': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/doggo.json",
'cosplay2': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/cosplay.json",
'cat': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/cat.json",
'car': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/car.json",
'profile2': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/profile.json",
'ppcouple2': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/ppcouple.json",
'notnot': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/notnot.json",
'kpop': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/kpop.json",
'kayes': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/kayes.json",
'ulzzanggirl': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/ulzzanggirl.json",
'ulzzangboy': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/ulzzangboy.json",
'ryujin': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/ryujin.json",
'rose': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/rose.json",
'pubg': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/pubg.json",
'wallml': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/wallml.json",
'wallhp': "https://raw.githubusercontent.com/SilvaTechB/silva-md-plugins/main/src/media/randompics/wallhp.json"
};
const fetchWithRetry = async (_0x317c3b, _0x16006d, _0x2cf574 = 3) => {
  for (let _0x23c7ab = 0; _0x23c7ab < _0x2cf574; _0x23c7ab++) {
    const _0x5777ca = await _0x3a0279(_0x317c3b, _0x16006d);
    if (_0x5777ca.ok) {
      return _0x5777ca;
    }
    console.log("Retrying... (" + (_0x23c7ab + 1) + ')');
  }
  throw new Error("Failed to fetch media content after retries");
};
let handler = async (_0xc1d18c, {
  command: _0x22bbf7,
  conn: _0x3aaaee
}) => {
  const _0x3f64fe = imageUrls[_0x22bbf7];
  if (!_0x3f64fe) {
    return _0xc1d18c.reply("Command not found.");
  }
  await _0xc1d18c.react('⏳');
  try {
    const _0x3eb333 = await fetchWithRetry(_0x3f64fe);
    if (!_0x3eb333.ok) {
      throw new Error("API Error: " + _0x3eb333.statusText);
    }
    const _0x278283 = await _0x3eb333.json();
    const _0x5483ad = _0x278283[Math.floor(Math.random() * _0x278283.length)];
    await _0x3aaaee.sendFile(_0xc1d18c.chat, _0x5483ad.url, '', "*Here is the result of: " + _0x22bbf7 + "*\n*𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 © SILVA-𝙼𝙳*", _0xc1d18c);
    await _0xc1d18c.react('✅');
  } catch (_0x3b562a) {
    console.error("Error:", _0x3b562a);
    await _0xc1d18c.reply("⚠️ An error occurred while processing the request. Please try again later.");
    await _0xc1d18c.react('❌');
  }
};
handler.help = ["chinese", "malaysia", "hijab", "japanese", "korean", "malay", "random", "random2", "thai", "vietnamese", "indo", "boneka", "blackpink3", "bike", "antiwork", "aesthetic", "justina", "doggo", "cosplay2", "cat", "car", "profile2", "ppcouple2", "notnot", "kpop", "kayes", "ulzzanggirl", "ulzzangboy", "ryujin", "rose", "pubg", "wallml", "wallhp"];
handler.tags = ["image"];
handler.command = ["chinese", "malaysia", "hijab", "japanese", "korean", "malay", "random", "random2", "thai", "vietnamese", "indo", "boneka", "blackpink3", "bike", "antiwork", "aesthetic", "justina", "doggo", "cosplay2", "cat", "car", "profile2", "ppcouple2", "notnot", "kpop", "kayes", "ulzzanggirl", "ulzzangboy", "ryujin", "rose", "pubg", "wallml", "wallhp"];
export default handler;
function pickRandom(_0x4701ca) {
  return _0x4701ca[Math.floor(Math.random() * _0x4701ca.length)];
}
