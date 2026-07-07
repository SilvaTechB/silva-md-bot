'use strict';

const ENCODE = {
    a:'.-',b:'-...',c:'-.-.',d:'-..',e:'.',f:'..-.',g:'--.',h:'....',i:'..',
    j:'.---',k:'-.-',l:'.-..',m:'--',n:'-.',o:'---',p:'.--.',q:'--.-',r:'.-.',
    s:'...',t:'-',u:'..-',v:'...-',w:'.--',x:'-..-',y:'-.--',z:'--..',
    '0':'-----','1':'.----','2':'..---','3':'...--','4':'....-','5':'.....',
    '6':'-....','7':'--...','8':'---..','9':'----.','.':'.-.-.-',',':'--..--',
    '?':'..--..','!':'-.-.--',' ':'/'
};
const DECODE = Object.fromEntries(Object.entries(ENCODE).map(([k,v]) => [v,k]));
const encode = t => t.toLowerCase().split('').map(c => ENCODE[c] || '').filter(Boolean).join(' ');
const decode = m => m.split(' ').map(s => DECODE[s] || '?').join('');

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
                text: `❌ *Usage:*\n• \`.morse encode Hello World\`\n• \`.morse decode .... . .-.. .-.. ---\``,
                contextInfo
            }, { quoted: message });
        }
        const input = args.slice(1).join(' ');
        const isEnc = mode === 'encode' || mode === 'enc';
        const result = isEnc ? encode(input) : decode(input);
        await sock.sendMessage(jid, {
            text: isEnc
                ? `📡 *Morse Encoder*\n\n📝 *Text:* ${input}\n\n📻 *Morse:* \`${result}\``
                : `📡 *Morse Decoder*\n\n📻 *Morse:* \`${input}\`\n\n📝 *Text:* ${result.toUpperCase()}`,
            contextInfo
        }, { quoted: message });
    }
};
