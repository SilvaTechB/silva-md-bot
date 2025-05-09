import fs from 'fs' 
 let handler = async (m, { text, usedPrefix, command }) => { 
     if (!text) throw `uhm.. where is the text?\n\nUsage:\n${usedPrefix + command} <text>\n\nExample:\n${usedPrefix + command} plugins/xei-sensei.js` 
     if (!m.quoted.text) throw `reply to the message!` 
     let path = `${text}` 
     await fs.writeFileSync(path, m.quoted.text) 
     m.reply(`stored in ${path}`) 
 } 
 handler.help = ['sf'].map(v => v + ' <texts>') 
 handler.tags = ['owner'] 
 handler.command = /^sf|savefile|addplugin$/i 
  
 handler.rowner = true 
 export default handler
