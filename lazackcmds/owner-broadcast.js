let handler = async (m, { conn, isROwner, text }) => {
  const delay = (time) => new Promise((res) => setTimeout(res, time));

  // Fetch all contacts
  let contacts = Object.keys(await conn.fetchAllContacts());

  // Get the message to broadcast
  let message = m.quoted && m.quoted.text ? m.quoted.text : text;
  if (!message) throw '*ENTER THE MESSAGE YOU WANT TO BROADCAST*';

  let successCount = 0;
  let failureCount = 0;

  // Broadcast message to all contacts
  for (let contact of contacts) {
    try {
      await delay(500); // Delay to prevent rate limits
      await conn.relayMessage(
        contact,
        {
          extendedTextMessage: {
            text: `[ALERT]\n\n${message}\n\nTHIS IS AN OFFICIAL STATEMENT FROM DEVELOPER`,
            contextInfo: { mentionedJid: [] },
          },
        },
        {}
      );
      successCount++;
    } catch (error) {
      console.error(`Failed to send message to contact ${contact}:`, error);
      failureCount++;
    }
  }

  // Send completion message
  m.reply(
    `*BROADCAST COMPLETED*\n\n*SUCCESS*: ${successCount} contact(s)\n*FAILED*: ${failureCount} contact(s)\n\n*NOTE*: Some failures may occur due to network issues or restrictions.`
  );
};

handler.help = ['broadcastall', 'bcall'].map((v) => v + ' <text>');
handler.tags = ['owner'];
handler.command = /^(broadcast|bc)(all|contacts)$/i;
handler.owner = true;

export default handler;
