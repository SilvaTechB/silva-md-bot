conn.ev.on("call", async (calls) => {
  const rejectSetting = process.env.REJECTSCALLS;
  const callMsg = process.env.CALLMSG || "📵 *ANTICALL IS ACTIVATED!*\n\n🚫 Don't disturb me by calling again and again.";

  for (let call of calls) {
    if (call.status !== 'offer') continue;

    // Reject the call
    await conn.rejectCall(call.id, call.from);

    // Send warning message if REJECTSCALLS is set to 'truemsg'
    if (rejectSetting === "truemsg") {
      await conn.sendMessage(call.from, { text: callMsg });
    }
  }
});
