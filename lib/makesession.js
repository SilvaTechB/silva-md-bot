import { fileURLToPath } from 'url';
import path from 'path';
import { writeFileSync } from 'fs';
import * as mega from 'megajs';

async function processTxtAndSaveCredentials(txt) {
  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const credsPath = path.join(__dirname, '..', 'session', 'creds.json');

  try {
    if (!txt.startsWith('Silva~')) {
      throw new Error('Invalid session format. Must start with "Silva~"');
    }

    const sessionData = txt.replace('Silva~', '').trim();

    // If it looks like a MEGA file code (short and alphanumeric), treat it as MEGA
    if (/^[a-zA-Z0-9\-_]{8,}/.test(sessionData) && sessionData.length < 100) {
      const megaUrl = `https://mega.nz/file/${sessionData}`;
      console.log('[Silva-MD] Detected MEGA session, downloading from:', megaUrl);

      const file = mega.File.fromURL(megaUrl);
      const stream = file.download();

      let data = '';
      for await (const chunk of stream) {
        data += chunk.toString();
      }

      writeFileSync(credsPath, data);
      console.log('[Silva-MD] MEGA session saved to:', credsPath);

    } else {
      // Assume it's a Base64 encoded JSON string
      console.log('[Silva-MD] Detected Base64 session. Decoding...');
      const decoded = Buffer.from(sessionData, 'base64').toString('utf-8');
      writeFileSync(credsPath, decoded);
      console.log('[Silva-MD] Base64 session saved to:', credsPath);
    }

  } catch (err) {
    console.error('[Silva-MD] Failed to save session credentials:', err.message);
  }
}

export default processTxtAndSaveCredentials;