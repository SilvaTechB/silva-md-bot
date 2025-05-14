export async function all(m) {
  if (
    (m.mtype === 'bingwasokoni' ||
      m.text.startsWith('Bingwa') ||
      m.text.startsWith('safaricom') ||
      m.text.startsWith('sokoni') ||
      m.text.startsWith('Sokoni') ||
      m.text.startsWith('bingwa') ||
      m.text.startsWith('Data')) &&
    !m.isBaileys
  ) {
    this.sendButton(
      m.chat,
      `*WELCOME TO BINGWA SOKONI*      
HELLO @${m.sender.split('@')[0]} 
THIS IS BINGWA SOKONI 😇

*select your offer*

> POWERED BY SAFARICOM✅
> SELECT YOUR CHOICE FOR TODAY📞
> THANK YOU FOR BEING PART OF US📚

> click the buttons to see more`,
      igfg,
      null,
      [
        ['Data 💀', '.data'],
        ['Sms 😍', '.sms'],
        ['Minutes 📚', '.minutes'],
        ['Data & Minutes 📞', '.datamin'],
        ['Data & Sms📞', '.datasms'],
        ['All in one ✅', '.all'],
        ['Home 🏠', 'Bingwa']
      ],
      m,
      { mentions: [m.sender] }
    );
    m.react('🤫');
  }

  // Button command reply
  const cmd = m.text?.toLowerCase().trim();
  if (
    [".data", ".sms", ".minutes", ".datamin", ".datasms", ".all"].includes(cmd)
  ) {
    await m.reply(
      `*Safaricom M-Pesa is currently under development.*\n\nKindly try the *Silva Virtual WiFi Hotspot* — brought to you by *Starlink Internet*!`
    );
  }

  return !0;
}