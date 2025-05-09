export async function before(message, { conn }) {
  try {
    console.log("Processing incoming message...");

    // Check if AUTO_RECORDING is enabled
    const autoRecording = process.env.AUTO_RECORDING === "true";
    if (!autoRecording) {
      console.log("AUTO_RECORDING is disabled. Skipping recording presence.");
      return true;
    }

    // Ignore invalid or irrelevant messages
    const irrelevantTypes = ["protocolMessage", "pollUpdateMessage", "reactionMessage", "stickerMessage"];
    if (irrelevantTypes.includes(message.mtype) || message.isBaileys || message.fromMe) {
      console.log("Ignoring irrelevant or bot/system message.");
      return true;
    }

    // Ensure the message is valid (contains text or meaningful content)
    if (!message.text && !message.caption) {
      console.log("Message has no text or caption, skipping.");
      return true;
    }

    console.log(`Processing message from chat: ${message.chat}`);
    console.log(`Message content: ${message.text || message.caption}`);

    // Show "Recording" presence in the chat
    await conn.sendPresenceUpdate("recording", message.chat);
    console.log("Presence set to 'Recording'.");

    // Reset presence to "typing" after 20 seconds
    setTimeout(async () => {
      await conn.sendPresenceUpdate("typing", message.chat);
      console.log("Presence reset to 'typing'.");
    }, 20000); // 20 seconds
  } catch (error) {
    console.error("Error processing message:", error.message);
  }

  return true;
}
