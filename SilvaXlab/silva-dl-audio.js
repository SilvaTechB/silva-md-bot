import fetch from 'node-fetch';

// Function to fetch with retries
const fetchWithRetry = async (url, options, retries = 3, delay = 1000) => {
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, options);
      if (response.ok) {
        return response;
      } else {
        console.log(`Failed to fetch media. Status Code: ${response.status}`);
      }
    } catch (error) {
      console.log(`Error during fetch attempt ${attempt + 1}:`, error);
    }
    console.log(`Retrying... (${attempt + 1})`);
    await new Promise(resolve => setTimeout(resolve, delay));
  }
  throw new Error("Failed to fetch media content after retries");
};

// Handler function for the command
const handler = async (message, { args, conn }) => {
  if (!args.length) {
    await message.reply("Please provide a valid URL.");
    return;
  }

  const url = args.join(" ");
  await message.react('⏳');

  try {
    const apiUrl = `https://api.giftedtech.web.id/api/download/dlmp3?apikey=gifted-md&url=${encodeURIComponent(url)}`;
    const apiResponse = await fetchWithRetry(apiUrl, {
      method: "GET",
      headers: {
        'User-Agent': "Mozilla/5.0",
        'Accept': "application/json, text/plain, */*"
      }
    });
    const apiData = await apiResponse.json();

    if (!apiData.success) {
      throw new Error("Failed to retrieve MP3 details from the API.");
    }

    const mediaDetails = apiData.result;
    const downloadUrl = mediaDetails.download_url;
    const title = mediaDetails.title || "Unknown Title";
    const detailsMessage = `*Media Details*\n\n*Title:* ${title}\n> silva md bot`;

    const mediaResponse = await fetchWithRetry(downloadUrl, {
      headers: {
        'User-Agent': "Mozilla/5.0",
        'Accept': "application/json, text/plain, */*"
      }
    });

    const contentType = mediaResponse.headers.get("content-type");
    if (!contentType || !isAudioContentType(contentType)) {
      throw new Error(`Invalid content type received: ${contentType}`);
    }

    const mediaBuffer = Buffer.from(await mediaResponse.arrayBuffer());
    if (mediaBuffer.length === 0) {
      throw new Error("Downloaded file is empty");
    }

    await conn.sendFile(message.chat, mediaBuffer, `${title}.mp3`, null, message, false, { mimetype: contentType });
    await conn.sendMessage(message.chat, { text: detailsMessage, quoted: message });
    await message.react('✅');
  } catch (error) {
    console.error("Error fetching audio:", error.message, error.stack);
    if (error.message !== "Downloaded file is empty") {
      await message.reply("An error occurred while fetching the audio. Please try again later.");
      await message.react('❌');
    }
  }
};

// Helper function to check for audio content types
const isAudioContentType = (contentType) => {
  const audioTypes = ["audio/mpeg", "audio/mp3", "audio/webm", "audio/ogg", "audio/wav", "audio/midi", "audio/x-midi"];
  return audioTypes.some(type => contentType.includes(type));
};

handler.help = ["audio", "mp3"];
handler.tags = ['dl'];
handler.command = ["audio", "mp3"];

export default handler;
