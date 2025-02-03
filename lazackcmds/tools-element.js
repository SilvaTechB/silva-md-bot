import fetch from 'node-fetch';

const guru1 = (prompt) => `https://api.gurusensei.workers.dev/llama?prompt=${encodeURIComponent(prompt)}`;

let elementHandler = async (m, { conn, text }) => {
  if (!text) throw 'Please provide an element symbol or name.';

  try {
    // Fetch element data from the API
    let res = await fetch(`https://api.popcat.xyz/periodic-table?element=${text}`);

    if (!res.ok) {
      // If the element is not found, ask the guru1 API for an explanation
      let prompt = `Is "${text}" a chemical element or something related to chemistry? Explain in simple terms.`;
      let guruResponse = await fetch(guru1(prompt));
      let guruData = await guruResponse.json();

      if (guruData.response) {
        await conn.reply(m.chat, `Did you attend chemistry classes? What is "${text}"?\n\nHere's an explanation:\n${guruData.response}`, m);
      } else {
        await conn.reply(m.chat, `Did you attend chemistry classes? What is "${text}"?`, m);
      }
      return;
    }

    // Parse the element data
    let json = await res.json();

    // Format the element information
    let elementInfo = `*Silva md Element Information:*\n
     • *Name:* ${json.name}\n
     • *Symbol:* ${json.symbol}\n
     • *Atomic Number:* ${json.atomic_number}\n
     • *Atomic Mass:* ${json.atomic_mass}\n
     • *Period:* ${json.period}\n
     • *Phase:* ${json.phase}\n
     • *Discovered By:* ${json.discovered_by}\n
     • *Summary:* ${json.summary}`;

    // Send the element image and information
    await conn.sendFile(m.chat, json.image, 'element.jpg', elementInfo, m);
  } catch (error) {
    console.error(error);
    await conn.reply(m.chat, `An error occurred: ${error.message}`, m);
  }
};

elementHandler.help = ['element'];
elementHandler.tags = ['tools'];
elementHandler.command = /^(element|ele)$/i;

export default elementHandler;
