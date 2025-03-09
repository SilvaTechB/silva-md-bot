let handler = async (m, { conn }) => {
  try {
    let device = m.deviceType || "Unknown Device";
    let deviceMessage = `📱 *Device Detected*: ${device}`;

    await conn.sendMessage(m.chat, { text: deviceMessage }, { quoted: m });
  } catch (error) {
    console.error("Device Detection Error:", error);
    await conn.sendMessage(m.chat, { text: "❌ Error detecting device!" }, { quoted: m });
  }
};

handler.help = ['device'];
handler.tags = ['tools'];
handler.command = ['device', 'devicetype'];

export default handler;
