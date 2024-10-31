let handler = async (m, { conn }) => {
  let who = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.fromMe
        ? conn.user.jid
        : m.sender
  conn.sendFile(
    m.chat,
    global.API('https://some-random-api.com', '/canvas/misc/simpcard', {
      avatar: await conn
        .profilePictureUrl(who, 'image')
        .catch(_ => 'https://files.catbox.moe/8324jm.jpg'),
    }),
    'error.png',
    '*your religion is simping*',
    m
  )
}
handler.help = ['simpcard']
handler.tags = ['maker']
handler.command = /^(simpcard)$/i
export default handler
