const fs = require('fs');
const path = require('path');
const axios = require('axios');
const crypto = require('crypto');

class Functions {
    constructor() {
        this.tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(this.tempDir)) {
            fs.mkdirSync(this.tempDir, { recursive: true });
        }
    }

    // Generate random string
    randomString(length = 10) {
        return crypto.randomBytes(length).toString('hex').slice(0, length);
    }

    // Format bytes to readable size
    formatBytes(bytes, decimals = 2) {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const dm = decimals < 0 ? 0 : decimals;
        const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
    }

    // Format time
    formatTime(ms) {
        const seconds = Math.floor(ms / 1000);
        const minutes = Math.floor(seconds / 60);
        const hours = Math.floor(minutes / 60);
        
        if (hours > 0) return `${hours}h ${minutes % 60}m`;
        if (minutes > 0) return `${minutes}m ${seconds % 60}s`;
        return `${seconds}s`;
    }

    // Download file from URL
    async downloadFile(url, filename = null) {
        try {
            const response = await axios({
                url,
                method: 'GET',
                responseType: 'stream'
            });

            if (!filename) {
                filename = path.basename(url.split('?')[0]) || `file_${Date.now()}`;
            }

            const filePath = path.join(this.tempDir, filename);
            const writer = fs.createWriteStream(filePath);

            response.data.pipe(writer);

            return new Promise((resolve, reject) => {
                writer.on('finish', () => resolve(filePath));
                writer.on('error', reject);
            });
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    }

    // Check if user is admin in group
    async isAdmin(message, sock) {
        if (!message.key.remoteJid.endsWith('@g.us')) return false;
        
        try {
            const metadata = await sock.groupMetadata(message.key.remoteJid);
            const participant = message.key.participant || message.key.remoteJid;
            const adminList = metadata.participants.filter(p => p.admin).map(p => p.id);
            
            return adminList.includes(participant);
        } catch {
            return false;
        }
    }

    // Check if user is owner
    isOwner(sender) {
        const config = require('../config.js');
        return sender === config.OWNER_NUMBER;
    }

    // Extract URL from text
    extractURL(text) {
        const urlRegex = /(https?:\/\/[^\s]+)/g;
        return text.match(urlRegex) || [];
    }

    // Get file extension from buffer
    getFileExtension(buffer) {
        const signatures = {
            '89504E47': 'png',
            'FFD8FF': 'jpg',
            '47494638': 'gif',
            '52494646': 'webp',
            '57454250': 'webp',
            '66747970': 'mp4',
            '00000020': 'mp4',
            '4F676753': 'ogg',
            '494433': 'mp3',
            'FFFB': 'mp3'
        };

        const hex = buffer.toString('hex', 0, 8).toUpperCase();
        for (const [signature, ext] of Object.entries(signatures)) {
            if (hex.startsWith(signature)) {
                return ext;
            }
        }
        return 'bin';
    }

    // Clean temporary files
    cleanTemp() {
        try {
            const files = fs.readdirSync(this.tempDir);
            const now = Date.now();
            const maxAge = 30 * 60 * 1000; // 30 minutes

            files.forEach(file => {
                const filePath = path.join(this.tempDir, file);
                const stats = fs.statSync(filePath);
                
                if (now - stats.mtimeMs > maxAge) {
                    fs.unlinkSync(filePath);
                }
            });
        } catch (error) {
            // Ignore cleanup errors
        }
    }

    // Sleep function
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Validate WhatsApp number
    validateNumber(number) {
        const cleaned = number.replace(/[^0-9]/g, '');
        if (cleaned.length < 10) return null;
        
        // Add country code if missing
        if (!cleaned.startsWith('1') && !cleaned.startsWith('62')) {
            // Default to US (+1) if not specified
            return '1' + cleaned.slice(-10) + '@s.whatsapp.net';
        }
        
        return cleaned + '@s.whatsapp.net';
    }

    // Parse command arguments
    parseArgs(text) {
        const args = [];
        let current = '';
        let inQuotes = false;
        
        for (let i = 0; i < text.length; i++) {
            const char = text[i];
            
            if (char === '"' || char === "'") {
                inQuotes = !inQuotes;
            } else if (char === ' ' && !inQuotes) {
                if (current) {
                    args.push(current);
                    current = '';
                }
            } else {
                current += char;
            }
        }
        
        if (current) {
            args.push(current);
        }
        
        return args;
    }

    // Generate progress bar
    progressBar(percentage, length = 20) {
        const filled = Math.round((percentage / 100) * length);
        const empty = length - filled;
        return `[${'█'.repeat(filled)}${'░'.repeat(empty)}] ${percentage.toFixed(1)}%`;
    }
}

module.exports = new Functions();
