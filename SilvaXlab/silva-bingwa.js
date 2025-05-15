// Menu Trigger for 'bingwa', 'safaricom', etc.
export async function all(m) {
  if (
    (m.mtype === 'bingwasokoni' ||
      m.text?.startsWith('Bingwa') ||
      m.text?.startsWith('safaricom') ||
      m.text?.startsWith('sokoni') ||
      m.text?.startsWith('Sokoni') ||
      m.text?.startsWith('bingwa') ||
      m.text?.startsWith('Data')) &&
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

  return !0;
}

// Command Handler for button replies
let handler = async (m) => {
  await m.reply(
    `*Safaricom M-Pesa is currently under development.*\n\nKindly try the *Silva Virtual WiFi Hotspot* — brought to you by *Starlink Internet*! \n\nhttps://silva-wifi-signin.vercel.app/`
  );
};

handler.command = ["data", "sms", "minutes", "datamin", "datasms", "all"];
handler.tags = ["bingwa"];
handler.help = ["data", "sms", "minutes", "datamin", "datasms", "all"];

export default handler;