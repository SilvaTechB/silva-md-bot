import fetch from 'node-fetch';

let handler = async (message, { conn, args, text, usedPrefix, command }) => {
  let errorMessage =
    "✳️ " +
    mssg.notext +
    "\n\n📌 " +
    mssg.example +
    ": *" +
    (usedPrefix + command) +
    "* SILVA MD BOT";
  message.react(rwait);

  let apiUrl;
  switch (command) {
    case "papercut":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/papercut?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "logomaker":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/logomaker?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "cartoon":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/cartoonstyle?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "writetext":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/writetext?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "glossy":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/glossysilver?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "bpstyle":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/blackpinkstyle?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "pixelglitch":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/pixelglitch?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "advancedglow":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/advancedglow?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "lighteffect":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/lighteffect?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "texteffect":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/texteffect?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "galaxy":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/galaxy?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "beach":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/summerbeach?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    case "clouds":
      if (!text) throw errorMessage;
      apiUrl =
        "https://api.giftedtech.web.id/api/ephoto360/effectclouds?apikey=gifted-md&text=" +
        encodeURIComponent(text);
      break;
    default:
      throw "Command not recognized.";
  }

  try {
    const response = await fetch(apiUrl);
    const result = await response.json();
    if (result.success && result.result && result.result.image_url) {
      conn.sendFile(
        message.chat,
        result.result.image_url,
        "logo.png",
        "*𝙿𝙾𝚆𝙴𝚁𝙴𝙳 𝙱𝚈 © SILVA MD BOT*",
        message
      );
      message.react(done);
    } else {
      throw "Failed to generate the image. Please try again later.";
    }
  } catch (error) {
    console.error("Error fetching image:", error);
    message.reply(
      "An error occurred while fetching the image. Please try again later."
    );
  }
};

handler.help = [
  "papercut",
  "logomaker",
  "bpstyle",
  "writetext",
  "glossy",
  "cartoon",
  "pixelglitch",
  "advancedglow",
  "lighteffect",
  "texteffect",
  "galaxy",
  "beach",
  "clouds",
];
handler.tags = ["maker"];
handler.command = /^(papercut|logomaker|bpstyle|pixelglitch|advancedglow|lighteffect|texteffect|galaxy|writetext|glossy|cartoon|beach|clouds)$/i;

export default handler;
