import axios from 'axios';

// Function to fetch data with retries

const fetchWithRetries = async (url, retries = 3, delay = 2000) => {

  let attempt = 0;

  while (attempt < retries) {

    try {

      const { data } = await axios.get(url);

      return data; // Return the data if the request is successful

    } catch (error) {

      attempt++;

      console.error(`Attempt ${attempt} failed: ${error.message}`);

      if (attempt < retries) {

        console.log(`Retrying in ${delay / 1000} seconds...`);

        await new Promise(resolve => setTimeout(resolve, delay)); // Delay before retry

      } else {

        throw new Error('Max retries reached. Please try again later.');

      }

    }

  }

};

let handler = async (m, { text, usedPrefix, command, conn }) => {

  try {

    // Attempt to fetch a random "Why" question with retries

    const data = await fetchWithRetries('https://nekos.life/api/v2/why');

    

    // Log the API response for debugging (optional)

    console.log('API Response:', data);

    // Check if the response contains a valid "Why" question

    if (data && data.why && data.why.trim() !== '') {

      // Send the valid "Why" question as a response

      const responseText = `*Tell Me:* \n\n\`\`\`${data.why}\`\`\``;

      await conn.sendMessage(m.chat, { text: responseText }, { quoted: m });

    } else {

      // Fallback if no valid response is returned

      await conn.sendMessage(m.chat, { text: '❌ The API returned an empty or invalid response. Please try again later.' }, { quoted: m });

    }

  } catch (e) {

    console.error(e);

    await conn.sendMessage(m.chat, { text: `❌ Something went wrong: ${e.message}` }, { quoted: m });

  }

};

handler.help = ['why'];

handler.tags = ['fun'];

handler.command = /^(why)$/i;

export default handler;
