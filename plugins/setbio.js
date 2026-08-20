'use strict';

module.exports = {
    commands:    ['setbio', 'setabout', 'about'],
    description: 'Set the bot WhatsApp About/Bio',
    permission:  'owner',
    group:       false,
    private:     true,
    run: async (sock, message, args, { sender, contextInfo }) => {
        const bio = args.join(' ');
        if (!bio) {
            return sock.sendMessage(sender, {
                text: '📝 Usage: .setbio <text>\nExample: .setbio Silva MD Bot 🤖 | Always Online',
                contextInfo
            }, { quoted: message });
        }
        try {
            await sock.updateProfileStatus(bio);
            await sock.sendMessage(sender, {
                text: `✅ *Bot bio updated!*\n\n📝 ${bio}`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Failed to update bio: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
