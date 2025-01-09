const { proto, generateWAMessage, areJidsSameUser } = (await import('@whiskeysockets/baileys')).default;

export async function all(m, chatUpdate) {
  // Skip if the message is from the bot itself or has no content
  if (m.isBaileys || !m.message) return;

  // Ensure the message has a fileSha256 for validation
  const fileSha256Base64 = Buffer.from(m.msg.fileSha256).toString('base64');
  if (!fileSha256Base64 || !(fileSha256Base64 in global.db.data.sticker)) return;

  // Retrieve the text and mentioned Jid from the stored sticker data
  const { text, mentionedJid } = global.db.data.sticker[fileSha256Base64];

  try {
    // Generate a new WhatsApp message using the sticker data
    const messages = await generateWAMessage(
      m.chat,
      { text: text, mentions: mentionedJid },
      {
        userJid: this.user.id,
        quoted: m.quoted && m.quoted.fakeObj,
      }
    );

    // Set properties for the message
    messages.key.fromMe = areJidsSameUser(m.sender, this.user.id);
    messages.key.id = m.key.id;
    messages.pushName = m.pushName;
    if (m.isGroup) messages.participant = m.sender;

    // Prepare the message update and emit the event
    const msg = {
      ...chatUpdate,
      messages: [proto.WebMessageInfo.fromObject(messages)],
      type: 'append',
    };
    this.ev.emit('messages.upsert', msg);
  } catch (error) {
    console.error('Error processing the sticker message:', error);
  }
}
