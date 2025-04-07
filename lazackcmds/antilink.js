import fs from 'fs';
import path from 'path';
import { promises as fsPromises } from 'fs';

const WARNINGS_FILE = './jusorts/warnings.json';
const IS_LINK_BLOCKER_ENABLED = process.env.LINK_BLOCKER === 'true';
const MAX_WARNINGS = Math.max(Number(process.env.LINK_WARNING_LIMIT) || 5, 1);

// Improved link detection regex
const LINK_REGEX = /(?:\b(https?|ftp):\/\/|www\.)[^\s/$.?#].[^\s]*\b/gi;

// Initialize warnings data
let warnings = {};

// File operations with error handling
const initializeFiles = async () => {
  try {
    await fsPromises.mkdir('./jusorts', { recursive: true });
    const fileExists = await fsPromises.access(WARNINGS_FILE).then(() => true).catch(() => false);
    if (!fileExists) await fsPromises.writeFile(WARNINGS_FILE, '{}');
    warnings = JSON.parse(await fsPromises.readFile(WARNINGS_FILE));
  } catch (error) {
    console.error('Initialization error:', error);
  }
};

initializeFiles();

const saveWarnings = async () => {
  try {
    await fsPromises.writeFile(WARNINGS_FILE, JSON.stringify(warnings, null, 2));
  } catch (error) {
    console.error('Failed to save warnings:', error);
  }
};

const sendWarningMessage = async (conn, groupId, userId, message, warningCount = null) => {
  const mention = `@${userId.split('@')[0]}`;
  const baseMessage = `${mention} ${message}`;
  const warningText = warningCount !== null ? ` (${warningCount}/${MAX_WARNINGS})` : '';
  
  try {
    await conn.sendMessage(groupId, {
      text: `${baseMessage}${warningText}`,
      mentions: [userId]
    });
  } catch (error) {
    console.error('Failed to send warning message:', error);
  }
};

const handleUserRemoval = async (conn, groupId, userId) => {
  try {
    await conn.groupParticipantsUpdate(groupId, [userId], 'remove');
    // Clean up warnings after removal
    if (warnings[groupId]?.[userId]) {
      delete warnings[groupId][userId];
      await saveWarnings();
    }
  } catch (error) {
    console.error('Failed to remove user:', error);
    await sendWarningMessage(conn, groupId, userId, '⚠️ Failed to remove user! Please check bot permissions.');
  }
};

let handler = async (m, { conn, isBotAdmin }) => {
  if (!m.isGroup || !IS_LINK_BLOCKER_ENABLED) return;
  if (m.sender === conn.user.id) return; // Ignore bot's own messages

  // Check if message contains links
  const hasLinks = LINK_REGEX.test(m.text);
  if (!hasLinks) return;

  const groupId = m.chat;
  const userId = m.sender;

  try {
    // Check if user is admin
    const metadata = await conn.groupMetadata(groupId);
    const isAdmin = metadata.participants.find(p => p.id === userId)?.admin;
    if (isAdmin) return; // Skip admin checks
  } catch (error) {
    console.error('Failed to check user admin status:', error);
  }

  // Initialize warning counters
  warnings[groupId] = warnings[groupId] || {};
  warnings[groupId][userId] = (warnings[groupId][userId] || 0) + 1;

  await saveWarnings();
  const warningCount = warnings[groupId][userId];

  if (warningCount >= MAX_WARNINGS) {
    if (isBotAdmin) {
      await sendWarningMessage(
        conn, 
        groupId, 
        userId, 
        `🚨 Has reached *${MAX_WARNINGS}* warnings! Removing from group...`
      );
      await handleUserRemoval(conn, groupId, userId);
    } else {
      await sendWarningMessage(
        conn, 
        groupId, 
        userId, 
        `⚠️ Reached maximum warnings but I'm not admin!`
      );
    }
  } else {
    await sendWarningMessage(
      conn, 
      groupId, 
      userId, 
      `⚠️ Sending links is not allowed! Warning`,
      warningCount
    );
  }
};

export default handler;
