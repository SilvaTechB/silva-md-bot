'use strict';

function toBinary(str) { return str.split('').map(c => c.charCodeAt(0).toString(2).padStart(8, '0')).join(' '); }
function fromBinary(str) { return str.split(' ').map(b => String.fromCharCode(parseInt(b, 2))).join(''); }
function toHex(str) { return Buffer.from(str).toString('hex'); }
function fromHex(str) { return Buffer.from(str, 'hex').toString('utf8'); }
function rot13(str) { return str.replace(/[a-zA-Z]/g, c => String.fromCharCode(c.charCodeAt(0) + (c.toLowerCase() < 'n' ? 13 : -13))); }

module.exports = {
    commands:    ['encode', 'decode', 'binary', 'hex2text', 'rot13'],
    description: 'Encode/decode text: base64, hex, binary, rot13',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { sender, prefix, contextInfo }) => {
        const cmd  = message.body?.split(' ')[0]?.replace(prefix, '').toLowerCase();
        const text = args.join(' ');
        if (!text) {
            return sock.sendMessage(sender, {
                text: `🔄 *Encoder/Decoder*\n\n.encode <text>    → Base64\n.decode <b64>    → Text from Base64\n.binary <text>   → Binary\n.hex2text <hex>  → Text from Hex\n.rot13 <text>    → ROT13\n.encode hex:<text> → Hex\n.encode rev:<text> → Reverse`,
                contextInfo
            }, { quoted: message });
        }
        let result = '';
        let label  = '';
        try {
            if (cmd === 'encode') {
                if (text.startsWith('hex:')) { result = toHex(text.slice(4)); label = 'Hex'; }
                else if (text.startsWith('rev:')) { result = text.slice(4).split('').reverse().join(''); label = 'Reversed'; }
                else { result = Buffer.from(text).toString('base64'); label = 'Base64'; }
            } else if (cmd === 'decode') {
                result = Buffer.from(text, 'base64').toString('utf8'); label = 'Decoded (Base64)';
            } else if (cmd === 'binary') {
                result = toBinary(text); label = 'Binary';
            } else if (cmd === 'hex2text') {
                result = fromHex(text); label = 'Text from Hex';
            } else if (cmd === 'rot13') {
                result = rot13(text); label = 'ROT13';
            }
            await sock.sendMessage(sender, {
                text: `🔄 *${label}*\n\n📝 Input: \`${text.slice(0, 100)}\`\n\n📤 Output:\n${result}`,
                contextInfo
            }, { quoted: message });
        } catch (e) {
            await sock.sendMessage(sender, { text: `❌ Encode/decode failed: ${e.message}`, contextInfo }, { quoted: message });
        }
    }
};
