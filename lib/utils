// lib/utils.js
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const axios = require('axios');
const { fileTypeFromBuffer } = require('file-type');

/**
 * Utility functions for Silva MD Bot
 */
module.exports = {
    /**
     * Generate random hexadecimal string
     * @param {number} length - Length of the string
     * @returns {string} Random hex string
     */
    generateRandomHex: (length = 12) => {
        return crypto.randomBytes(Math.ceil(length / 2))
            .toString('hex')
            .slice(0, length);
    },

    /**
     * Download file from URL with timeout
     * @param {string} url - File URL
     * @param {object} options - { timeout: number, headers: object }
     * @returns {Promise<Buffer>} File buffer
     */
    getBuffer: async (url, options = {}) => {
        try {
            const { data } = await axios.get(url, {
                responseType: 'arraybuffer',
                timeout: options.timeout || 30000,
                headers: options.headers || {}
            });
            return Buffer.from(data);
        } catch (error) {
            throw new Error(`Download failed: ${error.message}`);
        }
    },

    /**
     * Detect file type from buffer
     * @param {Buffer} buffer - File buffer
     * @returns {Promise<object>} { ext, mime } or undefined
     */
    getFileType: async (buffer) => {
        try {
            return await fileTypeFromBuffer(buffer);
        } catch (error) {
            console.error('File type detection error:', error);
            return undefined;
        }
    },

    /**
     * Save buffer to temporary file
     * @param {Buffer} buffer - File data
     * @param {string} ext - File extension
     * @returns {Promise<string>} File path
     */
    saveTempFile: async (buffer, ext = 'tmp') => {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) {
            fs.mkdirSync(tempDir, { recursive: true });
        }

        const filename = `temp_${Date.now()}.${ext}`;
        const filepath = path.join(tempDir, filename);

        try {
            await fs.promises.writeFile(filepath, buffer);
            return filepath;
        } catch (error) {
            throw new Error(`Failed to save temp file: ${error.message}`);
        }
    },

    /**
     * Clean up temporary files older than specified hours
     * @param {number} hours - Hours threshold
     */
    cleanupTempFiles: async (hours = 24) => {
        const tempDir = path.join(__dirname, '../temp');
        if (!fs.existsSync(tempDir)) return;

        const now = Date.now();
        const threshold = hours * 60 * 60 * 1000;

        try {
            const files = await fs.promises.readdir(tempDir);
            for (const file of files) {
                const filepath = path.join(tempDir, file);
                const stats = await fs.promises.stat(filepath);
                if (now - stats.mtimeMs > threshold) {
                    await fs.promises.unlink(filepath);
                }
            }
        } catch (error) {
            console.error('Temp cleanup error:', error);
        }
    },

    /**
     * Format bytes to human-readable string
     * @param {number} bytes - File size in bytes
     * @returns {string} Formatted size
     */
    formatSize: (bytes) => {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },

    /**
     * Validate and parse duration string (HH:MM:SS)
     * @param {string} duration - Duration string
     * @returns {number} Duration in seconds
     */
    parseDuration: (duration) => {
        if (!duration) return 0;
        const parts = duration.split(':').map(part => parseInt(part) || 0);
        
        if (parts.length === 3) { // HH:MM:SS
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) { // MM:SS
            return parts[0] * 60 + parts[1];
        }
        return parts[0]; // SS
    },

    /**
     * Format seconds to HH:MM:SS
     * @param {number} seconds - Duration in seconds
     * @returns {string} Formatted duration
     */
    formatDuration: (seconds) => {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        
        return [h, m, s]
            .map(v => v.toString().padStart(2, '0'))
            .join(':')
            .replace(/^00:/, '');
    },

    /**
     * Delay execution
     * @param {number} ms - Milliseconds to wait
     * @returns {Promise<void>}
     */
    sleep: (ms) => new Promise(resolve => setTimeout(resolve, ms)),

    /**
     * Escape Markdown characters
     * @param {string} text - Input text
     * @returns {string} Escaped text
     */
    escapeMarkdown: (text) => {
        return text.replace(/[_*[\]()~`>#+\-=|{}.!]/g, '\\$&');
    },

    /**
     * Create a message object with standardized format
     * @param {object} options - { text, caption, footer, buttons, etc. }
     * @returns {object} Formatted message object
     */
    createMessageObject: (options) => {
        const message = {
            text: options.text || options.caption || '',
            ...options
        };

        if (options.buttons) {
            message.buttons = options.buttons;
            message.headerType = 1;
        }

        if (options.image || options.video) {
            message[options.image ? 'image' : 'video'] = {
                url: options.image || options.video
            };
            message.caption = options.caption || options.text || '';
        }

        return message;
    }
};
