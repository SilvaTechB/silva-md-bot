import fetch from 'node-fetch';

let handler = async (m, { text, conn, usedPrefix, command }) => {
  try {
    // Get the input text, either from the message itself or a quoted reply
    if (!text && !(m.quoted && m.quoted.text)) {
      throw 'Please provide a number.';
    }
    if (!text && m.quoted && m.quoted.text) {
      text = m.quoted.text;
    }

    // React with a "waiting" emoji and set typing indicator
    m.react('⏳');
    conn.sendPresenceUpdate('composing', m.chat);

    // Encode the input number for the URL
    const encodedNumber = encodeURIComponent(text);
    
    // First API endpoint
    const apiUrl1 = `https://creds-session.onrender.com/pair?number=${encodedNumber}`;

    // Try the first API
    let response = await fetch(apiUrl1);
    let data = await response.json();

    // Check if the response is valid
    let result = data?.code; // Adjusted to check for "code" instead of "response.response"

    if (result) {
      // Send the result if found
      await conn.sendButton(
        m.chat,
        result,
        'Author',
        'https://files.catbox.moe/8324jm.jpg',
        [['Script', `.sc`]],
        null,
        [['Follow Me', `https://github.com/SilvaTechB`]],
        m
      );
      m.react('✅'); // React with "done" emoji
      return;
    }

    throw new Error('No valid code from the first API');
  } catch (error1) {
    console.error('Error from the first API:', error1);

    // Second API endpoint (backup if first API fails)
    try {
      const prompt = encodeURIComponent(text);
      const apiUrl2 = `https://ultimetron.guruapi.tech/gpt3?prompt=${prompt}`;
      
      let response = await fetch(apiUrl2);
      let data = await response.json();
      let result = data?.completion;

      if (result) {
        // Send the result from the second API if found
        await conn.sendButton(
          m.chat,
          result,
          'Author',
          'https://files.catbox.moe/8324jm.jpg',
          [['Silva Power', `.repo`]],
          null,
          [['Follow Me', `https://github.com/SilvaTechB`]],
          m
        );
        m.react('✅'); // React with "done" emoji
        return;
      }
      
      throw new Error('No valid response from the second API');
    } catch (error2) {
      console.error('Error from the second API:', error2);
      throw '*ERROR*';
    }
  }
};

// Command handler details
handler.help = ['pair'];
handler.tags = ['AI'];
handler.command = ['code', 'rent', 'qr', 'number'];

export default handler;