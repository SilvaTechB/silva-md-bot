const handler = async (m, { conn }) => {

  try {

    // React with "waiting" emoji (🕐) as soon as the command is received

    await m.react('🕐'); // Emoji for wait (clock)

    // Ensure the command is used in a group

    if (!m.isGroup) {

      return await m.reply('*This command can only be used in a group chat.*');

    }

    // Get the group JID

    const groupJid = m.chat;

    const groupMetadata = await conn.groupMetadata(groupJid);

    if (!groupMetadata) {

      return await m.reply('*Unable to fetch group metadata.*');

    }

    const { subject: groupName, participants } = groupMetadata;

    // List to store member details

    const memberDetails = [];

    // Loop through all participants in the group

    let count = 1; // Initialize counter for listing participants

    for (let participant of participants) {

      const jid = participant.id;

      // Format the member entry with bold count

      memberDetails.push(`*${count++}*: ${jid}`);

    }

    // Compose the final message with bold for group info and members

    let messageContent = `*Silva created Group JID:* ${groupJid}\n*Group Name:* ${groupName}\n\n*Group Members:*\n${memberDetails.join('\n')}`;

    // Send the message to the group

    await m.reply(messageContent);

    // React with "done" emoji (✅) once the operation is complete

    await m.react('✅'); // Emoji for done (checkmark)

  } catch (error) {

    console.error('Error fetching group metadata or sending message:', error);

    await m.reply('*An error occurred while fetching group metadata. Please try again later.*');

  }

};

// Command metadata for registration

handler.help = ['getjids'];

handler.tags = ['group'];

handler.command = /^getjids$/i;

export default handler;
