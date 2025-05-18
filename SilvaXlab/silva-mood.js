// Silva Tech Inc. – Mood Assistant with Location
// Contact: +254700143167 | silvatech.inc

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const isMoodCommand = command === 'mood';
    const mood = args[0]?.toLowerCase();

    // Mood Assistant Menu
    if (m.text === '#moodassistant') {
        await conn.sendMessage(m.chat, {
            location: {
                degreesLatitude: -1.2921,
                degreesLongitude: 36.8219
            },
            caption: `🧘 *Silva Mood Assistant*\n\nHow are you feeling right now?\nChoose your current mood to get supportive vibes.\n\n*You may also send your location for personalized tips!*`,
            footer: `Silva Mood Tracker™ – Powered by Silva Tech Inc.`,
            buttons: [
                { buttonId: '.mood happy', buttonText: { displayText: '😊 Happy' }, type: 1 },
                { buttonId: '.mood sad', buttonText: { displayText: '😢 Sad' }, type: 1 },
                { buttonId: '.mood angry', buttonText: { displayText: '😡 Angry' }, type: 1 },
                { buttonId: '.mood tired', buttonText: { displayText: '😴 Tired' }, type: 1 },
                { buttonId: '#mainmenu', buttonText: { displayText: '🔙 Main Menu' }, type: 1 }
            ],
            headerType: 6,
            viewOnce: true
        }, { quoted: m });
        return;
    }

    // Handle mood response
    if (isMoodCommand) {
        let locationNote = '';
        if (m.message?.locationMessage) {
            const lat = m.message.locationMessage.degreesLatitude;
            const lon = m.message.locationMessage.degreesLongitude;
            locationNote = `\n\n📍 *Location Detected:*\nLat: ${lat.toFixed(2)} | Lon: ${lon.toFixed(2)}\nSilva says: Your vibe + your environment = better care.`;
        }

        let response = '';
        switch (mood) {
            case 'happy':
                response = `😊 *You're glowing today!*\n\n“_Happiness is not a goal... it's a by-product of a life well lived._”\nKeep smiling, superstar!${locationNote}`;
                break;
            case 'sad':
                response = `😢 *It’s okay to feel down.*\n\n“_Tears come from the heart and not from the brain._”\nSending hugs your way.${locationNote}`;
                break;
            case 'angry':
                response = `😡 *Take a deep breath.*\n\n“_Anger is one letter short of danger._”\nTry the 5-4-3-2-1 technique to recenter.${locationNote}`;
                break;
            case 'tired':
                response = `😴 *You deserve rest.*\n\n“_Rest is not idleness... sometimes it’s healing._”\nStretch. Breathe. Recharge.${locationNote}`;
                break;
            default:
                response = `❓ *Unknown mood:*\n\`${mood || ''}\`\n\nTry:\n• \`${usedPrefix}mood happy\`\n• \`${usedPrefix}mood sad\`\n• \`${usedPrefix}mood angry\`\n• \`${usedPrefix}mood tired\``;
        }

        await conn.sendMessage(m.chat, {
            text: response
        }, { quoted: m });
    }
};

handler.help = ['moodassistant', 'mood <happy|sad|angry|tired>'];
handler.tags = ['fun', 'vibe', 'ai'];
handler.command = ['moodassistant', 'mood'];

export default handler;