// utils/safeSend.js
const delay = ms => new Promise(res => setTimeout(res, ms));

async function safeSend(sock, jid, msg, retries = 3) {
    for (let i = 0; i < retries; i++) {
        try {
            await sock.presenceSubscribe(jid);
            await delay(300); // let session establish
            await sock.sendMessage(jid, msg);
            return true;
        } catch (err) {
            if (!err.message.includes('No sessions')) throw err;
            console.error(`⚠️ No session for ${jid}, retry ${i+1}/${retries}`);
            await delay(500);
        }
    }
    return false;
}

module.exports = { safeSend };
