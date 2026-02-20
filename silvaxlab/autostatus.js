export async function before(m, { isAdmin, isBotAdmin }) {
  try {
    if (!m || m.key?.remoteJid !== 'status@broadcast') {
      return false;
    }

    return false;
  } catch (e) {
    console.error("[autostatus] Error:", e.message || e);
  }
  return false;
}
