let handler = async (m, { conn, command }) => {
  if (command === 'vibescan') {
    let msgs = await conn.fetchMessages(m.chat, 50);
    let happy = ['lol', '😂', 'happy', 'good', 'nice', 'awesome'];
    let sad = ['sad', 'bad', '😭', 'hate', 'angry', 'mad'];
    let positive = 0, negative = 0;

    for (let msg of msgs) {
      let txt = msg?.message?.conversation?.toLowerCase() || '';
      if (happy.some(w => txt.includes(w))) positive++;
      if (sad.some(w => txt.includes(w))) negative++;
    }

    let mood = '😐 Neutral';
    if (positive > negative) mood = '😄 Positive Vibes';
    else if (negative > positive) mood = '😡 Toxic Vibes';
    else if (positive + negative === 0) mood = '💀 Dead Chat';

    await conn.sendMessage(m.chat, {
      text: `🧠 *Group Vibe Scanner Result:*\n${mood}`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA VIBE SCANNER 💬',
          serverMessageId: 143
        }
      }
    });
  }

  if (command === 'mirror') {
    let last = m.quoted?.text || m.text;
    let mirrored = last.split('').reverse().join('');
    await conn.sendMessage(m.chat, {
      text: `🪞 *Mirrored Message:*\n${mirrored}`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA MIRROR TOOL 🪞',
          serverMessageId: 143
        }
      }
    });
  }

  if (command === 'topchatters') {
    let msgs = await conn.fetchMessages(m.chat, 50);
    let counts = {};
    msgs.forEach(msg => {
      let sender = msg.key.participant || msg.key.remoteJid;
      counts[sender] = (counts[sender] || 0) + 1;
    });

    let sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]);
    let top = sorted.slice(0, 5).map(([u, c], i) => `${i + 1}. @${u.split('@')[0]} – ${c} msgs`).join('\n');

    await conn.sendMessage(m.chat, {
      text: `📊 *Top Chatters (last 50 msgs):*\n${top}`,
      mentions: sorted.map(x => x[0]),
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA CHAT STATS 📈',
          serverMessageId: 143
        }
      }
    });
  }

  if (command === 'flipcoin') {
    const sides = ['🪙 Heads', '🔄 Tails'];
    const result = sides[Math.floor(Math.random() * sides.length)];
    await conn.sendMessage(m.chat, {
      text: `🎲 *Coin Flip Result:*\n${result}`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA COINFLIP 🎲',
          serverMessageId: 143
        }
      }
    });
  }

  if (command === 'poem') {
    let poems = [
      "Chase your dream with silent speed,\nLet your actions plant the seed.\nEven storms will clear your sky,\nSo spread your wings and learn to fly.",
      "You are fire, you are flame,\nNever let them dim your name.\nPower lives inside your chest,\nBurn, don't settle for less."
    ];
    let poem = poems[Math.floor(Math.random() * poems.length)];
    await conn.sendMessage(m.chat, {
      text: `📜 *Here's your spark poem:*\n\n${poem}`,
      contextInfo: {
        mentionedJid: [m.sender],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'SILVA POEM DROP 📝',
          serverMessageId: 143
        }
      }
    });
  }
};

handler.help = ['vibescan', 'mirror', 'topchatters', 'flipcoin', 'poem'];
handler.tags = ['fun', 'tools', 'group'];
handler.command = ['vibescan', 'mirror', 'topchatters', 'flipcoin', 'poem'];

export default handler;
