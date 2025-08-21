const fs = require('fs');
const path = require('path');

// Settings file path
const AUTO_REPLY_PATH = path.join(__dirname, '../auto-reply-settings.json');

// Default settings
const defaultSettings = {
    enabled: true,
    responses: {
        greetings: {
            patterns: ["hi", "hello", "hey", "hola", "namaste", "salam"],
            replies: [
                "Hello! How can I help you today?",
                "Hi there! What can I do for you?",
                "Hey! Nice to see you. How can I assist?",
                "Hello! Silva MD Bot at your service."
            ]
        },
        thanks: {
            patterns: ["thank", "thanks", "thx", "appreciate", "grateful"],
            replies: [
                "You're welcome!",
                "Happy to help!",
                "Anytime!",
                "Glad I could assist you!"
            ]
        },
        botInfo: {
            patterns: ["who are you", "what are you", "your name", "about you"],
            replies: [
                "I'm Silva MD Bot, an advanced WhatsApp assistant created by Silva Tech Inc.",
                "I'm Silva MD, your helpful WhatsApp assistant!",
                "I'm Silva MD Bot, designed to make your WhatsApp experience better."
            ]
        },
        creator: {
            patterns: ["who made you", "who created you", "your creator", "your developer"],
            replies: [
                "I was created by Silva Tech Inc. 🌟",
                "Silva Tech Inc. developed me to assist users like you!",
                "I'm a product of Silva Tech Inc.'s innovation."
            ]
        },
        time: {
            patterns: ["time", "what time", "current time", "what's the time"],
            replies: [
                () => {
                    const now = new Date();
                    return `The current time is: ${now.toLocaleTimeString()}`;
                }
            ]
        },
        date: {
            patterns: ["date", "what date", "today's date", "what's the date"],
            replies: [
                () => {
                    const now = new Date();
                    return `Today's date is: ${now.toLocaleDateString()}`;
                }
            ]
        }
    },
    ignoredGroups: [], // Groups where auto-reply is disabled
    responseDelay: 1000, // Delay before responding in milliseconds
    learningMode: false // If true, bot will ask for responses to new queries
};

