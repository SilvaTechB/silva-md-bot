// Channel reaction plugin (reactch)
const handler = {
    help: ['reactch'],
    tags: ['tools'],
    command: /^(reactch)$/i,
    group: false,
    admin: false,
    botAdmin: false,
    owner: false,

    execute: async ({ jid, sock, message, args }) => {
        try {
            if (!args[0] || args.length < 2) {
                return await sock.sendMessage(
                    jid,
                    { 
                        text: '❌ *Wrong format*\n\nExample:\n.reactch https://whatsapp.com/channel/xxxxx 👍 😂 ❤️',
                        contextInfo: {
                            mentionedJid: [message.key.participant || message.key.remoteJid],
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363200367779016@newsletter",
                                newsletterName: "SILVA CHANNEL REACT💖",
                                serverMessageId: 143
                            }
                        }
                    },
                    { quoted: message }
                );
            }

            if (!args[0].includes('https://whatsapp.com/channel/')) {
                return await sock.sendMessage(
                    jid,
                    { 
                        text: '❌ *Invalid WhatsApp Channel link*',
                        contextInfo: {
                            mentionedJid: [message.key.participant || message.key.remoteJid],
                            forwardingScore: 999,
                            isForwarded: true,
                            forwardedNewsletterMessageInfo: {
                                newsletterJid: "120363200367779016@newsletter",
                                newsletterName: "SILVA CHANNEL REACT💖",
                                serverMessageId: 143
                            }
                        }
                    },
                    { quoted: message }
                );
            }

            const result = args[0].split('/')[4];
            const serverId = args[0].split('/')[5];
            const reactions = args.slice(1); // all reactions after the link

            // Fetch channel metadata
            const res = await sock.newsletterMetadata('invite', result);

            // Send each reaction sequentially
            for (let reaction of reactions) {
                await sock.newsletterReactMessage(res.id, serverId, reaction);
            }

            await sock.sendMessage(
                jid,
                {
                    text: `✅ *Reactions sent successfully!*\n\n` +
                          `• Channel: ${res.name}\n` +
                          `• Reactions: ${reactions.join(' ')}`,
                    contextInfo: {
                        mentionedJid: [message.key.participant || message.key.remoteJid],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363200367779016@newsletter",
                            newsletterName: "SILVA CHANNEL REACT💖",
                            serverMessageId: 143
                        }
                    }
                },
                { quoted: message }
            );

        } catch (error) {
            await sock.sendMessage(
                jid,
                { 
                    text: `❌ Error: ${error.message}`,
                    contextInfo: {
                        mentionedJid: [message.key.participant || message.key.remoteJid],
                        forwardingScore: 999,
                        isForwarded: true,
                        forwardedNewsletterMessageInfo: {
                            newsletterJid: "120363200367779016@newsletter",
                            newsletterName: "SILVA CHANNEL REACT💖",
                            serverMessageId: 143
                        }
                    }
                },
                { quoted: message }
            );
        }
    }
};

module.exports = { handler };
