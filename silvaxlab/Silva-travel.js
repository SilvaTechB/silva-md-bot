import _0x4147b6 from 'node-fetch';
let handler = async (_0x22e99c, {
  text: _0x435948,
  command: _0x3b44eb,
  conn: _0x437c5d
}) => {
  if (!_0x435948) {
    throw "Please provide a query for the travel assistant.";
  }
  let _0x1e980c = "https://itzpire.com/ai/copilot2trip?q=" + encodeURIComponent(_0x435948);
  try {
    await _0x22e99c.react('⏳');
    const _0x53d1e1 = await _0x4147b6(_0x1e980c);
    if (!_0x53d1e1.ok) {
      throw new Error("API Error: " + _0x53d1e1.statusText);
    }
    const _0x4cf764 = await _0x53d1e1.json();
    console.log("API Response:", _0x4cf764);
    if (_0x4cf764.result) {
      await _0x22e99c.reply("Travel Assistant: " + _0x4cf764.result);
    } else {
      throw new Error("No valid result found.");
    }
    await _0x22e99c.react('✅');
  } catch (_0x2cd436) {
    console.error("Error:", _0x2cd436);
    await _0x22e99c.react('❌');
    throw "*ERROR*: " + _0x2cd436.message;
  }
};
handler.help = ["travel-assistant", "travel", "travelassistant"];
handler.tags = ['AI'];
handler.command = ["travel-assistant", "travel", "travelassistant"];
export default handler;
