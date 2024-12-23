let handler = async function (callEvent, { conn }) {
  // Check if ANTICALL is enabled
  if (process.env.ANTICALL !== "true") {
    console.log("Anti-Call feature is disabled.");
    return;
  }

  try {
    // Log incoming call details
    console.log(`Incoming call from: ${callEvent.from}, id: ${callEvent.id}`);

    // Decline the call
    if (conn.rejectIncomingCall) {
      await conn.rejectIncomingCall(callEvent.id);
      console.log(`Call from ${callEvent.from} has been declined.`);
    } else if (conn.updateBlockStatus) {
      // Temporarily block the user to ensure the call ends
      await conn.updateBlockStatus(callEvent.from, "block");
      console.log(`Temporarily blocked ${callEvent.from} to end the call.`);

      // Unblock the user after a short delay
      setTimeout(async () => {
        await conn.updateBlockStatus(callEvent.from, "unblock");
        console.log(`Unblocked ${callEvent.from}.`);
      }, 5000); // Adjust delay as necessary
    } else {
      console.warn("No method available to decline calls.");
    }

    // Send a warning message to the caller
    const warningMessage = `
*⚠️ Silva MD Bot Anti-Call System ⚠️*
Calling is not allowed. Your call has been declined automatically.
Please use text messages to communicate. Repeated calls may lead to a block.
    `.trim();

    await conn.sendMessage(callEvent.from, { text: warningMessage });

    console.log(`Warning message sent to ${callEvent.from}.`);
  } catch (error) {
    console.error("Error handling incoming call:", error.message);
  }
};

export default handler;
