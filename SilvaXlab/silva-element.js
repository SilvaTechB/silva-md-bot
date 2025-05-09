import fetch from 'node-fetch';

const elementHandler = async (m, { conn, text }) => {
  if (!text) {
    await conn.reply(m.chat, 'Please provide an element symbol or name.', m);
    return;
  }

  try {
    const response = await fetch(`https://api.popcat.xyz/periodic-table?element=${encodeURIComponent(text)}`);

    if (!response.ok) {
      throw new Error(`API request failed with status ${response.status}`);
    }

    const data = await response.json();

    // Check if the API returned valid data
    if (!data.name) {
      await conn.reply(m.chat, `Did you attend chemistry classes? What is "${text}"? 😂`, m);
      return;
    }

    // Check for "chemical look-alike" elements (e.g., typos or similar names)
    const userInput = text.toLowerCase();
    const elementName = data.name.toLowerCase();
    const elementSymbol = data.symbol.toLowerCase();

    if (userInput !== elementName && userInput !== elementSymbol) {
      await conn.reply(m.chat, `Did you mean *${data.name}* (${data.symbol})? 😉`, m);
      return;
    }

    // Format the element information
    const elementInfo = `
*Silva Element Information:*
• *Name:* ${data.name}
• *Symbol:* ${data.symbol}
• *Atomic Number:* ${data.atomic_number}
• *Atomic Mass:* ${data.atomic_mass}
• *Period:* ${data.period}
• *Phase:* ${data.phase}
• *Discovered By:* ${data.discovered_by}
• *Summary:* ${data.summary}
    `.trim();

    // Send the element image and information
    await conn.sendFile(m.chat, data.image, 'element.jpg', elementInfo, m);
  } catch (error) {
    console.error('Error fetching element data:', error);
    await conn.reply(m.chat, 'An error occurred while fetching the element data. Please try again later.', m);
  }
};

elementHandler.help = ['element'];
elementHandler.tags = ['tools'];
elementHandler.command = /^(element|ele)$/i;

export default elementHandler;
