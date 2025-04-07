import fs from 'fs';
import path from 'path';

const WARNINGS_FILE = './jusorts/warnings.json';
const IS_LINK_BLOCKER_ENABLED = process.env.LINK_BLOCKER === 'true';
const MAX_WARNINGS = parseInt(process.env.LINK_WARNING_LIMIT || '5');

// Ensure jusorts folder and warnings file exist
if (!fs.existsSync('./jusorts')) fs.mkdirSync('./jusorts');
if (!fs.existsSync(WARNINGS_FILE)) fs.writeFileSync(WARNINGS_FILE, '{}');

let warnings = JSON.parse(fs.readFileSync(WARNINGS_FILE));

let handler = async (m, { conn, isBotAdmin }) => {
  if (!m.isGroup || !IS_LINK_BLOCKER_ENABLED) return;

  const linkRegex = /https:\/\/[^\s]+/gi;
  if (!linkRegex.test(m.text)) return;

  const groupId = m.chat;
  const userId = m.sender;

  if (!warnings[groupId]) warnings[groupId] = {};
  if (!warnings[groupId][userId]) warnings[groupId][userId] = 0;

  warnings[groupId][userId] += 1;
  fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));

  const warningCount = warnings[groupId][userId];

  if (warningCount >= MAX_WARNINGS) {
    if (isBotAdmin) {
      await conn.sendMessage(groupId, {
        text: `🚨 @${userId.split('@')[0]} has reached *${MAX_WARNINGS}* warnings!\nRemoving from the group...`,
        contextInfo: {
          mentionedJid: [userId],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'Silva md bot',
            serverMessageId: 143
          }
        }
      });

      await conn.groupParticipantsUpdate(groupId, [userId], 'remove');
      warnings[groupId][userId] = 0;
      fs.writeFileSync(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
    } else {
      await conn.sendMessage(groupId, {
        text: `⚠️ @${userId.split('@')[0]} reached *${MAX_WARNINGS}* warnings, but I’m not admin.`,
        contextInfo: {
          mentionedJid: [userId],
          forwardingScore: 999,
          isForwarded: true,
          forwardedNewsletterMessageInfo: {
            newsletterJid: '120363200367779016@newsletter',
            newsletterName: 'Silva md bot',
            serverMessageId: 143
          }
        }
      });
    }
  } else {
    await conn.sendMessage(groupId, {
      text: `⚠️ @${userId.split('@')[0]}, sending links is not allowed!\nWarning *${warningCount}/${MAX_WARNINGS}*.`,
      contextInfo: {
        mentionedJid: [userId],
        forwardingScore: 999,
        isForwarded: true,
        forwardedNewsletterMessageInfo: {
          newsletterJid: '120363200367779016@newsletter',
          newsletterName: 'Silva md bot',
          serverMessageId: 143
        }
      }
    });
  }
};

export default handler;
