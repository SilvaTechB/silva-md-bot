import fs from "fs";
import path from "path";

let handler = async (m, { conn }) => {
  if (!m.isGroup) return m.reply("This command only works in groups.");

  await m.reply("Generating VCF file for all group members... Please wait.");

  const groupMetadata = await conn.groupMetadata(m.chat).catch(() => null);
  if (!groupMetadata) return m.reply("Failed to get group info.");

  const participants = groupMetadata.participants || [];
  if (participants.length < 2) {
    return m.reply("The group must have at least 2 members.");
  }

  let vcfContent = "";
  let count = 0;

  for (const participant of participants) {
    const jid = participant.id;
    const phoneNumber = jid.split("@")[0];

    let displayName =
      conn.getName(jid) ||
      participant.notify ||
      participant.name ||
      participant.vname ||
      phoneNumber;

    displayName = displayName
      .replace(/[\\;,]/g, " ")
      .replace(/\n/g, " ")
      .trim();

    if (!displayName) displayName = phoneNumber;

    vcfContent += "BEGIN:VCARD\r\n";
    vcfContent += "VERSION:3.0\r\n";
    vcfContent += `FN:${displayName}\r\n`;
    vcfContent += `TEL;type=CELL;type=VOICE;waid=${phoneNumber}:+${phoneNumber}\r\n`;
    vcfContent += `X-WA-BIZ-NAME:${displayName}\r\n`;
    vcfContent += "END:VCARD\r\n";
    count++;
  }

  const groupName = groupMetadata.subject || "Group";
  const sanitizedName = groupName
    .replace(/[^a-zA-Z0-9 ]/g, "")
    .replace(/\s+/g, "_")
    .slice(0, 50);
  const vcfFileName = `${sanitizedName}_contacts.vcf`;
  const vcfFilePath = path.join(process.cwd(), "tmp", vcfFileName);

  try {
    if (!fs.existsSync(path.join(process.cwd(), "tmp"))) {
      fs.mkdirSync(path.join(process.cwd(), "tmp"), { recursive: true });
    }
    fs.writeFileSync(vcfFilePath, vcfContent);

    await conn.sendMessage(
      m.chat,
      {
        document: fs.readFileSync(vcfFilePath),
        mimetype: "text/vcard",
        fileName: vcfFileName,
        caption: `VCF Contact File\n\n*Group:* ${groupName}\n*Total Contacts:* ${count}\n\n_Save this file to add all group members to your contacts._`,
      },
      { quoted: m },
    );

    fs.unlinkSync(vcfFilePath);
  } catch (e) {
    if (fs.existsSync(vcfFilePath)) fs.unlinkSync(vcfFilePath);
    return m.reply("Failed to generate VCF file: " + e.message);
  }
};

handler.help = ["vcf"];
handler.tags = ["group"];
handler.command = /^(vcf|getcontacts|groupvcf)$/i;
handler.group = true;

export default handler;
