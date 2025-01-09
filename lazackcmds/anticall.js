import { makeWASocket, useSingleFileAuthState } from '@whiskeysockets/baileys';

export async function before(callEvent) {
  try {
    // Enable or disable call blocker
    const CALL_BLOCKER_ENABLED = true;
    if (!CALL_BLOCKER_ENABLED) {
      console.log("Call Blocker is disabled. Skipping...");
      return false;
    }

    // Set up warning message and audio
    const WARNING_MESSAGE =
      "📞 CALL DECLINED!\n\nCalls are not allowed. Please contact the owner via text.";
    const WARNING_AUDIO_URL = "https://files.catbox.moe/8qmisk.mp3"; // Replace with your audio file URL

    // Make sure the event is a call
    if (!callEvent || !callEvent.isCall) {
      console.log("Not a call event. Skipping...");
      return false;
    }

    // Get the caller's ID
    const callerId = callEvent.sender || callEvent.key.participant;
    console.log(`Incoming call detected from: ${callerId}`);

    // Reject the call (this applies to all calls, including from the developer)
    await conn.rejectCall(callEvent.key);
    console.log(`Call rejected for ${callerId}`);

    // Send the warning message
    console.log(`Sending warning message to ${callerId}`);
    await conn.sendMessage(callerId, { text: WARNING_MESSAGE });

    // Send the warning audio (if applicable)
    if (WARNING_AUDIO_URL) {
      console.log(`Sending warning audio to ${callerId}`);
      await conn.sendMessage(
        callerId,
        {
          audio: { url: WARNING_AUDIO_URL },
          mimetype: "audio/mp3",
          ptt: true, // Sends as a voice note
        }
      );
      console.log("Warning audio sent.");
    }

    return true;
  } catch (error) {
    console.error("Failed to process the call event:", error.message || "Unknown error");
    return false;
  }
}

// Baileys connection setup
const { state, saveState } = useSingleFileAuthState('auth_info.json');
const conn = makeWASocket({
  auth: state,
  printQRInTerminal: true,
});

conn.ev.on('call', async (callEvent) => {
  try {
    // Reject incoming calls, regardless of the caller
    if (callEvent.status === 'incoming') {
      console.log("Incoming call detected, rejecting...");
      await before(callEvent);
    }
  } catch (error) {
    console.error("Error handling the call:", error);
  }
});
