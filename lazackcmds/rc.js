import sharp from 'sharp'; // For image processing

import fs from 'fs'; // For file system operations

import path from 'path'; // For path management

import os from 'os'; // For OS-specific temp directory

let handler = async (m, { conn, text, usedPrefix, command }) => {

  try {

    // Ensure that the message has a valid reply with media (image or video)

    if (!m.quoted || (!m.quoted.mtype || (!m.quoted.mtype.includes('image') && !m.quoted.mtype.includes('video')))) {

      return await conn.sendMessage(m.chat, { text: '❌ Please reply to an image or video to create a sticker.' }, { quoted: m });

    }

    // Download the media using m.quoted.download()

    const mediaBuffer = await m.quoted.download();

    // Create an SVG mask for rounded corners

    const roundedCorners = Buffer.from(

      `<svg><rect x="0" y="0" width="512" height="512" rx="85" ry="85"/></svg>`

    );

    // Process the image to apply rounded corners

    const processedImageBuffer = await sharp(mediaBuffer)

      .resize(512, 512) // Ensure the image is square (512x512)

      .composite([{ input: roundedCorners, blend: 'dest-in' }]) // Apply rounded corners

      .webp({ quality: 90 }) // Convert the image to WebP format (ensure quality)

      .toBuffer();

    // React with clock emoji to indicate the bot is processing

    await m.react('⏳');

    // Send the processed image buffer directly as a sticker (WebP)

    await conn.sendMessage(m.chat, { sticker: processedImageBuffer }, { quoted: m });

    // React with checkmark to indicate success

    await m.react('✅');

  } catch (e) {

    console.error('Error processing the sticker:', e);

    // React with cross if something went wrong

    await m.react('❌');

    await conn.sendMessage(m.chat, { text: `❌ Error: ${e.message}` }, { quoted: m });

  }

};

// Command metadata

handler.help = ['rc']; // Help command

handler.tags = ['sticker']; // Tags for categorization

handler.command = /^(rc)$/i; // Command trigger

export default handler;
