const { cmd } = require("../command");
const config = require('../config');

// ========================= COMPATIBILITY COMMAND =========================
cmd({
  pattern: "compatibility",
  alias: ["friend", "fcheck"],
  desc: "Calculate the compatibility score between two users.",
  category: "fun",
  react: "💖",
  filename: __filename,
  use: "@tag1 @tag2",
}, async (conn, mek, m, { args, reply }) => {
  try {
    if (args.length < 2) {
      return reply("Please mention two users to calculate compatibility.\nUsage: `.compatibility @user1 @user2`");
    }

    let user1 = m.mentionedJid[0];
    let user2 = m.mentionedJid[1];
    const specialNumber = config.DEV ? `${config.DEV}@s.whatsapp.net` : null;

    let compatibilityScore = Math.floor(Math.random() * 1000) + 1;

    if (user1 === specialNumber || user2 === specialNumber) {
      compatibilityScore = 1000;
      return reply(`💖 Compatibility between @${user1.split('@')[0]} and @${user2.split('@')[0]}: ${compatibilityScore}+/1000 💖`);
    }

    await conn.sendMessage(mek.chat, {
      text: `💖 Compatibility between @${user1.split('@')[0]} and @${user2.split('@')[0]}: ${compatibilityScore}/1000 💖`,
      mentions: [user1, user2],
    }, { quoted: mek });

  } catch (error) {
    console.log(error);
    reply(`❌ Error: ${error.message}`);
  }
});

// ========================= AURA COMMAND =========================
cmd({
  pattern: "aura",
  desc: "Calculate aura score of a user.",
  category: "fun",
  react: "💀",
  filename: __filename,
  use: "@tag",
}, async (conn, mek, m, { args, reply }) => {
  try {
    if (args.length < 1) {
      return reply("Please mention a user to calculate their aura.\nUsage: `.aura @user`");
    }

    let user = m.mentionedJid[0];
    const specialNumber = config.DEV ? `${config.DEV}@s.whatsapp.net` : null;

    let auraScore = Math.floor(Math.random() * 1000) + 1;

    if (user === specialNumber) {
      auraScore = 999999;
      return reply(`💀 Aura of @${user.split('@')[0]}: ${auraScore}+ 🗿`);
    }

    await conn.sendMessage(mek.chat, {
      text: `💀 Aura of @${user.split('@')[0]}: ${auraScore}/1000 🗿`,
      mentions: [user],
    }, { quoted: mek });

  } catch (error) {
    console.log(error);
    reply(`❌ Error: ${error.message}`);
  }
});

// ========================= ROAST COMMAND =========================
cmd({
    pattern: "roast",
    desc: "Roast someone in English",
    category: "fun",
    react: "🔥",
    filename: __filename,
    use: "@tag"
}, async (conn, mek, m, { q, reply }) => {
    let roasts = [
        "Bro, your IQ is lower than my Wi-Fi signal strength!",
        "Your brain works like WhatsApp status—disappears in 24 hours!",
        "Stop overthinking, you're not a NASA scientist!",
        "Who even are you? Google doesn't know you exist!",
        "Your brain runs slower than 2G internet!",
        "Don't overthink bro, your battery will drain faster!",
        "Your ideas crash faster than a cheap app!",
        "You're VIP – Very Idiotic Person!",
        "Your logic needs a software update… badly!",
        "You’re like an old app—full of bugs and nobody wants to use you!",
        "Your thoughts move slower than a buffering video!",
        "Bro, you’re a walking error message!",
        "Your brain is on low power mode permanently!",
        "You're proof that not all apps should be downloaded!",
        "If stupidity was a game, you'd be the final boss!",
        "Your life is like Windows XP—outdated and crashing!",
        "Your brain needs a factory reset!",
        "You're like a broken link—always unavailable!",
        "Google searches your name and says '404 Not Found'!",
        "Your personality is like dead battery—completely drained!",
        "If brains were Wi-Fi, you'd be on airplane mode!",
        "Your life decisions are worse than pop-up ads!",
        "You should come with a warning: 'Caution! Too much stupidity ahead!'",
        "Your existence is like an unskippable ad—annoying and unnecessary!"
    ];

    let randomRoast = roasts[Math.floor(Math.random() * roasts.length)];
    let mentionedUser = m.mentionedJid[0] || (mek.quoted && mek.quoted.sender);

    if (!mentionedUser) {
        return reply("Usage: .roast @user (Tag someone to roast them!)");
    }

    let target = `@${mentionedUser.split("@")[0]}`;
    let message = `${target}:\n🔥 *${randomRoast}*\n> Just for fun, don't take it personally!`;
    
    await conn.sendMessage(mek.chat, { text: message, mentions: [mek.sender, mentionedUser] }, { quoted: mek });
});

// ========================= 8BALL COMMAND =========================
cmd({
    pattern: "8ball",
    desc: "Magic 8-Ball gives answers",
    category: "fun",
    react: "🎱",
    filename: __filename
}, 
async (conn, mek, m, { from, q, reply }) => {
    if (!q) return reply("Ask a yes/no question! Example: .8ball Will I be rich?");
    
    let responses = [
        "Yes!", "No.", "Maybe...", "Definitely!", "Not sure.", 
        "Ask again later.", "I don't think so.", "Absolutely!", 
        "No way!", "Looks promising!"
    ];
    
    let answer = responses[Math.floor(Math.random() * responses.length)];
    
    reply(`🎱 *Magic 8-Ball says:* ${answer}`);
});

