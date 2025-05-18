let handler = async (m, { conn }) => {
  conn.sendMessage(m.chat, {
    location: {
      degreesLatitude: 0.00000,
      degreesLongitude: 69.69696,
    },
    caption: `*You've been located, cutie!*`,
    footer: `Silva Radar™ — Powered by Silva Tech Inc.`,
    buttons: [
      {
        buttonId: `.wink`,
        buttonText: {
          displayText: 'Wink Back'
        },
        type: 1
      },
      {
        buttonId: `.blockme`,
        buttonText: {
          displayText: 'Block Me If You Dare'
        },
        type: 1
      }
    ],
    headerType: 6,
    viewOnce: true
  }, { quoted: m });
};

handler.help = ['flirt'];
handler.tags = ['fun'];
handler.command = ['flirt', 'locatebabe'];

export default handler;