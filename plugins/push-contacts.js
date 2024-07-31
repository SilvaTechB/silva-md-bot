let handler = async (m, {
    conn,
    groupMetadata,
    usedPrefix,
    text,
    command
}) => {
if (!text && !m.quoted) return m.reply("Where is Infos")
    let get = await groupMetadata.participants.filter(v => v.id.endsWith('.net')).map(v => v.id)
    let count = get.length;
    let sentCount = 0;
    m.reply(wait);
    for (let i = 0; i < get.length; i++) {
        setTimeout(function() {
            if (text) {
                conn.sendMessage(get[i], {
                    text: text
                });
            } else if (m.quoted) {
                conn.copyNForward(get[i], m.getQuotedObj(), false);
            } else if (text && m.quoted) {
                conn.sendMessage(get[i], {
                    text: text + "\n" + m.quoted.text + "\n\nAdvertise by 𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓"
                });
            }
            count--;
            sentCount++;
            if (count === 0) {
m.reply(`Succesfuly Sended the notification to all the group members ✅.

👨‍🎓 *Operator:* ${author}
🤖 *Sender:* ${botname}
✅ *Total:* ${sentCount} users Notified`);
            }
        }, i * 5000); // delay each transmission for 5 second
    }
}

handler.help = ['pushcontact', 'ads', 'promote']
handler.tags = ['owner']
handler.command = /^(pushcontact|ads|promote)$/i
handler.owner = true
handler.group = true

export default handler