// Load settings
function loadSettings() {
    try {
        if (fs.existsSync(AUTO_REPLY_PATH)) {
            return JSON.parse(fs.readFileSync(AUTO_REPLY_PATH, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading auto-reply settings:', error);
    }
    return defaultSettings;
}

// Save settings
function saveSettings(settings) {
    try {
        fs.writeFileSync(AUTO_REPLY_PATH, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving auto-reply settings:', error);
    }
}

// Initialize settings
const settings = loadSettings();

// Learning data storage
const learningData = {
    pendingResponses: new Map(), // Map of message ID to user query
    unknownQueries: new Set()    // Set of queries that need responses
};

module.exports = {
    name: 'autoreply',
    commands: ['autoreply', 'ar'],
    tags: ['tools'],
    description: 'Auto-reply system with intelligent responses',
    
    // Initialize the plugin
    init: (sock) => {
        console.log('Auto-reply plugin initialized');
        
        // Listen for messages
        sock.ev.on('messages.upsert', async ({ messages }) => {
            if (!settings.enabled) return;
            
            const message = messages[0];
            if (!message.message || message.key.fromMe) return;
            
            const chatId = message.key.remoteJid;
            const isGroup = chatId.endsWith('@g.us');
            const sender = message.key.participant || message.key.remoteJid;
            
            // Check if auto-reply is disabled for this group
            if (isGroup && settings.ignoredGroups.includes(chatId)) return;
            
            // Get message text
            let text = '';
            if (message.message.conversation) {
                text = message.message.conversation.toLowerCase();
            } else if (message.message.extendedTextMessage) {
                text = message.message.extendedTextMessage.text.toLowerCase();
            } else {
                return; // Not a text message
            }
            
            // Check if this is a response to a learning query
            if (learningData.pendingResponses.has(message.key.id)) {
                const originalQuery = learningData.pendingResponses.get(message.key.id);
                await handleLearningResponse(sock, message, originalQuery, text);
                learningData.pendingResponses.delete(message.key.id);
                return;
            }
            
            // Find matching response
            const response = findMatchingResponse(text);
            if (response) {
                // Add delay before responding
                setTimeout(async () => {
                    try {
                        await sock.sendMessage(
                            chatId,
                            { 
                                text: typeof response === 'function' ? response() : response,
                                contextInfo: {
                                    mentionedJid: [sender],
                                    externalAdReply: {
                                        title: "Silva MD Auto-Reply",
                                        body: "Intelligent response system",
                                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                        mediaType: 1
                                    }
                                }
                            },
                            { quoted: message }
                        );
                    } catch (error) {
                        console.error('Error sending auto-reply:', error);
                    }
                }, settings.responseDelay);
            } else if (settings.learningMode) {
                // If learning mode is on and no response found
                learningData.unknownQueries.add(text);
                learningData.pendingResponses.set(message.key.id, text);
                
                await sock.sendMessage(
                    chatId,
                    { 
                        text: `I'm not sure how to respond to "${text}".\n\nPlease teach me by replying with the response I should give.`,
                        contextInfo: {
                            mentionedJid: [sender]
                        }
                    },
                    { quoted: message }
                );
            }
        });
    },
    
    handler: async ({ sock, m, sender, args, contextInfo, isGroup }) => {
        try {
            const action = args[0]?.toLowerCase();
            const userNumber = sender.split('@')[0];
            
            // Check if user is admin
            const isAdmin = userNumber === '254700143167'; // Replace with your admin number
            
            if (!action) {
                return await showAutoReplyStatus(sock, sender, m, contextInfo);
            }
            
            if (!isAdmin) {
                return sock.sendMessage(
                    sender,
                    { 
                        text: '❌ You are not authorized to manage auto-reply settings.',
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }
            
            switch (action) {
                case 'on':
                    settings.enabled = true;
                    saveSettings(settings);
                    await sock.sendMessage(
                        sender,
                        { text: '✅ Auto-reply system enabled.' },
                        { quoted: m }
                    );
                    break;
                    
                case 'off':
                    settings.enabled = false;
                    saveSettings(settings);
                    await sock.sendMessage(
                        sender,
                        { text: '✅ Auto-reply system disabled.' },
                        { quoted: m }
                    );
                    break;
                    
                case 'status':
                    await showAutoReplyStatus(sock, sender, m, contextInfo);
                    break;
                    
                case 'learning':
                    const learningMode = args[1]?.toLowerCase();
                    if (learningMode === 'on') {
                        settings.learningMode = true;
                        saveSettings(settings);
                        await sock.sendMessage(
                            sender,
                            { text: '✅ Learning mode enabled. I will ask for responses to unknown queries.' },
                            { quoted: m }
                        );
                    } else if (learningMode === 'off') {
                        settings.learningMode = false;
                        saveSettings(settings);
                        await sock.sendMessage(
                            sender,
                            { text: '✅ Learning mode disabled.' },
                            { quoted: m }
                        );
                    } else {
                        await sock.sendMessage(
                            sender,
                            { text: '❌ Please specify: .autoreply learning [on|off]' },
                            { quoted: m }
                        );
                    }
                    break;
                    
                case 'ignore':
                    if (isGroup) {
                        const groupId = m.key.remoteJid;
                        if (settings.ignoredGroups.includes(groupId)) {
                            settings.ignoredGroups = settings.ignoredGroups.filter(id => id !== groupId);
                            await sock.sendMessage(
                                sender,
                                { text: '✅ Auto-reply enabled for this group.' },
                                { quoted: m }
                            );
                        } else {
                            settings.ignoredGroups.push(groupId);
                            await sock.sendMessage(
                                sender,
                                { text: '✅ Auto-reply disabled for this group.' },
                                { quoted: m }
                            );
                        }
                        saveSettings(settings);
                    } else {
                        await sock.sendMessage(
                            sender,
                            { text: '❌ This command only works in groups.' },
                            { quoted: m }
                        );
                    }
                    break;
                    
                case 'add':
                    if (args.length < 3) {
                        return sock.sendMessage(
                            sender,
                            { text: '❌ Usage: .autoreply add [pattern] [response]' },
                            { quoted: m }
                        );
                    }
                    
                    const pattern = args[1].toLowerCase();
                    const response = args.slice(2).join(' ');
                    
                    // Add to custom responses
                    if (!settings.responses.custom) {
                        settings.responses.custom = {
                            patterns: [],
                            replies: []
                        };
                    }
                    
                    settings.responses.custom.patterns.push(pattern);
                    settings.responses.custom.replies.push(response);
                    saveSettings(settings);
                    
                    await sock.sendMessage(
                        sender,
                        { text: `✅ Added response for "${pattern}": "${response}"` },
                        { quoted: m }
                    );
                    break;
                    
                case 'list':
                    let listText = '🤖 *Auto-Reply Patterns*\n\n';
                    for (const [category, data] of Object.entries(settings.responses)) {
                        listText += `*${category.toUpperCase()}*\n`;
                        data.patterns.forEach((pattern, index) => {
                            listText += `• ${pattern} → ${data.replies[index]}\n`;
                        });
                        listText += '\n';
                    }
                    
                    await sock.sendMessage(
                        sender,
                        { 
                            text: listText,
                            contextInfo: contextInfo
                        },
                        { quoted: m }
                    );
                    break;
                    
                default:
                    await sock.sendMessage(
                        sender,
                        { text: '❌ Invalid option. Usage: .autoreply [on|off|status|learning|ignore|add|list]' },
                        { quoted: m }
                    );
            }
        } catch (error) {
            console.error('Auto-reply command error:', error);
            await sock.sendMessage(
                sender,
                { 
                    text: '❌ Error processing auto-reply command.',
                    contextInfo: contextInfo
                },
                { quoted: m }
            );
        }
    }
};

// Helper function to find matching response
function findMatchingResponse(text) {
    for (const category of Object.values(settings.responses)) {
        for (const pattern of category.patterns) {
            if (text.includes(pattern)) {
                // Return a random response from this category
                const randomIndex = Math.floor(Math.random() * category.replies.length);
                const response = category.replies[randomIndex];
                return typeof response === 'function' ? response() : response;
            }
        }
    }
    return null;
}

// Helper function to handle learning responses
async function handleLearningResponse(sock, message, originalQuery, response) {
    // Add the new response to custom responses
    if (!settings.responses.custom) {
        settings.responses.custom = {
            patterns: [],
            replies: []
        };
    }
    
    settings.responses.custom.patterns.push(originalQuery);
    settings.responses.custom.replies.push(response);
    saveSettings(settings);
    
    await sock.sendMessage(
        message.key.remoteJid,
        { 
            text: `✅ Thank you! I've learned to respond to "${originalQuery}" with "${response}"`,
            contextInfo: {
                mentionedJid: [message.key.participant || message.key.remoteJid]
            }
        },
        { quoted: message }
    );
}

// Helper function to show status
async function showAutoReplyStatus(sock, sender, m, contextInfo) {
    const status = settings.enabled ? 'ENABLED' : 'DISABLED';
    const learningStatus = settings.learningMode ? 'ENABLED' : 'DISABLED';
    const ignoredGroupsCount = settings.ignoredGroups.length;
    
    const responseCategories = Object.keys(settings.responses).length;
    let totalPatterns = 0;
    for (const category of Object.values(settings.responses)) {
        totalPatterns += category.patterns.length;
    }
    
    const statusMessage = `
🤖 *Auto-Reply System Status*
• System: ${status}
• Learning Mode: ${learningStatus}
• Response Categories: ${responseCategories}
• Total Patterns: ${totalPatterns}
• Ignored Groups: ${ignoredGroupsCount}

Use *.autoreply on* to enable or *.autoreply off* to disable.
    `.trim();
    
    await sock.sendMessage(
        sender,
        { 
            text: statusMessage,
            contextInfo: contextInfo
        },
        { quoted: m }
    );
}
