// plugins/music.js
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const stream = require('stream');

module.exports = {
    name: 'music',
    commands: ['song', 'music', 'play'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        // Helper function to sanitize filenames
        const sanitizeFilename = (name) => {
            return name.replace(/[^\w\s.-]/gi, '_').substring(0, 100);
        };

        try {
            // Combine arguments to form search query
            const query = args.join(' ');
            if (!query) {
                return sock.sendMessage(sender, {
                    text: '❌ Please provide a song name!\nExample: .song Adele Hello',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Search YouTube
            const searchResults = await yts(query);
            if (!searchResults.videos.length) {
                return sock.sendMessage(sender, {
                    text: '❌ No results found for your query!',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Get first video result
            const video = searchResults.videos[0];
            const videoUrl = video.url;
            const title = video.title;
            const duration = video.timestamp;
            const thumbnail = video.thumbnail;

            // Send initial info with thumbnail
            await sock.sendMessage(sender, {
                image: { url: thumbnail },
                caption: `🔍 *Searching for:* ${title}\n🕒 *Duration:* ${duration}\n\n⏳ Downloading audio...`,
                contextInfo: contextInfo
            }, { quoted: m });

            // Define API endpoints
            const apis = [
                `https://apis.davidcyriltech.my.id/youtube/mp3?url=${videoUrl}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${videoUrl}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${videoUrl}`
            ];

            let mp3Url;
            let apiResponse;

            // Try APIs in sequence
            for (const api of apis) {
                try {
                    const response = await axios.get(api);
                    if (response.data && (response.data.url || response.data.result)) {
                        apiResponse = response.data;
                        mp3Url = response.data.url || response.data.result;
                        break;
                    }
                } catch (e) {
                    console.log(`API failed: ${api}`);
                }
            }

            if (!mp3Url) {
                return sock.sendMessage(sender, {
                    text: '❌ All conversion APIs failed! Try again later.',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Handle special API response formats
            if (apiResponse && apiResponse.result && typeof apiResponse.result === 'object') {
                mp3Url = apiResponse.result.url || mp3Url;
            }

            // Generate temp filename
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const filename = sanitizeFilename(title) + '.mp3';
            const filePath = path.join(tempDir, filename);

            // Download MP3 with proper error handling
            const writer = fs.createWriteStream(filePath);
            try {
                const response = await axios({
                    url: mp3Url,
                    method: 'GET',
                    responseType: 'stream',
                    timeout: 60000 // 60 seconds timeout
                });

                const pipeline = promisify(stream.pipeline);
                await pipeline(response.data, writer);
            } catch (downloadError) {
                console.error('Download failed:', downloadError);
                if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
                return sock.sendMessage(sender, {
                    text: '❌ Download failed. The server might be down or the file is too large.',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Read file into buffer
            const fileBuffer = fs.readFileSync(filePath);
            const fileSizeMB = (fileBuffer.length / (1024 * 1024)).toFixed(2);

            // Send audio file
            await sock.sendMessage(sender, {
                audio: fileBuffer,
                mimetype: 'audio/mpeg',
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title: title,
                        body: `🎵 Music Downloader (${fileSizeMB}MB)`,
                        thumbnailUrl: thumbnail,
                        sourceUrl: videoUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            // Send as document
            await sock.sendMessage(sender, {
                document: fileBuffer,
                fileName: filename,
                mimetype: 'audio/mpeg',
                caption: `📁 *${title}*`,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title: "📥 Document Version",
                        body: "Downloadable MP3 file",
                        thumbnailUrl: thumbnail,
                        sourceUrl: videoUrl,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

            // Cleanup
            fs.unlinkSync(filePath);

        } catch (error) {
            console.error('Music plugin error:', error);
            sock.sendMessage(sender, {
                text: '❌ Failed to download music. Please try another song.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};
