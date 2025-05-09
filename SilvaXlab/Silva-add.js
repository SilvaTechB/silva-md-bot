// Add Member Command Script for Silva MD Bot
// This script allows group admins to add members using the command format: add 254700143167

let handler = async (m, { conn, args }) => {
  try {
    // Ensure the command is used in a group
    if (!m.isGroup) throw 'This command can only be used in group chats.';

    // Fetch group metadata
    const groupMetadata = await conn.groupMetadata(m.chat);
    const participants = groupMetadata.participants;

    // Check if the bot is an admin
    const botAdmin = participants.find(p => p.id === conn.user.jid && p.admin);
    if (!botAdmin) throw 'I need to be an admin to add members!';

    // Check if the sender is an admin
    const senderAdmin = participants.find(p => p.id === m.sender && p.admin);
    if (!senderAdmin) throw 'Only group admins can use this command!';

    // Ensure a phone number is provided
    if (!args[0]) throw 'Please provide a phone number to add.';
    let target = args[0].replace(/[^0-9]/g, '') + '@s.whatsapp.net';

    // Check if the user is already in the group
    if (participants.find(p => p.id === target)) {
      throw 'The user is already in this group.';
    }

    // Attempt to add the participant
    await conn.groupParticipantsUpdate(m.chat, [target], 'add');
    m.reply(`Silva MD bot : Successfully added @${target.split('@')[0]}`, null, { mentions: [target] });

  } catch (e) {
    console.error(e);
    m.reply(`Error: ${e.message || e}`);
  }
};

handler.help = ['add <phone number>'];
handler.tags = ['group'];
handler.command = /^add$/i;

handler.group = true; // Restrict to group chats
handler.admin = true; // Require the user to be an admin to use this command
handler.botAdmin = true; // Require the bot to be an admin to execute

export default handler;