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

        // Send the joke as a card
        if (joke) {
            const templateMessage = {
                text: 'Here\'s a developer joke for you:',
                footer: 'Enjoy the humor and keep coding!',
                templateButtons: [
                    { index: 1, urlButton: { displayText: 'Source', url: 'https://readme-jokes.vercel.app/' } },
                    { index: 2, quickReplyButton: { displayText: 'Another Joke', id: '.devjoke' } }
                ]
            };

            conn.sendMessage(m.chat, templateMessage, { quoted: m });
        } else {
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
