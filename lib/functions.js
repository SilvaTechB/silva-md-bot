import axios from 'axios';

/**
 * Fetch buffer from URL
 * @param {string} url
 * @param {object} options
 * @returns {Promise<Buffer>}
 */
export const getBuffer = async (url, options = {}) => {
    try {
        const response = await axios({
            method: 'GET',
            url,
            headers: {
                DNT: 1,
                'Upgrade-Insecure-Request': 1
            },
            responseType: 'arraybuffer',
            ...options
        });
        return response.data;
    } catch (error) {
        console.error('getBuffer Error:', error);
        return null;
    }
};

/**
 * Get group admins
 * @param {Array} participants
 * @returns {Array}
 */
export const getGroupAdmins = participants => {
    return participants
        .filter(member => member.admin !== null)
        .map(member => member.id);
};

/**
 * Generate random string with suffix
 * @param {string} ext
 * @returns {string}
 */
export const getRandom = ext => `${Math.floor(Math.random() * 10000)}${ext}`;

/**
 * Convert number to human-readable format
 * @param {number} num
 * @returns {string}
 */
export const h2k = num => {
    const units = ['', 'K', 'M', 'B', 'T'];
    const unit = Math.floor((Math.log10(Math.abs(num)) / 3) | 0);
    if (unit === 0) return num.toString();
    const value = (num / Math.pow(10, unit * 3)).toFixed(1);
    return value.replace(/\.0$/, '') + units[unit];
};

/**
 * Validate if string is URL
 * @param {string} text
 * @returns {boolean}
 */
export const isUrl = text => {
    const pattern = /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/gi;
    return pattern.test(text);
};

/**
 * Convert object to formatted JSON
 * @param {object} obj
 * @returns {string}
 */
export const Json = obj => JSON.stringify(obj, null, 2);

/**
 * Convert seconds to human-readable runtime
 * @param {number} seconds
 * @returns {string}
 */
export const runtime = seconds => {
    seconds = Number(seconds);
    const d = Math.floor(seconds / 86400);
    const h = Math.floor((seconds % 86400) / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return `${d ? `${d} day${d > 1 ? 's' : ''}, ` : ''}${h ? `${h} hour${h > 1 ? 's' : ''}, ` : ''}${m ? `${m} minute${m > 1 ? 's' : ''}, ` : ''}${s} second${s > 1 ? 's' : ''}`;
};

/**
 * Sleep function
 * @param {number} ms
 * @returns {Promise}
 */
export const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Fetch JSON from URL
 * @param {string} url
 * @param {object} options
 * @returns {Promise<object>}
 */
export const fetchJson = async (url, options = {}) => {
    try {
        const response = await axios({
            method: 'GET',
            url,
            headers: {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36'
            },
            ...options
        });
        return response.data;
    } catch (error) {
        console.error('fetchJson Error:', error);
        return null;
    }
};
