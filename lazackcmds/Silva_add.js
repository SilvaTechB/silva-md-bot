// Add Member Command Script for Silva MD Bot
// This script allows group admins to add members using the command format: add 254700143167

handler.help = ['add <number>'];
handler.tags = ['group'];
handler.command = /^add$/i;

handler.group = true; // Command is only usable in groups
handler.admin = true; // Only admins can use the command
handler.botAdmin = true; // The bot must also be an admin

handler.run = async (m, { conn, text, participants }) => {
    // Check if a number was provided
    if (!text) {
        return m.reply('Please provide a phone number to add. Example: add 254700143167');
    }

    // Validate the phone number format
    const phoneNumber = text.replace(/[^0-9]/g, ''); // Remove non-numeric characters
    if (!/^(?:\d{1,3})?\d{9,15}$/.test(phoneNumber)) {
        return m.reply('Invalid phone number format. Ensure it is in international format without spaces. Example: 254700143167');
    }

    // Append country code if missing
    const fullPhoneNumber = phoneNumber.startsWith('254') ? phoneNumber : `254${phoneNumber}`;

    // Check if the user is already in the group
    const memberExists = participants.some(member => member.id.includes(fullPhoneNumber));
    if (memberExists) {
        return m.reply('The user is already in the group.');
    }

    // Attempt to add the user to the group
    try {
        const response = await conn.groupParticipantsUpdate(m.chat, [`${fullPhoneNumber}@s.whatsapp.net`], 'add');
        if (response && response[`${fullPhoneNumber}@s.whatsapp.net`] === "404") {
            return m.reply('Failed to add the user. Make sure the number is on WhatsApp and reachable.');
        }
        m.reply(`Successfully added ${fullPhoneNumber} to the group.`);
    } catch (error) {
        m.reply('Failed to add the user. Ensure the bot has admin rights and the number is valid.');
        console.error(error);
    }
};

export default handler;
