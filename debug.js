import dns from 'dns';
dns.setDefaultResultOrder('ipv4first');

import { makeWASocket } from '@whiskeysockets/baileys';

const conn = makeWASocket({
  printQRInTerminal: true,
  auth: { creds: {}, keys: {} } // Empty session
});

conn.ev.on('connection.update', (update) => {
  console.log('Connection Update:', JSON.stringify(update, null, 2));
});