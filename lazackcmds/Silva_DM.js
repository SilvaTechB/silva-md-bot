let handler = async (m, { conn, isROwner, text }) => {
  const delay = (time) => new Promise((res) => setTimeout(res, time));

  // Ensure this command is used in a group
  if (!m.isGroup) throw '*💀💀💀 THIS COMMAND CAN ONLY BE USED IN GROUPS!*';
  let groupMetadata = await conn.groupMetadata(m.chat);
  let participants = groupMetadata.participants.map((p) => p.id);

  // Get the message to broadcast
  let message = m.quoted && m.quoted.text ? m.quoted.text : text;
  if (!message) throw '*ENTER THE MESSAGE YOU WANT TO BROADCAST. 2025 SILVA MD BOT*';

  // Check for media in the quoted message
  let media = m.quoted ? await m.quoted.download() : null;
  let mediaType = m.quoted ? m.quoted.mtype : null;

  // Fallback media URL
  let fallbackMediaUrl = 'https://i.imgur.com/ihwVldr.png';

  let successCount = 0;
  let failureCount = 0;
  let sentMembers = new Set(); // To track members who have already received the message

  // Broadcast message to all group members
  for (let participant of participants) {
    if (sentMembers.has(participant)) continue; // Skip if the member has already received the message
    sentMembers.add(participant); // Mark member as sent

    try {
      await delay(500); // Delay to prevent rate limits

      if (media) {
        // Send the media with the appropriate type
        let mediaOptions = {
          caption: message,
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'SILVA MD DIRECT MESSAGE 💖🦄',
              serverMessageId: 143
            }
          }
        };

        switch (mediaType) {
          case 'imageMessage':
            mediaOptions.image = media;
            break;
          case 'videoMessage':
            mediaOptions.video = media;
            break;
          case 'audioMessage':
            mediaOptions.audio = media;
            mediaOptions.ptt = true; // Set to true if sending as a voice note
            break;
          case 'documentMessage':
            mediaOptions.document = media;
            mediaOptions.mimetype = m.quoted.mimetype || 'application/pdf';
            break;
          default:
            throw new Error('Unsupported media type');
        }

        await conn.sendMessage(participant, mediaOptions);
      } else {
        // Send fallback media or text if no quoted media
        await conn.sendMessage(participant, {
          image: { url: fallbackMediaUrl },
          caption: message,
          contextInfo: {
            mentionedJid: [m.sender],
            forwardingScore: 999,
            isForwarded: true,
            forwardedNewsletterMessageInfo: {
              newsletterJid: '120363200367779016@newsletter',
              newsletterName: 'SILVA MD DIRECT MESSAGE 💖🦄',
              serverMessageId: 143
            }
          }
        });
      }

      successCount++;
    } catch (error) {
      console.error(`Failed to send message to ${participant}:`, error);
      failureCount++;
    }
  }

  // Send completion message to the command initiator
  m.reply(
    `*TASK COMPLETED*\n\n*SUCCESS*: ${successCount} member(s)\n*FAILED*: ${failureCount} member(s)\n\n*NOTE*: Some failures may occur due to network issues, restrictions, or being blocked.\n\nWORLD-CLASS BOT CREATED BY SILVA TECH INC\n\nThank you`
  );
};

handler.help = ['members', 'dm', 'msg'].map((v) => v + ' <text>');
handler.tags = ['group', 'owner'];
handler.command = /^(members|dm|msg)$/i;
handler.owner = true;

export default handler;
