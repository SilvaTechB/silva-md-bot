const { GoogleGenerativeAI } = require("@google/generative-ai");
const axios = require("axios");

module.exports = async ({ client, m, text, mime, uploadtoimgur }) => {
  try {
    // Validate if the message is quoted and contains the necessary instruction and mime type.
    if (!m.quoted) {
      return m.reply("Please send an image and tag it with the instruction.");
    }
    if (!text) {
      return m.reply("Please provide some instruction. This vision AI is powered by Gemini-Pro Vision.");
    }
    if (!/image/.test(mime)) {
      return m.reply("The file you sent is not an image. Please send an actual image.");
    }

    // Download the quoted image and upload it to Imgur.
    const imagePath = await client.downloadAndSaveMediaMessage(m.quoted);
    const imgurUrl = await uploadtoimgur(imagePath);
    m.reply("Please wait, Keith is analyzing the contents of the image...");

    // Initialize Google Generative AI.
    const generativeAI = new GoogleGenerativeAI("AIzaSyCcZqDMBa8FcAdBxqE1o6YYvzlygmpBx14");

    // Function to convert image to base64 format
    async function convertImageToBase64(imageUrl, mimeType) {
      const response = await axios.get(imageUrl, { responseType: "arraybuffer" });
      const base64Image = Buffer.from(response.data).toString("base64");
      return {
        inlineData: {
          data: base64Image,
          mimeType: mimeType
        }
      };
    }

    // Prepare the request to the Generative AI model
    const modelOptions = { model: "gemini-1.5-flash" };
    const generativeModel = generativeAI.getGenerativeModel(modelOptions);

    // Convert the image to base64 and prepare the request payload
    const imageBase64 = await convertImageToBase64(imgurUrl, "image/jpeg");
    const contentRequest = [text, imageBase64];

    // Generate content based on the provided instruction and image.
    const response = await generativeModel.generateContent(contentRequest);
    const resultText = await response.text();

    // Reply with the generated content.
    m.reply(resultText);

  } catch (error) {
    m.reply(`I am unable to analyze the image at the moment. Error: ${error.message}`);
  }
};
