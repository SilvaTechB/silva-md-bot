let handler = async (m, { conn }) => {
  const themes = [
    {
      caption: `*My heart pointed straight to you...*`,
      footer: `Silva Love Locator — With ❤️ from Silva Tech Inc.`,
      buttons: [
        { buttonId: `.kiss`, buttonText: { displayText: 'Kiss Me Back' }, type: 1 },
        { buttonId: `.poem`, buttonText: { displayText: 'Send Me a Poem' }, type: 1 },
      ],
      location: { degreesLatitude: 7.77777, degreesLongitude: 14.02123 }
    },
    {
      caption: `*Oh wow, you're the center of the universe... again.*`,
      footer: `Silva SarcastiBot — Proudly Judging You | Silva Tech Inc.`,
      buttons: [
        { buttonId: `.ping`, buttonText: { displayText: 'Let Me Cry' }, type: 1 },
        { buttonId: `.menu`, buttonText: { displayText: 'Tell Me More Lies' }, type: 1 },
      ],
      location: { degreesLatitude: 0.00001, degreesLongitude: 0.00001 }
    },
    {
      caption: `*A chill runs down your spine... someone is watching.*`,
      footer: `Silva Paranormal Scanner — Ghost Division | Silva Tech Inc.`,
      buttons: [
        { buttonId: `.main`, buttonText: { displayText: 'Hide Now' }, type: 1 },
        { buttonId: `.owner`, buttonText: { displayText: 'Summon the Spirit' }, type: 1 },
      ],
      location: { degreesLatitude: 13.66666, degreesLongitude: 66.00666 }
    },
    {
      caption: `*Location computed. IQ detected: 9001.*`,
      footer: `SilvaBot v2.0.1 — Nerd Mode Active | Silva Tech Inc.`,
      buttons: [
        { buttonId: `.play ordinary alan warren`, buttonText: { displayText: 'Calculate Love' }, type: 1 },
        { buttonId: `.botstatus`, buttonText: { displayText: 'Run Diagnostics' }, type: 1 },
      ],
      location: { degreesLatitude: 42.00000, degreesLongitude: 3.14159 }
    }
  ];

  // Pick one randomly
  const random = themes[Math.floor(Math.random() * themes.length)];

  conn.sendMessage(m.chat, {
    location: random.location,
    caption: random.caption,
    footer: random.footer,
    buttons: random.buttons,
    headerType: 6,
    viewOnce: true
  }, { quoted: m });
};

handler.help = ['funbutton'];
handler.tags = ['fun'];
handler.command = ['funbutton', 'randomvibe'];

export default handler;