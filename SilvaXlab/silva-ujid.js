let handler = async (m, { conn, args, usedPrefix, command }) => {
    // Check if the message is a reply to another chat
    if (!m.quoted) {
        return m.reply('Please reply to a message in the group.');
    }

    // Check if the chat is a group
    if (!m.isGroup) {
        return m.reply('This command can only be used in a group.');
    }

    try {
        // Retrieve the group metadata
        const groupMetadata = await conn.groupMetadata(m.chat);
        const members = groupMetadata.participants;

        // Check if there are members in the group
        if (!members || members.length === 0) {
            return m.reply('No members found in the group.');
        }

        // Generate a single ID for each member and join them into a single string
        const ids = members.map(member => member.id).join(', ');

        // Reply with the generated IDs
        m.reply(`SILVA MD IS GENERATING JIDS FOR EVERYONE IN THIS GROUP💀💀:\n${ids}`);
    } catch (error) {
        console.error('Error retrieving group participants:', error);
        m.reply('An error occurred while retrieving group members. Please ensure the bot has the right permissions and try again.');
    }
};

// Command metadata
handler.help = ['ujid'];
handler.tags = ['tools'];
handler.command = ['ujid'];

export default handler;
