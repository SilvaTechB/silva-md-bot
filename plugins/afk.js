const fs = require('fs');
const path = require('path');

class AFKPlugin {
    constructor(bot, options = {}) {
        this.bot = bot;
        this.afkUsers = new Map();
        this.options = {
            responseMessage: "🌙 {{user}} is currently AFK: {{reason}} (for {{duration}})",
            returnMessage: "🌸 Welcome back, {{user}}! You were away for {{duration}}",
            dataFile: path.join(__dirname, 'afk-data.json'),
            ...options
        };
        
        this.loadData();
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // Listen for messages to check AFK status
        this.bot.on('message', async (message) => {
            if (!message.body) return;
            
            // Check if the sender was AFK and has returned
            if (this.afkUsers.has(message.from)) {
                await this.handleReturnFromAFK(message);
            }
            
            // Check if the message mentions someone who is AFK
            await this.handleAFKMention(message);
            
            // Check for AFK commands
            await this.handleAFKCommands(message);
        });
    }
    
    async handleAFKCommands(message) {
        const body = message.body.toLowerCase().trim();
        
        // Set AFK status
        if (body.startsWith('!afk')) {
            const reason = message.body.substring(5).trim() || 'Away';
            const userName = message.sender?.pushname || 'User';
            await this.setAFK(message.from, reason, userName);
            await message.reply(`🌿 You're now AFK: ${reason}`);
            return;
        }
        
        // Show AFK list
        if (body === '!afklist') {
            await this.showAFKList(message);
            return;
        }
        
        // Manual return from AFK
        if (body === '!back') {
            await this.handleManualReturn(message);
            return;
        }
    }
    
    async setAFK(userId, reason, userName) {
        const afkData = {
            since: Date.now(),
            reason: reason,
            userName: userName
        };
        
        this.afkUsers.set(userId, afkData);
        this.saveData();
    }
    
    removeAFK(userId) {
        if (this.afkUsers.has(userId)) {
            const afkData = this.afkUsers.get(userId);
            this.afkUsers.delete(userId);
            this.saveData();
            
            // Calculate duration for return message
            const duration = this.formatDuration(Date.now() - afkData.since);
            return { userName: afkData.userName, duration };
        }
        return null;
    }
    
    async handleReturnFromAFK(message) {
        // Don't respond to commands as a return trigger
        const body = message.body.toLowerCase().trim();
        if (body.startsWith('!')) return;
        
        const returnData = this.removeAFK(message.from);
        
        if (returnData) {
            const returnMsg = this.options.returnMessage
                .replace('{{user}}', returnData.userName)
                .replace('{{duration}}', returnData.duration);
            
            await message.reply(returnMsg);
        }
    }
    
    async handleManualReturn(message) {
        const returnData = this.removeAFK(message.from);
        
        if (returnData) {
            const returnMsg = this.options.returnMessage
                .replace('{{user}}', returnData.userName)
                .replace('{{duration}}', returnData.duration);
            
            await message.reply(returnMsg);
        } else {
            await message.reply("You weren't AFK.");
        }
    }
    
    async handleAFKMention(message) {
        if (!message.mentionedJid) return;
        
        for (const jid of message.mentionedJid) {
            if (this.afkUsers.has(jid)) {
                const afkData = this.afkUsers.get(jid);
                const duration = this.formatDuration(Date.now() - afkData.since);
                
                const response = this.options.responseMessage
                    .replace('{{user}}', afkData.userName)
                    .replace('{{reason}}', afkData.reason)
                    .replace('{{duration}}', duration);
                
                await message.reply(response);
                break;
            }
        }
    }
    
    async showAFKList(message) {
        if (this.afkUsers.size === 0) {
            await message.reply("🌼 No one is AFK right now");
            return;
        }
        
        let listMessage = "🌿 AFK Users:\n\n";
        let index = 1;
        
        for (const [userId, afkData] of this.afkUsers) {
            const duration = this.formatDuration(Date.now() - afkData.since);
            listMessage += `${index}. @${userId.split('@')[0]} - ${afkData.reason} (${duration})\n`;
            index++;
        }
        
        await message.reply(listMessage);
    }
    
    formatDuration(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        const days = Math.floor(hours / 24);
        
        if (days > 0) {
            return `${days}d ${hours % 24}h`;
        } else if (hours > 0) {
            return `${hours}h ${minutes % 60}m`;
        } else if (minutes > 0) {
            return `${minutes}m ${seconds % 60}s`;
        } else {
            return `${seconds}s`;
        }
    }
    
    loadData() {
        try {
            if (fs.existsSync(this.options.dataFile)) {
                const data = JSON.parse(fs.readFileSync(this.options.dataFile, 'utf8'));
                this.afkUsers = new Map(data.afkUsers);
            }
        } catch (error) {
            console.error('Error loading AFK data:', error);
        }
    }
    
    saveData() {
        try {
            const data = {
                afkUsers: Array.from(this.afkUsers.entries()),
                updatedAt: new Date().toISOString()
            };
            
            fs.writeFileSync(this.options.dataFile, JSON.stringify(data, null, 2));
        } catch (error) {
            console.error('Error saving AFK data:', error);
        }
    }
}

module.exports = AFKPlugin;
