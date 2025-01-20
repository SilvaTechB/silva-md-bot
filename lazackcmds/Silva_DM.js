let handler = async (m, { conn, isROwner, text }) => {
  const delay = (time) => new Promise((res) => setTimeout(res, time));

  // Ensure this command is used in a group
  if (!m.isGroup) throw '*💀💀💀THIS COMMAND CAN ONLY BE USED IN GROUPS!*';
  let groupMetadata = await conn.groupMetadata(m.chat);
  let participants = groupMetadata.participants.map((p) => p.id);

  // Get the message to broadcast
  let message = m.quoted && m.quoted.text ? m.quoted.text : text;
  if (!message) throw '*ENTER THE MESSAGE YOU WANT TO BROADCAST. 2025 SILVA MD BOT*';

  let successCount = 0;
  let failureCount = 0;

  // Broadcast message to all group members
  for (let participant of participants) {
    try {
      await delay(500); // Delay to prevent rate limits
      await conn.relayMessage(
        participant,
        {
          extendedTextMessage: {
            text: `${message}`,
            contextInfo: {
              externalAdReply: {
                title: 'Silva MD Bot - PRIVATE MESSAGE',
                body: 'THIS IS SILVA MD BOT CREATED BY SILVA TECH INC!',
                thumbnailUrl: 'https://files.catbox.moe/8324jm.jpg', // Replace with your image URL
                sourceUrl: 'https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v', // Replace with your channel link
                renderLargerThumbnail: true,
              },
            },
          },
        },
        {}
      );
      successCount++;
    } catch (error) {
      console.error(`Failed to send message to ${participant}:`, error);
      failureCount++;
    }
  }

  // Send completion message to the command initiator
  m.reply(
    `*TASK COMPLETED*\n\n> *SUCCESS*: ${successCount} member(s)\n> *FAILED*: ${failureCount} member(s)\n\n> *NOTE*: Some failures may occur due to network issues or restrictions.`
  );
};

handler.help = ['members', 'dm', 'msg'].map((v) => v + ' <text>');
handler.tags = ['group', 'owner'];
handler.command = /^(members|dm|msg)$/i;
handler.owner = true;

export default handler;
