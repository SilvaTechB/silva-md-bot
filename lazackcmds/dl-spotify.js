const config = require('../config');
const fetch = require('node-fetch');
const {
    getBuffer,
    getGroupAdmins,
    getRandom,
    getsize,
    h2k,
    isUrl,
    Json,
    runtime,
    sleep,
    fetchJson
} = require('../lib/functions');
const {
    cmd,
    commands
} = require('../command');

let foot = config.FOOTER;

async function dlyta(url) {
    try {
        const maxat = 10;

        for (let attempt = 0; attempt < maxat; attempt++) {
            const gala = await fetch(`https://api-pink-venom.vercel.app/api/ytdl?url=${url}`);
            const mala = await gala.json();

            if (mala.result && mala.result.download_url) {
                return {
                    status: true,
                    dl_link: mala.result.download_url
                };
            }

            await new Promise(resolve => setTimeout(resolve, 4000));
        }
        
        return { status: false, msg: 'Download URL not found' };

    } catch (e) {
        console.error(e);
        return { status: false, msg: e.message };
    }
}

cmd({
    pattern: "song",
    react: "🇰🇪",
    dontAddCommandList: true,
    filename: __filename
},
async (conn, mek, m, { from, q, reply }) => {
    try {
        if (!q) return await reply('*Need a YouTube URL!*');

        const prog = await dlyta(q);
        if (!prog.status) {
            throw new Error(prog.msg);
        }

        await conn.sendMessage(from, { audio: { url: prog.dl_link }, mimetype: 'audio/mpeg' }, { quoted: mek });

    } catch (e) {
        console.log('Attempt failed:', e);

        await reply('*Failed to process the request. Please try again later!*');
    }
});
