import { fileURLToPath } from 'url';
import path from 'path';
import { writeFileSync } from 'fs';
import * as mega from 'megajs';
import fetch from 'node-fetch';

async function processTxtAndSaveCredentials(txt) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);

  const input = txt.replace('Silva~', '').trim();
  let credsData = null;

  try {
    if (input.includes('mega.nz')) {
      // 🔗 Handle Mega.nz link
      const file = mega.File.fromURL(input);
      const stream = file.download();
      let data = '';
      for await (const chunk of stream) {
        data += chunk.toString();
      }
      credsData = data;
    } else if (input.includes('drive.google.com')) {
      // 📁 Handle Google Drive link
      const match = input.match(/\/d\/([a-zA-Z0-9_-]+)/);
      if (!match) throw new Error('Invalid Google Drive link');

      const fileId = match[1];
      const url = `https://drive.google.com/uc?export=download&id=${fileId}`;
      const res = await fetch(url);
      if (!res.ok) throw new Error('Failed to fetch file from Google Drive');

      credsData = await res.text();
    } else if (input.endsWith('.json')) {
      // 📦 Handle direct creds.json content or raw URL
      const res = await fetch(input);
      if (!res.ok) throw new Error('Failed to fetch JSON credentials');
      credsData = await res.text();
    } else {
      throw new Error('Unsupported session input');
    }

    const credsPath = path.join(__dirname, '..', 'session', 'creds.json');
    writeFileSync(credsPath, credsData);
    console.log('✅ Saved credentials to', credsPath);
  } catch (error) {
    console.error('❌ Error downloading or saving credentials:', error.message);
  }
}

export default processTxtAndSaveCredentials;
