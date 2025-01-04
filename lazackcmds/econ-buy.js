
const precioDiamante = 200 
let handler = async (m, { conn, usedPrefix, command, args }) => {

  let user = global.db.data.users[m.sender]
 
  if (!args[0]) throw `📌 ${mssg.example}: *${usedPrefix + command}* all\n*${usedPrefix + command}* 8`;
  if (args[0].toLowerCase() !== 'all' && !/^[1-9]\d*$/.test(args[0])) throw `✳️ ${mssg.isNan}`;

  let all =  Math.floor(user.coin / precioDiamante)
 let count = args[0].replace('all', all)
 count = Math.max(1, count)
  //if (isNaN(count)) throw `✳️ ${mssg.isNan}`;

  
  let totalCost = precioDiamante * count;

  if (user.coin >= totalCost) {
    user.coin -= totalCost;
    user.diamond += count;

    m.reply(`
┌─「 *${mssg.voucher.toUpperCase()}* 」
‣ *${mssg.buy}:* ${mssg.dmd}
‣ *${mssg.buyCount}:* ${count.toLocaleString()} 💎 
‣ *${mssg.spent}:* -${totalCost.toLocaleString()} 🪙
└──────────────`);
  } else {
    m.reply(`❎ ${mssg.buyNan('Coins')} *${count}* 💎`);
  }

}
handler.help = ['buy']
handler.tags = ['econ']
handler.command = ['buy'] 

handler.disabled = false

export default handler