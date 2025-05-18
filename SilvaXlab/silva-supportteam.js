let handler = async (m, { conn }) => {
  const supportNumber = '+254712345678'; // Replace with your actual support number

  // 1. Send the Call Button with optional support site
  await conn.sendMessage(m.chat, {
    caption: '*Need Help?*',
    footer: 'Silva Support Center — Available 24/7',
    templateButtons: [
      {
        index: 1,
        callButton: {
          displayText: 'Call Support',
          phoneNumber: supportNumber
        }
      },
      {
        index: 2,
        urlButton: {
          displayText: 'Visit Support Page',
          url: 'https://silvatech.support' // Optional site
        }
      }
    ],
    headerType: 1
  }, { quoted: m });

  // 2. Send the vCard Contact
  const contact = {
    displayName: 'Silva Support',
    vcard: `BEGIN:VCARD\nVERSION:3.0\nFN:Silva Support\nTEL;type=CELL;type=VOICE;waid=${supportNumber.replace('+', '')}:${supportNumber}\nEND:VCARD`
  };

  await conn.sendMessage(m.chat, {
    contacts: {
      displayName: contact.displayName,
      contacts: [contact]
    }
  }, { quoted: m });
};

handler.help = ['support'];
handler.tags = ['info'];
handler.command = ['support', 'helpdesk', 'contactsupport'];

export default handler;