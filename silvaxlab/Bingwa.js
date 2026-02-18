export async function all(m) {
  if (
    (m.mtype === 'bingwasokoni' ||
      m.text.startsWith('Bingwa') ||
      m.text.startsWith('safaricom') ||
      m.text.startsWith('sokoni') ||
      m.text.startsWith('Sokoni') ||
      m.text.startsWith('bingwa') ||
      m.text.startsWith('Data')) &&
    !m.isBaileys &&
    !m.isGroup
    ) {
    this.sendButton(m.chat, `*WELCOME TO BINGWA SOKONI*      
    HELLO @${m.sender.split('@')[0]} 
    THIS IS BINGWA SOKONI 😇\n\n *select your offer*\n\n> POWERED BY SAFARICOM✅\n> SELECT YOU CHOICE FOR TODAY📞\n> THANK YOU FOR BEING PART OF US📚\n\n\n> click the buttons to see more
  `.trim(), igfg, null, [['Data 💀', '.data'],['Sms 😍', '.sms'],['Minutes 📚', '.minutes'],['Data & Minutes 📞', '.datamin'],['Data & Sms📞', '.datasms'],['All in one ✅', '.all'],['Home 🏠', 'Bingwa']] , m, { mentions: [m.sender] })
    m.react('🤫')
  }

  return !0
}
