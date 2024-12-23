// Main handler for incoming calls
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
    await conn.rejectIncomingCall(callEvent.id);

    // Send a warning message to the caller
    const warningMessage = `
*⚠️ Silva MD Bot Anti-Call System ⚠️*
Calling is not allowed. Your call has been declined automatically.
Please use text messages to communicate. Repeated calls may lead to a block.
    `.trim();

    await conn.sendMessage(callEvent.from, { text: warningMessage });

    console.log(`Call from ${callEvent.from} declined and warning message sent.`);
  } catch (error) {
    console.error("Error handling incoming call:", error.message);
  }
};

// Export the handler
export default handler;
