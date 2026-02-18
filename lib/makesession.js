import fs from 'fs';
import zlib from 'zlib';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const sessionDir = path.join(__dirname, '..', 'session');
const credsPath = path.join(sessionDir, 'creds.json');

function createDirIfNotExist(dir) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

createDirIfNotExist(sessionDir);

async function loadSession(sessionId) {
  try {
    if (fs.existsSync(credsPath)) {
      try {
        const existing = JSON.parse(fs.readFileSync(credsPath, 'utf8'));
        if (existing.registered && existing.me && existing.account) {
          console.log("✅ ᴇxɪꜱᴛɪɴɢ ꜱᴇꜱꜱɪᴏɴ ɪꜱ ᴠᴀʟɪᴅ — ᴋᴇᴇᴘɪɴɢ ɪᴛ");
          return;
        }
      } catch (e) {
      }
      fs.unlinkSync(credsPath);
      console.log("♻️ ᴏʟᴅ ꜱᴇꜱꜱɪᴏɴ ʀᴇᴍᴏᴠᴇᴅ");
    }

    if (!sessionId || typeof sessionId !== 'string') {
      throw new Error("❌ SESSION_ID is missing or invalid");
    }

    const [header, b64data] = sessionId.split('~');

    if (header !== "Silva" || !b64data) {
      throw new Error("❌ Invalid session format. Expected 'Silva~.....'");
    }

    const compressedData = Buffer.from(b64data, 'base64');
    const decompressedData = zlib.gunzipSync(compressedData);

    createDirIfNotExist(sessionDir);

    fs.writeFileSync(credsPath, decompressedData, "utf8");
    console.log("✅ ɴᴇᴡ ꜱᴇꜱꜱɪᴏɴ ʟᴏᴀᴅᴇᴅ ꜱᴜᴄᴄᴇꜱꜱꜰᴜʟʟʏ");

  } catch (e) {
    console.error("❌ Session Error:", e.message);
    throw e;
  }
}

export { loadSession };
export default loadSession;
