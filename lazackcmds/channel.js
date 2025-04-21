let channelJid = "120363200367779016@newsletter"; // Your channel ID
let channelLink = "https://www.whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v"; // Optional link for logs

module.exports = {
  name: "channel-auto-react",
  async before(conn) {
    // ✅ Auto-subscribe to the channel once when bot starts
    conn.ev.once("connection.update", async (update) => {
      if (update.connection === "open") {
        try {
          await conn.ws.sendNode({
            tag: "iq",
            attrs: {
              to: channelJid,
              type: "set",
              xmlns: "w:newsletter"
            },
            content: [
              {
                tag: "subscribe",
                attrs: {
                  id: channelJid
                },
                content: []
              }
            ]
          });
          console.log(`✅ Auto-followed channel: ${channelLink}`);
        } catch (err) {
          console.error("❌ Failed to follow channel:", err);
        }
      }
    });

    // 💖 Auto-react to all messages posted in the channel
    conn.ev.on("messages.upsert", async ({ messages, type }) => {
      if (type !== "notify") return;

      for (const msg of messages) {
        if (!msg.key || !msg.message) continue;
        const from = msg.key.remoteJid;

        if (from === channelJid) {
          try {
            await conn.sendMessage(from, {
              react: {
                text: "💖",
                key: msg.key
              }
            });
            console.log("💖 Reacted to a channel message.");
          } catch (err) {
            console.error("❌ Failed to react to message:", err);
          }
        }
      }
    });
  }
};
