let handler = async (m, { conn, isROwner, text }) => {
  const delay = (time) => new Promise((res) => setTimeout(res, time));

  // Fetch all participating groups
  let getGroups = await conn.groupFetchAllParticipating();
  let groups = Object.values(getGroups);
  let groupIds = groups.map((group) => group.id);

  // Get the message to broadcast
  let message = m.quoted && m.quoted.text ? m.quoted.text : text;
  if (!message) throw '*ENTER THE MESSAGE YOU WANT TO BROADCAST*';

  let successCount = 0;
  let failureCount = 0;

  // Broadcast message to all groups
  for (let groupId of groupIds) {
    try {
      await delay(500); // Delay to prevent rate limits
      await conn.relayMessage(
        groupId,
        {
          liveLocationMessage: {
            degreesLatitude: 35.685506276233525,
            degreesLongitude: 139.75270667105852,
            accuracyInMeters: 1,
            degreesClockwiseFromMagneticNorth: 0,
            caption: `[ALERT]\n\n${message}\n\nTHIS IS AN OFFICIAL STATEMENT FROM DEVELOPER`,
            sequenceNumber: 1,
            timeOffset: 0,
            contextInfo: {},
          },
        },
        {}
      );
      successCount++;
    } catch (error) {
      console.error(`Failed to send message to group ${groupId}:`, error);
      failureCount++;
    }
  }

  // Send completion message
  m.reply(
    `*BROADCAST COMPLETED*\n\n*SUCCESS*: ${successCount} group(s)\n*FAILED*: ${failureCount} group(s)\n\n*NOTE*: Some failures may occur due to network issues or group restrictions.`
  );
};

handler.help = ['broadcastgroup', 'bcgc'].map((v) => v + ' <text>');
handler.tags = ['owner'];
handler.command = /^(broadcast|bc)(group|grup|gc)$/i;
handler.owner = true;

export default handler;
