import { generateWAMessage, proto } from '@whiskeysockets/baileys';

export async function sendSilvaGreeting(m) {
  try {
    // Define the greeting text
    const greetingText = "👋 Hello! Welcome to Silva MD Bot! How can I assist you today?";

    // Define the buttons and their actions
    const buttons = [
      {
        buttonText: { displayText: 'Open WhatsApp Channel' },
        urlButton: { url: 'https://wa.me/your_channel_link' },  // Replace with your channel link
      },
      {
        buttonText: { displayText: 'View Bot Menu' },
        callbackData: 'show_menu',  // Customize the callback data for your bot menu
      },
      {
        buttonText: { displayText: 'View Bot Script' },
        callbackData: 'show_script',  // Customize the callback data for your bot script
      },
    ];

    // Generate the message with buttons
    const message = await generateWAMessage(
      m.chat,
      {
        text: greetingText,
        buttons: buttons,
      },
      {
        userJid: this.user.id,
        quoted: m.quoted && m.quoted.fakeObj,
      }
    );

    // Send the message
    await this.sendMessage(m.chat, { 
      text: greetingText, 
      buttons: buttons, 
      footer: "Silva MD Bot", 
      headerType: 1 
    });
    console.log('Greeting message sent.');
  } catch (error) {
    console.error('Error sending greeting message:', error);
  }
}
