export async function before(callEvent, { conn }) {
  // Check if the Anti-Call feature is enabled
  if (process.env.ANTICALL !== "true") {
    console.log("Anti-Call feature is disabled.");
    return;
  }

  // Allow calls from owners or real owners
  const isOwner = global.db.data.settings[this.user.jid]?.owners?.includes(callEvent.from.split('@')[0]);
  if (isOwner) {
    console.log(`Call from owner ${callEvent.from} is ignored.`);
    return;
  }

  try {
    console.log(`Incoming call detected from: ${callEvent.from}`);

    // Decline the call
    if (conn.rejectIncomingCall) {
      await conn.rejectIncomingCall(callEvent.id);
      console.log(`Call from ${callEvent.from} has been declined.`);
    } else if (conn.updateBlockStatus) {
      // Block the caller to ensure the call is declined
      await conn.updateBlockStatus(callEvent.from, 'block');
      console.log(`Temporarily blocked ${callEvent.from} to decline the call.`);

      // Unblock the caller after a short delay (5 seconds)
      setTimeout(async () => {
        await conn.updateBlockStatus(callEvent.from, 'unblock');
        console.log(`Unblocked ${callEvent.from}.`);
      }, 5000);
    } else {
      console.warn("No method available to decline calls.");
      return;
    }

    // Send a warning message to the caller
    const warningMessage = `
*⚠️ Silva MD Bot Anti-Call System ⚠️*
Calling the bot is not allowed. Your call has been automatically declined.
Please use text messages to communicate. Repeated calls may lead to a permanent block.
`.trim();

    await conn.sendMessage(callEvent.from, { text: warningMessage }, { mentions: [callEvent.from] });
    console.log(`Warning message sent to ${callEvent.from}.`);
  } catch (error) {
    console.error(`Failed to handle call from ${callEvent.from}:`, error.message || "Unknown error");
  }
}

export default before;
