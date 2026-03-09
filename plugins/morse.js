'use strict';

const ENCODE = {
    a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',
    j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',
    s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
    '6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--',
    '?':'..--..','!':'-.-.--'," ":"/"
};
const DECODE = Object.fromEntries(Object.entries(ENCODE).map(([k,v]) => [v,k]));

function encode(text) {
    return text.toLowerCase().split('').map(c => ENCODE[c] || '').filter(Boolean).join(' ');
}
function decode(morse) {
    return morse.split(' ').map(s => DECODE[s] || '?').join('');
}

module.exports = {
    commands:    ['morse', 'morseencode', 'morsedecode'],
    description: 'Encode or decode Morse code',
    usage:       '.morse encode Hello  •  .morse decode .... . .-.. .-.. ---',
    permission:  'public',
    group:       true,
    private:     true,

    run: async (sock, message, args, ctx) => {
        const { contextInfo } = ctx;
        const jid  = message.key.remoteJid;
        const mode = (args[0] || '').toLowerCase();

        if (!['encode','decode','enc','dec'].includes(mode) || args.length < 2) {
            return sock.sendMessage(jid, {
                text:
                    `❌ *Usage:*\n` +
                    `• \`.morse encode Hello World\`\n` +
                    `• \`.morse decode .... . .-.. .-.. --- / .-- --- .-. .-.. -..\``,
                contextInfo
            }, { quoted: message });
        }

        const input = args.slice(1).join(' ');
        if (mode === 'encode' || mode === 'enc') {
            const result = encode(input);
            await sock.sendMessage(jid, {
                text:
                    `📡 *Morse Code Encoder*\n\n` +
                    `📝 *Text:* ${input}\n\n` +
                    `📻 *Morse:* \`${result}\``,
                contextInfo
            }, { quoted: message });
        } else {
            const result = decode(input);
            await sock.sendMessage(jid, {
                text:
                    `📡 *Morse Code Decoder*\n\n` +
                    `📻 *Morse:* \`${input}\`\n\n` +
                    `📝 *Text:* ${result.toUpperCase()}`,
                contextInfo
            }, { quoted: message });
        }
    }
};
