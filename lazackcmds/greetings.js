const userLastMessageMap = new Map();

export async function all(m) {
  const ONE_DAY = 24 * 60 * 60 * 1000; 

  const currentTime = Date.now();
  const userId = m.sender;

  if (userLastMessageMap.has(userId)) {
    const lastMessageTime = userLastMessageMap.get(userId);
    if (currentTime - lastMessageTime < ONE_DAY) {
      return;
    }
  }

  const greetings = [
    'Hello',
    'Hi',
    'Mambo',
    'bro',
    'hello',
    'Hie',
    'hi',
    'Heey',
    'silva'
  ];

  if (
    greetings.includes(m.text) &&
    !m.isBaileys &&
    !m.isGroup
  ) {
    this.sendButton(
      m.chat,
      `*WELCOME am silva personal assistant*      
    Hello 💕🥰 @${m.sender.split('@')[0]} 
    I may be offline or I may be slow to respond, but wait I will be back soon 😇 click on any button below for instructions`.trim(),
      igfg,
      null,
      [['OWNER HELP', '.grp'], ['the script', '.repo']],
      m,
      { mentions: [m.sender] }
    );
    m.react('💕');
    
    userLastMessageMap.set(userId, currentTime);
  }

  return !0;
}
