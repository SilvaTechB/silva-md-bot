const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}

module.exports = {
    SESSION_ID: process.env.SESSION_ID || "",
    PREFIX: process.env.PREFIX || ".",
    BOT_NAME: process.env.BOT_NAME || "✦ Silva ✦ MD ✦",
    AUTO_STATUS_REACT: convertToBool(process.env.AUTO_STATUS_REACT, "true"),
    CUSTOM_REACT: convertToBool(process.env.CUSTOM_REACT, "false"),
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🔥,❤️‍🩹,❤️,🩷,🧡,💛,💚,💙,🩵,💜,🤎,🖤,🩶,🤍",
    DELETE_LINKS: convertToBool(process.env.DELETE_LINKS, "false"),
    OWNER_NUMBER: process.env.OWNER_NUMBER || "254700143167",
    OWNER_NAME: process.env.OWNER_NAME || "✦ Silva ✦ MD ✦",
    DESCRIPTION: process.env.DESCRIPTION || "*© ✦ Silva ✦ MD ✦*",
    ALIVE_IMG: process.env.ALIVE_IMG || "https://i.ibb.co/BVt9McxS/photo-2025-06-15-12-14-29-7516148628621099032.jpg",
    LIVE_MSG: process.env.LIVE_MSG || "> SILVA MD IS ACTIVE ⚡",
    READ_MESSAGE: convertToBool(process.env.READ_MESSAGE, "false"),
    AUTO_REACT: convertToBool(process.env.AUTO_REACT, "false"),
    ANTI_BAD: convertToBool(process.env.ANTI_BAD, "false"),
    AUTO_STATUS_SEEN: convertToBool(process.env.AUTO_STATUS_SEEN, "true"),
    AUTO_STATUS_REPLY: convertToBool(process.env.AUTO_STATUS_REPLY, "true"),
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || "*👀 Seen by Silva MD ✅*",
    MODE: process.env.MODE || "public",
    ANTI_LINK: convertToBool(process.env.ANTI_LINK, "true"),
    AUTO_VOICE: convertToBool(process.env.AUTO_VOICE, "false"),
    AUTO_STICKER: convertToBool(process.env.AUTO_STICKER, "false"),
    AUTO_REPLY: convertToBool(process.env.AUTO_REPLY, "false"),
    HEART_REACT: convertToBool(process.env.HEART_REACT, "false"),
    OWNER_REACT: convertToBool(process.env.OWNER_REACT, "true"),
    ALWAYS_ONLINE: convertToBool(process.env.ALWAYS_ONLINE, "true"),
    PUBLIC_MODE: convertToBool(process.env.PUBLIC_MODE, "true"),
    AUTO_TYPING: convertToBool(process.env.AUTO_TYPING, "true"),
    AUTO_RECORDING: convertToBool(process.env.AUTO_RECORDING, "false"),
    
    // Group Settings
    ALLOW_GROUPS: convertToBool(process.env.ALLOW_GROUPS, "true"),
    GROUP_REQUIRE_MENTION: convertToBool(process.env.GROUP_REQUIRE_MENTION, "false"),
    
    // Anti-Delete Settings
    ANTIDELETE_GROUP: convertToBool(process.env.ANTIDELETE_GROUP, "true"),
    ANTIDELETE_PRIVATE: convertToBool(process.env.ANTIDELETE_PRIVATE, "true"),
    
    // Debug Settings
    DEBUG: convertToBool(process.env.DEBUG, "false")
};
