import { exec } from 'child_process'; 
import fs from 'fs';
import path from 'path';

let handler = async (m, { conn }) => {
  // Get the group metadata
  const groupMetadata = await conn.groupMetadata(m.chat);

  // Validate group size
  const participants = groupMetadata.participants || [];
  if (participants.length < 2) {
    return m.reply('The group must have at least 2 members.');
  }
  if (participants.length > 1000) {
    return m.reply('The group has more than 1000 members.');
  }

  // Generate VCF content
  let vcfContent = '';
  for (let participant of participants) {
    const userJid = participant.id;  // Get participant's WhatsApp ID
    const userName = userJid.split('@')[0];  // Extract username part (before '@')

    const phoneNumber = userName;  // Assuming the username can be used as phone number

    // Use WhatsApp display name (assuming everyone has a name)
    const displayName = participant.notify;  // Use WhatsApp display name as FN

    vcfContent += `
BEGIN:VCARD
VERSION:3.0
FN:${displayName}
TEL;TYPE=CELL:+${phoneNumber}
NOTE:Generated for group: ${groupMetadata.subject}
END:VCARD
`.trim() + '\n';
  }

  // Sanitize the group name and set the VCF file path using process.cwd()
  const groupName = groupMetadata.subject || 'Group';
  const sanitizedGroupName = groupName.replace(/[^a-zA-Z0-9]/g, '_');
  const vcfFilePath = path.join(process.cwd(), `${sanitizedGroupName}.vcf`); // Use process.cwd()

  // Write VCF content to file
  fs.writeFileSync(vcfFilePath, vcfContent);
  console.log(`VCF file generated: ${vcfFilePath}`);

  // Send the VCF file to the group
  await conn.sendMessage(m.chat, {
    document: { url: vcfFilePath },
    mimetype: 'text/vcard',
    fileName: `${sanitizedGroupName}.vcf`,
    caption: `Here is the VCF file for all participants in *${groupName}* (${participants.length} members).`,
  });

  // Clean up the generated file after sending
  fs.unlinkSync(vcfFilePath);
};

handler.help = ['vcf'];
handler.tags = ['tools'];
handler.command = /^(vcf)$/i;

handler.group = true; // Command works only in groups

export default handler;
