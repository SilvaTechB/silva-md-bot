// Silva Tech Inc. – Mood Assistant Feature 
// Contact: +254700143167 | silvatech.inc

let handler = async (m, { conn, args, usedPrefix, command }) => {
    const text = m.text || ''
    const isMoodCommand = command === 'mood'

    // Mood Assistant Main Menu Trigger
    if (text === '#moodassistant') {
        await conn.sendMessage(m.chat, {
            text: `🧘 *Silva Mood Assistant*\n\nHow are you feeling right now?\nChoose a mood to receive the perfect response.`,
            footer: "Silva Tech Inc. | Powered by your emotions",
            buttons: [
                { buttonId: '.mood happy', buttonText: { displayText: '😊 Happy' }, type: 1 },
                { buttonId: '.mood sad', buttonText: { displayText: '😢 Sad' }, type: 1 },
                { buttonId: '.mood angry', buttonText: { displayText: '😡 Angry' }, type: 1 },
                { buttonId: '.mood tired', buttonText: { displayText: '😴 Tired' }, type: 1 },
                { buttonId: '#mainmenu', buttonText: { displayText: '🔙 Main Menu' }, type: 1 }
            ],
            headerType: 1
        }, { quoted: m });

        return;
    }

    // Mood Subcommands Handler
    if (isMoodCommand) {
        const mood = args[0]?.toLowerCase();
        let response = '';
        switch (mood) {
            case 'happy':
                response = `😊 *You’re glowing today!*  
“_Happiness is not a goal... it's a by-product of a life well lived._”`;
                break;

            case 'sad':
                response = `😢 *It’s okay to be sad.*  
“_Tears come from the heart and not from the brain._”  
🫂 Virtual hugs for you.`;
                break;

            case 'angry':
                response = `😡 *Take a deep breath.*  
“_Anger is one letter short of danger._”  
Silva suggests: 5-4-3-2-1 technique – try it!`;
                break;

            case 'tired':
                response = `😴 *You need rest.*  
“_Rest is not idleness... sometimes it’s healing._”  
Silva recommends a break or short walk.`;
                break;

            default:
                response = `❓ Unknown mood: \`${mood || ''}\`\n\nTry:\n• \`${usedPrefix}mood happy\`\n• \`${usedPrefix}mood sad\`\n• \`${usedPrefix}mood angry\`\n• \`${usedPrefix}mood tired\``;
                break;
        }

        await conn.sendMessage(m.chat, { text: response }, { quoted: m });
    }
};

handler.help = ['moodassistant', 'mood <happy|sad|angry|tired>'];
handler.tags = ['fun', 'vibe', 'ai'];
handler.command = ['moodassistant', 'mood'];

export default handler;