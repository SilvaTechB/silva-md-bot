/**
 * Silva MD Bot Script for Developer Jokes
 * Fetches a random developer joke from the API and sends it as a card.
 */

const axios = require('axios');
const cheerio = require('cheerio'); // To parse HTML

let handler = async (m, { conn }) => {
    try {
        // Fetch a random developer joke from the API
        const response = await axios.get('https://readme-jokes.vercel.app/api');
        const html = response.data;

        // Parse the HTML to extract the joke
        const $ = cheerio.load(html);
        const joke = $('body').text().trim(); // Extract the text from the body

        if (joke) {
            // Send the joke as a card using a template message
            const templateMessage = {
                text: joke, // Display the joke
                footer: 'Enjoy the humor and keep coding!',
                templateButtons: [
                    {
                        index: 1,
                        urlButton: {
                            displayText: 'Get More Jokes',
                            url: 'https://readme-jokes.vercel.app/'
                        }
                    },
                    {
                        index: 2,
                        quickReplyButton: {
                            displayText: 'Another Joke',
                            id: '.devjoke'
                        }
                    }
                ]
            };

            await conn.sendMessage(m.chat, templateMessage, { quoted: m });
        } else {
            // Fallback message if the joke cannot be fetched
            conn.sendMessage(m.chat, { text: 'Sorry, I couldn\'t fetch a joke at the moment. Please try again later!' }, { quoted: m });
        }
    } catch (error) {
        console.error('Error fetching joke:', error);
        conn.sendMessage(m.chat, { text: 'Oops! Something went wrong while fetching a joke. Please try again later.' }, { quoted: m });
    }
};

handler.help = ['devjoke'];
handler.tags = ['fun'];
handler.command = ['devjoke'];

module.exports = handler;
