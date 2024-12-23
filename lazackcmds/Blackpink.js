import fetch from 'node-fetch';

let handler = async (m, { conn, text }) => {
  // Ensure the user provides input text
  if (!text) throw 'Please provide some text. Example: `!blackpink Your Text`';

  try {
    // Call the Blackpink Style API
    const apiURL = `https://api.giftedtech.my.id/api/ephoto360/blackpinkstyle?apikey=gifted&text=${encodeURIComponent(text)}`;
    const response = await fetch(apiURL);

    if (!response.ok) throw `API error: ${response.statusText}`;
    const result = await response.json();

    // Check if the result contains an image URL
    if (!result || !result.url) throw 'Failed to generate the image. Please try again later.';

    const imgURL = result.url;

    // Send the generated image back to the chat
    await conn.sendFile(m.chat, imgURL, '', `Here is your Blackpink-style text image, created by Silva Tech Inc!`, m, 0, {
      thumbnail: await (await fetch(imgURL)).buffer(),
    });
  } catch (error) {
    console.error(error);
    throw 'An error occurred while generating the image. Please try again later.';
  }
};

handler.help = ['blackpink'];
handler.tags = ['image'];
handler.command = /^(bpink|bp|blackpink)$/i;

export default handler;
