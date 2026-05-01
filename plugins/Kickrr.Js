// امر الطرد العشوائي لبوت سيلفا
case 'طرد-عشوائي': {
    if (!isGroup) return reply('الأمر ده للجروبات بس يا فارس!');
    if (!isBotAdmin) return reply('لازم ترفع البوت آدمن الأول عشان يطرد!');
    if (!isAdmin) return reply('الأمر ده للمشرفين بس!');

    // جلب قائمة الأعضاء
    const groupMetadata = await sock.groupMetadata(from);
    const participants = groupMetadata.participants;

    // تصفية القائمة لاستبعاد الآدمن والبوت نفسه
    const victims = participants.filter(p => !p.admin && p.id !== sock.user.id);

    if (victims.length === 0) return reply('الجروب كله آدمن يا بطل، مفيش حد أطرده!');

    // اختيار شخص عشوائي (قانون الاحتمالات)
    const randomVictim = victims[Math.floor(Math.random() * victims.length)].id;

    reply(`وقع الاختيار العشوائي على: @${randomVictim.split('@')[0]}.. مع السلامة!`);
    await sock.groupParticipantsUpdate(from, [randomVictim], 'remove');
}
break;
