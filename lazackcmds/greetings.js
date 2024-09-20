export async function all(m) {
  // when someone sends you hello message
  if (
    (m.mtype === 'hellomessage' ||
      m.text.startsWith('Hello') ||
      m.text.startsWith('hi') ||
      m.text.startsWith('mambo')) &&
    !m.isBaileys &&
    !m.isGroup
 /* ) {
    this.sendMessage(
      m.chat,
      {
        text: `Hello @${m.sender.split('@')[0]}\nyou can rent the bot to join a group\n\n_For more info you can DM the owner_\n*Type* \`\`\`.owner\`\`\` *to contact the owner*`.trim(),
      },
      { quoted: m }*/
    ) {
    this.sendButton(m.chat, `*WELCOME ITS ME JUST REPLYING*      
    morning or evening @${m.sender.split('@')[0]} 
    i may be offline or i may be slow to respond you but wait i will be back soon 😇
  `.trim(), igfg, null, [['OWNER HELP', '.menu']] , m, { mentions: [m.sender] })
    m.react('💕')
  }

  return !0
}