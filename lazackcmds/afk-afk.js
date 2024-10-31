export function before(m) {
  let user = global.db.data.users[m.sender];

  // Checking if the user is no longer AFK
  if (user.afk > -1) {
    const afkDuration = (new Date() - user.afk);  // AFK duration in milliseconds
    const afkDurationString = new Date(afkDuration).toISOString().substr(11, 8); // Format to hh:mm:ss

    m.reply(`
  ✅ You stopped being AFK 
${user.afkReason ? ' \n▢ *Reason :* ' + user.afkReason : ''}
▢ *AFK Duration :* ${afkDurationString}
  `.trim());

    user.afk = -1; // Reset AFK status
    user.afkReason = '';
  }

  // Handling mentioned users
  let jids = [...new Set([...(m.mentionedJid || []), ...(m.quoted ? [m.quoted.sender] : [])])];
  for (let mentionedJid of jids) {
    let mentionedUser = global.db.data.users[mentionedJid]; // Use a different variable to avoid overwriting
    if (!mentionedUser) continue;

    let afkTime = mentionedUser.afk;
    if (!afkTime || afkTime < 0) continue;

    const afkDuration = (new Date() - afkTime); // AFK duration in milliseconds
    const afkDurationString = new Date(afkDuration).toISOString().substr(11, 8); // Format to hh:mm:ss

    let reason = mentionedUser.afkReason || '';
    m.reply(`
💤 The human you mentioned is AFK

${reason ? '▢ *Reason* : ' + reason : '▢ *Reason* : Without reason'}
▢ *AFK Duration :* ${afkDurationString}
  `.trim());
  }

  return true;
}
