let handler = async (m, { conn, args }) => {
  let text = args.slice(1).join(' ')
  let who = m.quoted
    ? m.quoted.sender
    : m.mentionedJid && m.mentionedJid[0]
      ? m.mentionedJid[0]
      : m.fromMe
        ? conn.user.jid
        : m.sender
  conn.sendFile(
    m.chat,
    global.API('https://some-random-api.com', '/canvas/misc/its-so-stupid', {
      avatar: await conn
        .profilePictureUrl(who, 'image')
        .catch(_ => 'https://files.catbox.moe/8324jm.jpg'),
      dog: text || 'im+stupid',
    }),
    'error.png',
    `*@${author}*`,
    m
  )
}
handler.help = ['itssostupid', 'iss', 'stupid']
handler.tags = ['maker']
handler.command = /^(itssostupid|iss|stupid)$/i
export default handler
