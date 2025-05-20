//import db from '../lib/database.js'

let handler = async (m, { conn, usedPrefix, command, args, isOwner, isAdmin, isROwner }) => {
  const chat = global.db.data.chats[m.chat];
  const user = global.db.data.users[m.sender];
  const bot = global.db.data.settings[conn.user.jid] || {};
  
  let type = (args[0] || '').toLowerCase();
  let isEnable = /true|enable|on|1/i.test(command);
  let isAll = false, isUser = false;

  const features = {
    welcome: { scope: 'group', emoji: '👋', desc: 'Send welcome messages' },
    jarvis: { scope: 'group', emoji: '🤖', desc: 'Auto respond AI (Jarvis)' },
    autotalk: { scope: 'group', emoji: '🗣️', desc: 'AI Auto Chat mode' },
    pmblocker: { scope: 'all', emoji: '🚫', desc: 'Block DMs automatically' },
    autobio: { scope: 'all', emoji: '✍️', desc: 'Auto update bot bio' },
    detect: { scope: 'group', emoji: '🕵️', desc: 'Detect new joins/leaves' },
    autosticker: { scope: 'group', emoji: '🎭', desc: 'Auto sticker from image' },
    antispam: { scope: 'group', emoji: '📵', desc: 'Block spam messages' },
    delete: { scope: 'group', emoji: '❌', desc: 'Prevent deleted msg loss' },
    antitoxic: { scope: 'group', emoji: '🚯', desc: 'Block toxic words' },
    document: { scope: 'group', emoji: '📄', desc: 'Send media as doc' },
    autostatus: { scope: 'all', emoji: '📰', desc: 'View story auto' },
    antilink: { scope: 'group', emoji: '🔗', desc: 'Block group links' },
    nsfw: { scope: 'group', emoji: '🔞', desc: 'NSFW access' },
    autolevelup: { scope: 'user', emoji: '📈', desc: 'Auto level up' },
    chatbot: { scope: 'group', emoji: '💬', desc: 'Enable chatbot' },
    restrict: { scope: 'all', emoji: '⚠️', desc: 'Restrict commands' },
    autotype: { scope: 'all', emoji: '🟢', desc: 'Always online mode' },
    anticall: { scope: 'all', emoji: '📵', desc: 'Block incoming calls' },
    onlypv: { scope: 'all', emoji: '🧍‍♂️', desc: 'Bot only works in DM' },
    gponly: { scope: 'all', emoji: '👥', desc: 'Bot only in groups' },
    self: { scope: 'all', emoji: '🛠️', desc: 'Self mode only' }
  };

  if (!features[type]) {
    let sections = Object.entries(features).map(([key, val]) => `${val.emoji} *${key}* – _${val.desc}_`).join('\n');
    return conn.sendMessage(m.chat, {
      text: `*⚙️ Feature Toggle List:*\n\n${sections}\n\n📌 Use: *${usedPrefix}on welcome* or *${usedPrefix}off nsfw*`,
      footer: 'Silva MD Config Panel',
      buttons: Object.keys(features).slice(0, 5).map(k => ({
        buttonId: `${usedPrefix}on ${k}`,
        buttonText: { displayText: `ON ${features[k].emoji} ${k}` },
        type: 1
      })),
      headerType: 1
    }, { quoted: m });
  }

  let access = features[type].scope;
  if (access === 'group' && !m.isGroup) return m.reply('❌ Group-only command!');
  if (access === 'group' && !(isAdmin || isOwner)) return global.dfail('admin', m, conn);
  if (access === 'user') isUser = true;
  if (access === 'all' && !isROwner) return global.dfail('rowner', m, conn);

  switch (type) {
    case 'welcome': chat.welcome = isEnable; break;
    case 'jarvis':
    case 'autotalk': chat.jarvis = isEnable; break;
    case 'pmblocker': bot.pmblocker = isEnable; isAll = true; break;
    case 'autobio': bot.autoBio = isEnable; isAll = true; break;
    case 'detect': chat.detect = isEnable; break;
    case 'autosticker': chat.autosticker = isEnable; break;
    case 'antispam': chat.antiSpam = isEnable; break;
    case 'delete': chat.delete = !isEnable; break;
    case 'antitoxic': chat.antiToxic = isEnable; break;
    case 'document': chat.useDocument = isEnable; break;
    case 'autostatus': chat.viewStory = isEnable; isAll = true; break;
    case 'antilink': chat.antiLink = isEnable; break;
    case 'nsfw': chat.nsfw = isEnable; break;
    case 'autolevelup': user.autolevelup = isEnable; break;
    case 'chatbot': chat.chatbot = isEnable; break;
    case 'restrict': bot.restrict = isEnable; isAll = true; break;
    case 'autotype': chat.autotype = isEnable; isAll = true; break;
    case 'anticall': bot.antiCall = isEnable; isAll = true; break;
    case 'onlypv': global.opts['pconly'] = isEnable; isAll = true; break;
    case 'gponly': global.opts['gconly'] = isEnable; isAll = true; break;
    case 'self': global.opts['self'] = isEnable; isAll = true; break;
  }

  return conn.sendMessage(m.chat, {
    location: { degreesLatitude: 0, degreesLongitude: 0 },
    caption: `*${features[type].emoji} ${type.toUpperCase()}* is now *${isEnable ? 'ENABLED' : 'DISABLED'}* ${isAll ? 'for the bot' : isUser ? 'for your profile' : 'in this group'}`,
    footer: 'Silva MD Bot Config',
    buttons: [
      {
        buttonId: `${usedPrefix}on ${type}`,
        buttonText: { displayText: `✅ ON ${features[type].emoji}` },
        type: 1
      },
      {
        buttonId: `${usedPrefix}off ${type}`,
        buttonText: { displayText: `❌ OFF ${features[type].emoji}` },
        type: 1
      }
    ],
    headerType: 6,
    viewOnce: true
  }, { quoted: m });
};

handler.help = ['enable', 'disable'].map(v => v + ' <feature>');
handler.tags = ['config'];
handler.command = /^((en|dis)able|(turn)?o(n|ff)|[01])$/i;

export default handler;