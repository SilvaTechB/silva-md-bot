const handler = async (m, { conn: conn }) => {
  if ("status@broadcast" != m.quoted?.chat) throw "Quote Status message";
  try {
    let buffer = await (m.quoted?.download());
    await conn.sendFile(m.chat, buffer, "", m.quoted?.text || "", null, !1, {
      quoted: m
    });
  } catch (e) {
    console.log(e), await conn.reply(m.chat, m.quoted?.text, m);
  }
};
handler.help = ["downloadsw"], handler.tags = ["tools"], handler.command = /^((sw|status)(dl|download)|(dl|download)(sw|status))$/i;
export default handler;
