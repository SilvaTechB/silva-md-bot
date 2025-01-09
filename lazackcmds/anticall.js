const delay = time => new Promise(res => setTimeout(res, time))

export async function before(m) {
  let bot = global.db.data.settings[this.user.jid] || {}

  if (m.isBaileys) return
  if (!bot.antiCall) return  // Ensure that the anti-call feature is enabled in the bot's settings.

  // Anti-call response messages based on the message type
  const messageType = {
    40: '📞 You missed a voice call, and the call has been missed.',
    41: '📹 You missed a video call, and the call has been missed.',
    45: '📞 You missed a group voice call, and the call has been missed.',
    46: '📹 You missed a group video call, and the call has been missed.',
  }[m.messageStubType]

  // Handle missed calls
  if (messageType) {
    await this.sendMessage(m.chat, {
      text: `You are banned + blocked for calling the bot`,
      mentions: [m.sender],
    })

    await delay(1000)

    // Ban and block the user
    global.db.data.users[m.sender].banned = true
    global.db.data.users[m.sender].warning = 1

    // Block the user
    await this.updateBlockStatus(m.sender, 'block')

    // Remove the user from the group if it's a group call
    if (m.isGroup) {
      await this.groupParticipantsUpdate(m.chat, [m.sender], 'remove')
    }
  } else {
    console.log({
      messageStubType: m.messageStubType,
      messageStubParameters: m.messageStubParameters,
      type: m.messageStubType,
    })
  }

  // Handle call rejection for incoming calls (anti-call feature)
  if (m.isCall) {
    // Define the warning message
    const WARNING_MESSAGE = "📞 CALL DECLINED!\n\nCalls are not allowed. Please contact the owner via text."

    // Reject the call
    const callerId = m.sender || m.key.participant
    console.log(`Incoming call detected from: ${callerId}`)
    await this.rejectCall(m.key)
    console.log(`Call rejected for ${callerId}`)

    // Send warning message to the caller
    await this.sendMessage(callerId, { text: WARNING_MESSAGE })
    console.log("Warning message sent.")
  }
}

export const disabled = false
