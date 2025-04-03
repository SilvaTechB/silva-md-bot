import { config } from "dotenv";
config();

let handler = async (m, { conn }) => {
    if (!process.env.ANTICALL || process.env.ANTICALL.toLowerCase() !== "true") return;

    let chat = global.db.data.chats[m.chat] || {};
    if (m.messageStubType === "CALL") {
        let warning = process.env.ANTICALL_WARNING || "Calling me is not allowed! You will be blocked.";
        let callerId = m.sender;

        // Send warning message
        await conn.sendMessage(m.chat, { text: `@${callerId.split("@")[0]}, ${warning}`, mentions: [callerId] });

        // Block the caller
        await conn.updateBlockStatus(callerId, "block");
        console.log(`Blocked ${callerId} for calling.`);
    }
};

handler.help = ["anticall"];
handler.tags = ["security"];
handler.command = ["anticall"];
handler.anticall = true;

export default handler;
