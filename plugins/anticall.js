const fs = require('fs');
const path = require('path');

// Settings file path
const SETTINGS_PATH = path.join(__dirname, '../anti-call-settings.json');

// Default settings
const defaultSettings = {
    rejectCalls: true,
    blockCaller: false,
    notifyAdmin: true,
    autoReply: "🚫 I don't accept calls. Please send a text message instead.",
    blockedUsers: [],
    adminNumber: '254700143167@s.whatsapp.net' // Replace with your admin number
};

// Load settings
function loadSettings() {
    try {
        if (fs.existsSync(SETTINGS_PATH)) {
            return JSON.parse(fs.readFileSync(SETTINGS_PATH, 'utf8'));
        }
    } catch (error) {
        console.error('Error loading anti-call settings:', error);
    }
    return defaultSettings;
}

// Save settings
function saveSettings(settings) {
    try {
        fs.writeFileSync(SETTINGS_PATH, JSON.stringify(settings, null, 2));
    } catch (error) {
        console.error('Error saving anti-call settings:', error);
    }
}

// Initialize settings
const settings = loadSettings();

module.exports = {
    name: 'anticall',
    commands: ['anticall'],
    tags: ['tools'],
    description: 'Manage anti-call settings for the bot',
    
    // Initialize the plugin
    init: (sock) => {
        console.log('Anti-call plugin initialized');
        
        // Listen for incoming calls
        sock.ev.on('call', async (callDataArray) => {
            try {
                // callDataArray is an array of call events
                for (const callData of callDataArray) {
                    const { id, from, status, isVideo } = callData;
                    
                    // Only handle incoming call offers
                    if (status !== 'offer') continue;
                    
                    const caller = from;
                    const callType = isVideo ? 'video' : 'voice';
                    
                    console.log(`Incoming ${callType} call from: ${caller}`);
                    
                    // Check if user is blocked
                    if (settings.blockedUsers.includes(caller)) {
                        console.log(`Blocked user ${caller} attempted a call, rejecting automatically.`);
                        await sock.rejectCall(id, from);
                        return;
                    }
                    
                    // Reject the call if enabled
                    if (settings.rejectCalls) {
                        try {
                            await sock.rejectCall(id, from);
                            console.log(`Call from ${caller} rejected successfully.`);
                            
                            // Send auto-reply message
                            if (settings.autoReply) {
                                await sock.sendMessage(
                                    caller,
                                    { 
                                        text: settings.autoReply,
                                        contextInfo: {
                                            externalAdReply: {
                                                title: "Call Rejected",
                                                body: "This bot doesn't accept calls",
                                                thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                                mediaType: 1
                                            }
                                        }
                                    }
                                );
                            }
                        } catch (error) {
                            console.error('Error rejecting call:', error);
                        }
                    }
                    
                    // Block the caller if enabled
                    if (settings.blockCaller) {
                        if (!settings.blockedUsers.includes(caller)) {
                            settings.blockedUsers.push(caller);
                            saveSettings(settings);
                            console.log(`User ${caller} has been blocked from calling.`);
                        }
                    }
                    
                    // Notify admin if enabled
                    if (settings.notifyAdmin) {
                        try {
                            const message = `📞 *Anti-Call Alert*\n\nCaller: ${caller}\nType: ${callType} call\nStatus: Automatically rejected`;
                            await sock.sendMessage(
                                settings.adminNumber, 
                                { 
                                    text: message,
                                    contextInfo: {
                                        externalAdReply: {
                                            title: "Call Blocked",
                                            body: "Silva MD Anti-Call Protection",
                                            thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                                            mediaType: 1
                                        }
                                    }
                                }
                            );
                        } catch (error) {
                            console.error('Error notifying admin:', error);
                        }
                    }
                }
            } catch (error) {
                console.error('Error handling call:', error);
            }
        });
    },
    
    handler: async ({ sock, m, sender, args, contextInfo, isGroup }) => {
        try {
            const action = args[0]?.toLowerCase();
            const userNumber = sender.split('@')[0];
            
            // Check if user is admin (you can customize this logic)
            const isAdmin = userNumber === '254700143167'; // Replace with your admin number
            
            if (!isAdmin) {
                return sock.sendMessage(
                    sender,
                    { 
                        text: '❌ You are not authorized to use this command.',
                        contextInfo: contextInfo
                    },
                    { quoted: m }
                );
            }
            
            if (!action) {
                return await showStatus(sock, sender, m, contextInfo);
            }
            
            switch (action) {
                case 'on':
                    settings.rejectCalls = true;
                    saveSettings(settings);
                    await sock.sendMessage(
                        sender,
                        { text: '✅ Anti-call protection enabled.' },
                        { quoted: m }
                    );
                    break;
                    
                case 'off':
                    settings.rejectCalls = false;
                    saveSettings(settings);
                    await sock.sendMessage(
                        sender,
                        { text: '✅ Anti-call protection disabled.' },
                        { quoted: m }
                    );
                    break;
                    
                case 'status':
                    await showStatus(sock, sender, m, contextInfo);
                    break;
                    
                case 'block':
                    if (args[1]) {
                        const numberToBlock = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                        if (!settings.blockedUsers.includes(numberToBlock)) {
                            settings.blockedUsers.push(numberToBlock);
                            saveSettings(settings);
                            await sock.sendMessage(
                                sender,
                                { text: `✅ User ${args[1]} has been blocked from calling.` },
                                { quoted: m }
                            );
                        } else {
                            await sock.sendMessage(
                                sender,
                                { text: `ℹ️ User ${args[1]} is already blocked.` },
                                { quoted: m }
                            );
                        }
                    } else {
                        await sock.sendMessage(
                            sender,
                            { text: '❌ Please specify a user to block. Usage: .anticall block [number]' },
                            { quoted: m }
                        );
                    }
                    break;
                    
                case 'unblock':
                    if (args[1]) {
                        const numberToUnblock = args[1].replace(/[^0-9]/g, '') + '@s.whatsapp.net';
                        if (settings.blockedUsers.includes(numberToUnblock)) {
                            settings.blockedUsers = settings.blockedUsers.filter(u => u !== numberToUnblock);
                            saveSettings(settings);
                            await sock.sendMessage(
                                sender,
                                { text: `✅ User ${args[1]} has been unblocked.` },
                                { quoted: m }
                            );
                        } else {
                            await sock.sendMessage(
                                sender,
                                { text: `ℹ️ User ${args[1]} is not blocked.` },
                                { quoted: m }
                            );
                        }
                    } else {
                        await sock.sendMessage(
                            sender,
                            { text: '❌ Please specify a user to unblock. Usage: .anticall unblock [number]' },
                            { quoted: m }
                        );
                    }
                    break;
                    
                default:
                    await sock.sendMessage(
                        sender,
                        { text: '❌ Invalid option. Usage: .anticall [on|off|status|block|unblock]' },
                        { quoted: m }
                    );
            }
        } catch (error) {
            console.error('Anti-call command error:', error);
            await sock.sendMessage(
                sender,
                { 
                    text: '❌ Error processing anti-call command.',
                    contextInfo: contextInfo
                },
                { quoted: m }
            );
        }
    }
};

// Helper function to show status
async function showStatus(sock, sender, m, contextInfo) {
    const status = settings.rejectCalls ? 'ENABLED' : 'DISABLED';
    const blockedCount = settings.blockedUsers.length;
    
    const statusMessage = `
🤖 *Anti-Call Plugin Status*
• Protection: ${status}
• Blocked users: ${blockedCount}
• Auto-reply: ${settings.autoReply ? 'ON' : 'OFF'}
• Admin notifications: ${settings.notifyAdmin ? 'ON' : 'OFF'}

Use *.anticall on* to enable or *.anticall off* to disable.
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