// ========================= COMPLIMENT COMMAND =========================
cmd({
    pattern: "compliment",
    desc: "Give a nice compliment",
    category: "fun",
    react: "😊",
    filename: __filename,
    use: "@tag (optional)"
}, async (conn, mek, m, { reply }) => {
    let compliments = [
        "You're amazing just the way you are! 💖",
        "You light up every room you walk into! 🌟",
        "Your smile is contagious! 😊",
        "You're a genius in your own way! 🧠",
        "You bring happiness to everyone around you! 🥰",
        "You're like a human sunshine! ☀️",
        "Your kindness makes the world a better place! ❤️",
        "You're unique and irreplaceable! ✨",
        "You're a great listener and a wonderful friend! 🤗",
        "Your positive vibes are truly inspiring! 💫"
    ];

    let randomCompliment = compliments[Math.floor(Math.random() * compliments.length)];
    let sender = `@${mek.sender.split("@")[0]}`;
    let mentionedUser = m.mentionedJid[0] || (mek.quoted && mek.quoted.sender);
    let target = mentionedUser ? `@${mentionedUser.split("@")[0]}` : "";

    let message = mentionedUser 
        ? `${sender} complimented ${target}:\n😊 *${randomCompliment}*`
        : `${sender}, you forgot to tag someone! But hey, here's a compliment for you:\n😊 *${randomCompliment}*`;

    await conn.sendMessage(mek.chat, { text: message, mentions: [mek.sender, mentionedUser].filter(Boolean) }, { quoted: mek });
});

// ========================= LOVE TEST COMMAND =========================
cmd({
    pattern: "lovetest",
    desc: "Check love compatibility between two users",
    category: "fun",
    react: "❤️",
    filename: __filename,
    use: "@tag1 @tag2"
}, async (conn, mek, m, { args, reply }) => {
    if (args.length < 2) return reply("Tag two users! Example: .lovetest @user1 @user2");

    let user1 = args[0].replace("@", "") + "@s.whatsapp.net";
    let user2 = args[1].replace("@", "") + "@s.whatsapp.net";

    let lovePercent = Math.floor(Math.random() * 100) + 1;

    let messages = [
        { range: [90, 100], text: "💖 *A match made in heaven!* True love exists!" },
        { range: [75, 89], text: "😍 *Strong connection!* This love is deep and meaningful." },
        { range: [50, 74], text: "😊 *Good compatibility!* You both can make it work." },
        { range: [30, 49], text: "🤔 *It’s complicated!* Needs effort, but possible!" },
        { range: [10, 29], text: "😅 *Not the best match!* Maybe try being just friends?" },
        { range: [1, 9], text: "💔 *Uh-oh!* This love is as real as a Bollywood breakup!" }
    ];

    let loveMessage = messages.find(msg => lovePercent >= msg.range[0] && lovePercent <= msg.range[1]).text;

    let message = `💘 *Love Compatibility Test* 💘\n\n❤️ *@${user1.split("@")[0]}* + *@${user2.split("@")[0]}* = *${lovePercent}%*\n${loveMessage}`;

    await conn.sendMessage(mek.chat, { text: message, mentions: [user1, user2] }, { quoted: mek });
});

// ========================= EMOJI CONVERTER =========================
cmd({
    pattern: "emoji",
    desc: "Convert text into emoji form.",
    category: "fun",
    react: "🙂",
    filename: __filename,
    use: "<text>"
}, async (conn, mek, m, { args, q, reply }) => {
    try {
        let text = args.join(" ");
        let emojiMapping = {
            "a": "🅰️", "b": "🅱️", "c": "🇨️", "d": "🇩️", "e": "🇪️",
            "f": "🇫️", "g": "🇬️", "h": "🇭️", "i": "🇮️", "j": "🇯️",
            "k": "🇰️", "l": "🇱️", "m": "🇲️", "n": "🇳️", "o": "🅾️",
            "p": "🇵️", "q": "🇶️", "r": "🇷️", "s": "🇸️", "t": "🇹️",
            "u": "🇺️", "v": "🇻️", "w": "🇼️", "x": "🇽️", "y": "🇾️", "z": "🇿️",
            "0": "0️⃣", "1": "1️⃣", "2": "2️⃣", "3": "3️⃣", "4": "4️⃣",
            "5": "5️⃣", "6": "6️⃣", "7": "7️⃣", "8": "8️⃣", "9": "9️⃣",
            " ": "␣"
        };

        let emojiText = text.toLowerCase().split("").map(char => emojiMapping[char] || char).join("");
        if (!text) return reply("Please provide some text to convert into emojis!");

        await conn.sendMessage(mek.chat, { text: emojiText }, { quoted: mek });

    } catch (error) {
        console.log(error);
        reply(`Error: ${error.message}`);
    }
});
