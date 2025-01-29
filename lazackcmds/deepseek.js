import puppeteer from 'puppeteer';

let handler = async (m, { text, conn }) => {
  if (!text && !(m.quoted && m.quoted.text)) {
    throw `Please provide some text or quote a message to get a response.`;
  }
  if (!text && m.quoted && m.quoted.text) {
    text = m.quoted.text;
  }

  try {
    m.react('⌛');
    conn.sendPresenceUpdate('composing', m.chat);

    const browser = await puppeteer.launch({ headless: true });
    const page = await browser.newPage();
    await page.goto('https://chat.deepseek.com', { waitUntil: 'networkidle2' });

    // Wait for the input field and type the user's message
    await page.waitForSelector('textarea');
    await page.type('textarea', text);
    await page.keyboard.press('Enter');

    // Wait for response
    await page.waitForSelector('.message-bubble', { timeout: 10000 });
    
    // Extract the response
    const response = await page.evaluate(() => {
      let messages = document.querySelectorAll('.message-bubble');
      return messages[messages.length - 1].innerText;
    });
    
    await browser.close();

    await conn.sendMessage(
      m.chat,
      { text: `${response}\n\n*~ Silva MD Bot*` },
      { quoted: m }
    );
    m.react('✅');
  } catch (error) {
    console.error('Error:', error);
    throw `*ERROR*: ${error.message}`;
  }
};

handler.help = ['chatgpt'];
handler.tags = ['AI'];
handler.command = ['deep', 'seek', 'deepseek', 'ans'];

export default handler;
