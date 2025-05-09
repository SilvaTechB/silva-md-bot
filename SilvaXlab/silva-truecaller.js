// GURU ka maal hai
// https://github.com/Guru322/GURU-BOT

import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
  let phoneNumber = '';

  if (text) {
    phoneNumber = text.replace(/[^0-9]/g, '');
  } else if (m.quoted) {
    phoneNumber = m.quoted.sender.replace(/[^0-9]/g, '');
  } else if (m.mentionedJid && m.mentionedJid[0]) {
    phoneNumber = m.mentionedJid[0].replace(/[^0-9]/g, '');
  } else {
    throw '⚠️ Please provide a phone number in international format (without +), quote a user, or mention a user.';
  }

  try {
    const installationId = 'a1i0Z--jzbJC6kx-2_s3OMNW2X7O2Qe3ca-XwmHexijCBA6MNKAO2ciUw756zhWj';
    const apiurl = `https://truecaller-api.vercel.app/search?phone=${encodeURIComponent(phoneNumber)}&id=${installationId}`;

    const response = await fetch(apiurl);
    if (!response.ok) throw new Error(`❌ Failed to fetch data. Status: ${response.status}`);

    const json = await response.json();
    json.creator = 'Silva';

    let result = '';
    for (let prop in json) {
      if (prop === 'flagURL') continue;

      if (prop === 'addresses') {
        result += `🏠 *${prop}:*\n`;
        for (let addressProp in json[prop][0]) {
          result += `  • *${addressProp}:* ${json[prop][0][addressProp]}\n`;
        }
      } else if (prop === 'countryDetails') {
        result += `🌍 *${prop}:*\n`;
        for (let countryProp in json[prop]) {
          if (Array.isArray(json[prop][countryProp])) {
            result += `  • *${countryProp}:* ${json[prop][countryProp].join(', ')}\n`;
          } else {
            result += `  • *${countryProp}:* ${json[prop][countryProp]}\n`;
          }
        }
      } else {
        result += `📌 *${prop}:* ${json[prop]}\n`;
      }
    }

    m.reply(result || '⚠️ No data found for this number.');
  } catch (error) {
    console.error(error);
    m.reply(`❌ Error: ${error.message}`);
  }
};

handler.help = ['true'];
handler.tags = ['tools'];
handler.command = /^(true|caller)$/i;

export default handler;
