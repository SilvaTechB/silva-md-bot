import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
  if (!text) {
    return m.reply("Enter the name of the app to search for on the Play Store.");
  }

  try {
    // Add "wait" reaction to indicate the request is processing
    await m.react('📩');
    
    // Fetch data from the Play Store API
    const response = await fetch(`https://global-tech-api.vercel.app/playstore?query=${text}`);
    
    // Log the API response to the console for debugging
    const data = await response.json();
    console.log("Play Store API Response:", data);

    // Check if the API returned results
    if (!data || data.length === 0) {
      // React with "done" emoji in case no results
      await m.react('📩');
      return m.reply("No apps were found on the Play Store for the application you were looking for.");
    }

    let caption = `Play Store search results for *${text}*:\n\n`;

    // Loop through the results and format the response
    data.forEach((result, index) => {
      if (result.name && result.link && result.developer && result.rating_Num) {
        caption += `
${index + 1}. *Title:* ${result.name}
*Developer:* ${result.developer}
*Rating:* ${result.rating_Num} stars
*Download Link:* ${result.link}
*Developer Page:* ${result.link_dev || 'Not available'}
\n`;
      }
    });

    // React with "done" emoji after the process is complete
    await m.react('📩');
    
    // Send the formatted message with app details
    await conn.sendMessage(m.chat, { text: caption }, { quoted: m });
  } catch (error) {
    console.error("Error in Play Store search:", error);
    m.reply("An error occurred while searching for apps on the Play Store.");
  }
};

handler.help = ['playstore'];
handler.tags = ['search'];
handler.command = /^(apk)$/i;
handler.group = false;

export default handler;
