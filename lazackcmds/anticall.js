export async function before(callEvent, { conn }) {
  // Check if the Anti-Call feature is enabled
  if (process.env.ANTICALL !== "true") {
    console.log("Anti-Call feature is disabled.");
    return;
  }

  // Allow calls from owners or real owners
  const botJid = conn.user?.jid || conn.user?.id; // Get bot's JID correctly
  const isOwner = global.db.data.settings[botJid]?.owners?.includes(
    callEvent.from.split('@')[0]
  );
  if (isOwner) {
    console.log(`Call from owner ${callEvent.from} is ignored.`);
    return;
  }

  try {
    console.log(`Incoming call detected from: ${callEvent.from}`);

    // Prepare warning message
    const warningMessage = `
*⚠️ Silva MD Bot Anti-Call System ⚠️*
Calling the bot is not allowed. Your call has been automatically declined.
Please use text messages to communicate. Repeated calls may lead to a permanent block.
    `.trim();

    // Send warning message first
    await conn.sendMessage(callEvent.from, { text: warningMessage }, { mentions: [callEvent.from] });
    console.log(`Warning message sent to ${callEvent.from}.`);

    // Decline the call
    if (typeof conn.rejectCall === 'function') {
      await conn.rejectCall(callEvent.id, callEvent.from);
      console.log(`Call from ${callEvent.from} has been declined using rejectCall.`);
    } else if (typeof conn.updateBlockStatus === 'function') {
      // Fallback method: block temporarily
      await conn.updateBlockStatus(callEvent.from, 'block');
      console.log(`Temporarily blocked ${callEvent.from} to decline the call.`);
      
      // Unblock after 5 seconds
      setTimeout(async () => {
        await conn.updateBlockStatus(callEvent.from, 'unblock');
        console.log(`Unblocked ${callEvent.from}.`);
      }, 5000);
    } else {
      console.warn("No available method to decline calls.");
      return;
    }
  } catch (error) {
    console.error(`Failed to handle call from ${callEvent.from}:`, error.message || error);
  }
}

export default before;
