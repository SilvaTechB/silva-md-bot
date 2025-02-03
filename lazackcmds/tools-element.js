import fetch from 'node-fetch';

const guru1 = (prompt) => `https://api.gurusensei.workers.dev/llama?prompt=${prompt}`;

let elementHandler = async (m, { conn, text }) => {
  if (!text) throw 'Please provide an element symbol or name.';

  try {
    let res = await fetch(`https://api.popcat.xyz/periodic-table?element=${text}`);

    if (!res.ok) {
      // If the element is not found, check if it's a chemical look-alike
      let guruResponse = await fetch(guru1(`Is "${text}" a chemical element or look-alike? Explain.`));
      let guruData = await guruResponse.json();

      if (guruData.response && guruData.response.includes("not a valid element")) {
        throw new Error(`Did you attend chemistry classes? What is "${text}"?`);
      } else {
        await conn.reply(m.chat, `Hmm, "${text}" isn't a valid element, but here's some info:\n${guruData.response}`, m);
        return;
      }
    }

    let json = await res.json();

    let elementInfo = `*Element Information:*\n
     • *Name:* ${json.name}\n
     • *Symbol:* ${json.symbol}\n
     • *Atomic Number:* ${json.atomic_number}\n
     • *Atomic Mass:* ${json.atomic_mass}\n
     • *Period:* ${json.period}\n
     • *Phase:* ${json.phase}\n
     • *Discovered By:* ${json.discovered_by}\n
     • *Summary:* ${json.summary}`;

    await conn.sendFile(m.chat, json.image, 'element.jpg', elementInfo, m);
  } catch (error) {
    console.error(error);
    await conn.reply(m.chat, error.message, m); // Send the error message to the user
  }
};

elementHandler.help = ['element'];
elementHandler.tags = ['tools'];
elementHandler.command = /^(element|ele)$/i;

export default elementHandler;
