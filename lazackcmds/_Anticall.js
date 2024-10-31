conn.ev.on("call", async callEvents => {
  // Check if anti-call feature is enabled
  const isAntiCallEnabled = process.env.ANTI_CALL === "true";

  if (isAntiCallEnabled) {
    for (let callEvent of callEvents) {
      // Check if the call event is an incoming call (status "offer")
      if (callEvent.status === "offer") {
        try {
          // Message to be sent to the caller
          const warningMessage = {
            text: "*ANTICALL IS ACTIVATED*\n*Please do not disturb me by calling repeatedly.*\n*Here is my bot owner's contact information.*\n\nᴘʀɪɴᴄᴇ ᴍᴅ"
          };

          // Send the warning message to the caller
          let sentMessage = await conn.sendMessage(callEvent.from, warningMessage);
          console.log("Warning message sent:", sentMessage);

          // Send the bot owner's contact to the caller
          await conn.sendContact(callEvent.from, global.owner, sentMessage);
          console.log("Owner's contact sent to:", callEvent.from);

          // Reject the incoming call
          await conn.rejectCall(callEvent.id, callEvent.from);
          console.log("Call rejected from:", callEvent.from);

        } catch (error) {
          console.error("Error handling call event:", error);
        }
      }
    }
  } else {
    console.log("Anti-call feature is disabled.");
  }
});
