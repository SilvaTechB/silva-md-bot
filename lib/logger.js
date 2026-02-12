const fs = require('fs');
const path = require('path');

class SilvaLogger {
    constructor() {
        this.logDir = path.join(__dirname, '../logs');
        if (!fs.existsSync(this.logDir)) {
            fs.mkdirSync(this.logDir, { recursive: true });
        }
    }

    log(type, message) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${type.toUpperCase()}] ${timestamp} - ${message}\n`;
        
        // Console output
        const colors = {
            INFO: '\x1b[36m',
            ERROR: '\x1b[31m',
            SUCCESS: '\x1b[32m',
            WARNING: '\x1b[33m',
            BOT: '\x1b[35m',
            RESET: '\x1b[0m'
        };
        
        console.log(`${colors[type] || colors.INFO}${logMessage}${colors.RESET}`);
        
        // File logging
        const logFile = path.join(this.logDir, `${new Date().toISOString().split('T')[0]}.log`);
        fs.appendFileSync(logFile, logMessage);
    }
}

module.exports = new SilvaLogger();
