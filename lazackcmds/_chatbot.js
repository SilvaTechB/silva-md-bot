import fetch from "node-fetch";  // node-fetch for making API requests

export async function before(message, { conn }) {
  console.log("Chatbot feature is active.");
  
  try {
    console.log("Received message object:", JSON.stringify(message, null, 2));
    
    // Skip messages sent by the bot or system messages
    if (message.isBaileys || message.fromMe) {
      console.log("Message from bot itself or Baileys, skipping.");
      return true;
    }

    const irrelevantTypes = ["protocolMessage", "pollUpdateMessage", "reactionMessage", "stickerMessage"];
    
    // Skip irrelevant message types
    if (irrelevantTypes.includes(message.mtype)) {
      console.log("Irrelevant message type, skipping.");
      return true;
    }

    // Skip if there's no text content
    if (!message.text) {
      console.log("No text in the message.");
      return true;
    }

    // Fetch the chatbot settings for this chat
    const chatSettings = global.db.data.chats[message.chat] || {};
    const chatbotEnabled = chatSettings.chatbot || false;
    
    // Define the owner's number
    const ownerNumber = global.owner[0];

    // Only process if chatbot is enabled or the message is from the owner
    if (chatbotEnabled || message.sender === ownerNumber) {
      console.log("Processing message from user or owner.");
      const encodedMessage = encodeURIComponent(message.text);
      console.log("Message to process:", encodedMessage);

      // Function to send the message to GPT-3
      const getGPT3Response = async (userMessage) => {
        try {
          // The initial system prompt for GPT-3
          const systemPrompt = {
            role: "system",
            content: `You are SILVA CHATBOT, an intelligent and feature-rich assistant developed by Silva, a skilled frontend developer from Kenya. Enhance your responses with relevant and expressive emojis when appropriate to make them engaging and relatable, while maintaining clarity and professionalism. Provide detailed, accurate, and well-researched answers to any question asked, ensuring that your responses are complete, reliable, and helpful. Offer guidance and support regarding the Silva MD Bot project, which is hosted at https://github.com/SilvaTechB/silva-md-bot and https://github.com/SilvaTechB/silva-spark-md. Always prioritize accuracy, completeness, and user engagement in your responses. Remember, your owner's WhatsApp contacts are +254700143167, +254743706010, and +254755257907.`  // shortened for brevity
          };

          const userPrompt = {
            role: "user",
            content: userMessage
          };

          const conversation = [systemPrompt, userPrompt];
          
          const response = await fetch("https://api.yanzbotz.live/api/ai/gpt3", {
            method: "POST",
            headers: {
              "Accept": "application/json",
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ messages: conversation })
          });

          if (!response.ok) {
            throw new Error("API call failed.");
          }

          const gpt3Response = await response.json();
          console.log("GPT-3 response:", gpt3Response);
          return gpt3Response.result;

        } catch (error) {
          console.error("Error during GPT-3 API request:", error.message);
          return "I'm sorry, I couldn't process your request.";
        }
      };

      // Get the GPT-3 response and reply
      const gpt3Response = await getGPT3Response(message.text);
      if (gpt3Response) {
        await message.reply(gpt3Response);
        console.log("Replied with:", gpt3Response);
      } else {
        await message.reply("No suitable response from the API.");
        console.log("No suitable response from the API.");
      }
    } else {
      console.log("Chatbot is not enabled for this chat, skipping.");
    }

  } catch (error) {
    console.error("Error processing message:", error.message);
    await message.reply("An error occurred while processing your message.");
  }

  return true;
}
