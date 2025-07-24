// by silva md bot
// This code handles anti-delete functionality for WhatsApp messages, detecting deleted text and media messages in both group and direct messages. It formats the deletion information and sends it back to the chat, either as a text message or by resending the deleted media with a notification. The code also supports configuration for whether to log deletions in a specific path or to the bot's user ID, and it can handle both group and direct message contexts. The deletion information includes the time of deletion, the group name (if applicable), the sender of the original message, and the user who deleted it. The code is designed to be used with a WhatsApp bot framework, such as Baileys, and it utilizes asynchronous functions to handle message processing efficiently. The anti-delete functionality can be toggled on or off based on the bot's configuration settings, allowing for flexibility in how message deletions are handled.
// This code is part of the silva md bot project, which is a WhatsApp bot       
// built using JavaScript and Node.js. The bot is designed to provide various functionalities, including anti-delete features, and can be customized through environment variables and configuration files.
const { isJidGroup } = require('@whiskeysockets/baileys');
const { loadMessage, getAnti } = require('../data');
const config = require('../config');

const DeletedText = async (conn, mek, jid, deleteInfo, isGroup, update) => {
    const messageContent = mek.message?.conversation || mek.message?.extendedTextMessage?.text || 'Unknown content';
    deleteInfo += `\n\n*Content:* ${messageContent}`;

    await conn.sendMessage(
        jid,
        {
            text: deleteInfo,
            contextInfo: {
                mentionedJid: isGroup ? [update.key.participant, mek.key.participant] : [update.key.remoteJid],
            },
        },
        { quoted: mek },
    );
};

const DeletedMedia = async (conn, mek, jid, deleteInfo) => {
    const antideletedmek = structuredClone(mek.message);
    const messageType = Object.keys(antideletedmek)[0];
    if (antideletedmek[messageType]) {
        antideletedmek[messageType].contextInfo = {
            stanzaId: mek.key.id,
            participant: mek.sender,
            quotedMessage: mek.message,
        };
    }
    if (messageType === 'imageMessage' || messageType === 'videoMessage') {
        antideletedmek[messageType].caption = deleteInfo;
    } else if (messageType === 'audioMessage' || messageType === 'documentMessage') {
        await conn.sendMessage(jid, { text: `*🚨 Delete Detected!*\n\n${deleteInfo}` }, { quoted: mek });
    }
    await conn.relayMessage(jid, antideletedmek, {});
};

const AntiDelete = async (conn, updates) => {
    for (const update of updates) {
        if (update.update.message === null) {
            const store = await loadMessage(update.key.id);

            if (store && store.message) {
                const mek = store.message;
                const isGroup = isJidGroup(store.jid);
                const antiDeleteType = isGroup ? 'gc' : 'dm';
                const antiDeleteStatus = await getAnti(antiDeleteType);
                if (!antiDeleteStatus) continue;

                const deleteTime = new Date().toLocaleTimeString('en-GB', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                });

                let deleteInfo, jid;
                if (isGroup) {
                    const groupMetadata = await conn.groupMetadata(store.jid);
                    const groupName = groupMetadata.subject;
                    const sender = mek.key.participant?.split('@')[0];
                    const deleter = update.key.participant?.split('@')[0];

                    deleteInfo = `*AntiDelete Detected*\n\n*Time:* ${deleteTime}\n*Group:* ${groupName}\n*Deleted by:* @${deleter}\n*Sender:* @${sender}`;
                    jid = config.ANTI_DEL_PATH === "log" ? conn.user.id : store.jid;
                } else {
                    const senderNumber = mek.key.remoteJid?.split('@')[0];
                    const deleterNumber = update.key.remoteJid?.split('@')[0];
                    

                    deleteInfo = `*-- AntiDelete Detected --*\n\n*Time:* ${deleteTime}\n*Deleted by:* @${deleterNumber}\n*Sender:* @${senderNumber}`;
                    jid = config.ANTI_DEL_PATH === "log" ? conn.user.id : update.key.remoteJid;
                }

                if (mek.message?.conversation || mek.message?.extendedTextMessage) {
                    await DeletedText(conn, mek, jid, deleteInfo, isGroup, update);
                } else {
                    await DeletedMedia(conn, mek, jid, deleteInfo);
                }
            }
        }
    }
};

module.exports = {
    DeletedText,
    DeletedMedia,
    AntiDelete,
};

