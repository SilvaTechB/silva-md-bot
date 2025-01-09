export async function before(m, { conn }) {
  try {
    // Check if the call blocker is enabled
    const CALL_BLOCKER_ENABLED = process.env.CALL_BLOCKER_ENABLED === "true";
    if (!CALL_BLOCKER_ENABLED) {
      console.log("Call Blocker is disabled. Skipping call handling.");
      return false;
    }

    // Ensure the message is a call
    if (!m.isCall) {
      return false;
    }

    const callerId = m.sender;

    // Decline the call
    console.log(`Declining call from ${callerId}...`);
    await conn.updateBlockStatus(callerId, 'block'); // Temporarily block the caller
    await conn.updateBlockStatus(callerId, 'unblock'); // Unblock after a second

    // Send a warning message
    const WARNING_MESSAGE = process.env.WARNING_MESSAGE || 
      "*📞 CALL DECLINED!*\n\nCalls to this bot are not allowed. Please use text or contact the owner directly if needed.\n\nRepeated violations may result in blocking.";
    await conn.reply(callerId, WARNING_MESSAGE, m);

    // Send a warning audio message, if URL is provided
    const WARNING_AUDIO_URL = process.env.WARNING_AUDIO_URL || "https://files.catbox.moe/8qmisk.mp3";
    if (WARNING_AUDIO_URL) {
      await conn.sendMessage(
        callerId,
        { audio: { url: WARNING_AUDIO_URL }, mimetype: 'audio/mp3', ptt: true }, // Sends it as a voice note
        { quoted: m }
      );
    }

    console.log(`Call from ${callerId} declined and warning sent.`);
  } catch (error) {
    console.error(`Error handling call from ${m.sender}:`, error.message);
  }

  return true;
}
