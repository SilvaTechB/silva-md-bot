import fetch from 'node-fetch';

let handler = async (m, { conn, args, text, usedPrefix, command }) => {
   let tee = `👀 ${mssg.notext}\n\n📌 ${mssg.example}: *${usedPrefix + command}* SILVA MD`
   m.react('🧠')

   let apiUrl;
   switch (command) {
      case 'mascot':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/mascot?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;
         
      case 'foggy':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/foggy?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'golden':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/golden?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'wgalaxy':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/wgalaxy?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'metallic':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/mettalic?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;
         
      case 'gradient':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/gradient?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'snake':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/snake?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case '3dsilver':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/3dsilver?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'jewel':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/jewel?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'metal':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/metal?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'galaxy':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/galaxy?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'blackpink':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/blackpink?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'sand':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/sand?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'cubic':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/cubic?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'nigeria':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/nigeria?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'gaming':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/gaming?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'gold':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/gold?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'splat':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/paintsplat?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'color':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/colorful?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'matrix':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/matrix?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'wings':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/angelwing?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'papercut':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/papercut?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'gsilver':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/gsilver?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'hacker':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/hacker?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'balon':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/ballon?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'galaxy2':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/galaxy2?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'typo':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/typography?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'circle':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/circlemascot?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      case 'star':
         if (!text) throw tee;
         apiUrl = `https://gtech-api-xtp1.onrender.com/api/ephoto/star?apikey=APIKEY&text=${encodeURIComponent(text)}`;
         break;

      default:
         throw 'Command not recognized.';
   }

   // Fetch the image URL from the API
   try {
      const response = await fetch(apiUrl);
      const data = await response.json();

      if (data.status && data.result && data.result.imageUrl) {
         // Send the image to the user with the correct file extension
         const imageUrl = data.result.imageUrl;
         const fileExtension = imageUrl.split('.').pop(); // Extract the file extension
         conn.sendFile(m.chat, imageUrl, `logo.${fileExtension}`, `*SILVA MD BOT*`, m);
         m.react('💖');
      } else {
         throw '😭😭😭I Failed to generate the image. Please try again later.';
      }
   } catch (error) {
      console.error('Error fetching image:', error);
      m.reply('An error occurred while fetching the image. Please try again later.');
   }
}
   
// Updated help and command properties
handler.help = [
   'mascot', 'foggy', 'golden', 'wgalaxy', 'metallic', 'gradient', 'snake', '3dsilver', 'jewel', 
   'metal', 'galaxy', 'blackpink', 'sand', 'cubic', 'nigeria', 'gaming', 'gold', 'splat', 'color', 
   'matrix', 'wings', 'papercut', 'gsilver', 'hacker', 'balon', 'galaxy2', 'typo', 'circle', 'star'
];
handler.tags = ['maker'];
handler.command = /^(mascot|foggy|golden|wgalaxy|metallic|gradient|snake|3dsilver|jewel|metal|galaxy|blackpink|sand|cubic|nigeria|gaming|gold|splat|color|matrix|wings|papercut|gsilver|hacker|balon|galaxy2|typo|circle|star)$/i;

export default handler;
            
