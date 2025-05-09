import fetch from 'node-fetch';

let handler = async (m, { conn, args, isOwner, isPrems }) => {
  var limit;
  if (isOwner || isPrems) limit = 1200;
  else limit = 100;
  if (!args[0]) throw `✳️ Enter the MediaFire link next to the command.`;
  if (!args[0].match(/mediafire/gi)) throw `❎ Invalid link.`;

  m.react(rwait);

  // Check URL format
  let u = /https?:\/\//.test(args[0]) ? args[0] : 'https://' + args[0];
  
  // Fetch metadata from Dark Yasiya API
  let apiUrl = `https://www.dark-yasiya-api.site/download/mfire?url=${encodeURIComponent(u)}`;
  let res = await fetch(apiUrl);
  if (!res.ok) throw `❎ Failed to retrieve data.`;
  let data = await res.json();

  if (!data.status) throw `❎ Unable to parse MediaFire link.`;
  let { filename, filesize, filesizeH, filetype, link } = data.result;

  // Check file size limit
  let fileSizeMB = parseFloat(filesize); 
  let isLimit = (isPrems || isOwner ? limit : limit) < fileSizeMB;

  // Prepare message
  let caption = `
   ≡ *MEDIAFIRE DOWNLOAD*

▢ *File Name:* ${filename}
▢ *Size:* ${filesizeH}
▢ *Type:* ${filetype}
${isLimit ? `\n⚠️ The file size exceeds the download limit of *${limit} MB*. Upgrade to premium to download larger files.` : ''}
  `.trim();
  
  // Send Preview
  await conn.sendMessage(m.chat, { text: caption }, { quoted: m });

  // Send File if within limit
  if (!isLimit) {
    await conn.sendMessage(m.chat, { document: { url: link }, fileName: filename, mimetype: filetype }, { quoted: m });
  }
  
  m.react(done);
};

handler.help = ['mediafire <url>'];
handler.tags = ['downloader', 'premium'];
handler.command = ['mediafire', 'mfire'];
handler.credit = false;
handler.premium = false;

export default handler;
