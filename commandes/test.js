"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const { zokou } = require("../framework/zokou");
zokou({ nomCom: "test", reaction: "😌", nomFichier: __filename }, async (dest, zk, commandeOptions) => {
    console.log("Commande saisie !!!s");
    let z = 'Hello my name is  *𝐒𝚰𝐋𝛁𝚫 𝚻𝚵𝐂𝚮💋* \n\n ' + "i'm a whatsapp bot multi-device";
    let d = ' by *𝐒𝚰𝐋𝛁𝚫 𝚻𝚵𝐂𝚮💋+*';
    let varmess = z + d;
    var img = 'https://telegra.ph/file/3647aeca79bcc25555c99.jpg';
    await zk.sendMessage(dest, { image: { url: img }, caption: varmess });
    //console.log("montest")
});
console.log("mon test");
/*module.exports.commande = () => {
  var nomCom = ["test","t"]
  var reaction="☺️"
  return { nomCom, execute,reaction }
};

async function  execute  (origineMessage,zok) {
  console.log("Commande saisie !!!s")
   let z ='Salut je m\'appelle *𝐒𝚰𝐋𝛁𝚫 𝚻𝚵𝐂𝚮💋* \n\n '+'je suis un bot Whatsapp Multi-appareil '
      let d =' developpé par *𝐒𝚰𝐋𝛁𝚫 𝚻𝚵𝐂𝚮💋*'
      let varmess=z+d
      var img='𝐒𝚰𝐋𝛁𝚫 𝚻𝚵𝐂𝚮💋'
await  zok.sendMessage(origineMessage,  { image:{url:img},caption:varmess});
}  */ 
