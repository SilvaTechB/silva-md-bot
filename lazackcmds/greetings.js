export async function all(m) {
  // when someone sends you hello message
  if (
    (m.mtype === 'hellomessage' ||
      m.text.startsWith('silva')) &&
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
    this.sendButton(m.chat, `*WELCOME THIS IS SILVA MD*      
    Hello 💕🥰 @${m.sender.split('@')[0]} 
    THANK YOU FOR MESSAGING ME I WILL RESPOND IF I DONT KNOW AM OFFLINE😇
  `.trim(), igfg, null, [['OWNER HELP', '.grp'],['BOT SCRIPT', '.repo']] , m, { mentions: [m.sender] })
    m.react('💕')
  }

  return !0
}
