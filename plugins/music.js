// plugins/music.js
const axios = require('axios');
const yts = require('yt-search');
const fs = require('fs');
const path = require('path');
const { randomBytes } = require('crypto');
const { promisify } = require('util');
const stream = require('stream');
const pipeline = promisify(stream.pipeline);

module.exports = {
    name: 'music',
    commands: ['song', 'music', 'play'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        // Helper function to sanitize filenames
        const sanitizeFilename = (name) => {
            return name.replace(/[^\w\s.-]/gi, '_').substring(0, 100);
        };

        // Helper to extract URL from API responses
        const extractMp3Url = (apiResponse) => {
            try {
                // Case 1: Direct URL string
                if (typeof apiResponse.url === 'string') return apiResponse.url;
                
                // Case 2: Nested result object
                if (apiResponse.result) {
                    // String result
                    if (typeof apiResponse.result === 'string') return apiResponse.result;
                    
                    // Object result with url property
                    if (apiResponse.result.url) return apiResponse.result.url;
                    
                    // Object result with download link
                    if (apiResponse.result.mp3 || apiResponse.result.audio) {
                        return apiResponse.result.mp3 || apiResponse.result.audio;
                    }
                }
                
                // Case 3: Alternative structures
                if (apiResponse.data?.url) return apiResponse.data.url;
                if (apiResponse.link) return apiResponse.link;
                if (apiResponse.download) return apiResponse.download;
                
                return null;
            } catch (e) {
                return null;
            }
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
                `https://apis.davidcyriltech.my.id/youtube/mp3?url=${encodeURIComponent(videoUrl)}`,
                `https://api.ryzendesu.vip/api/downloader/ytmp3?url=${encodeURIComponent(videoUrl)}`,
                `https://api.akuari.my.id/downloader/youtubeaudio?link=${encodeURIComponent(videoUrl)}`
            ];

            let mp3Url = null;
            let successfulApi = null;

            // Try APIs in sequence with better logging
            for (const [index, api] of apis.entries()) {
                try {
                    console.log(`Trying API ${index + 1}: ${api}`);
                    const response = await axios.get(api, { timeout: 10000 });
                    
                    // Extract URL from response
                    const extractedUrl = extractMp3Url(response.data);
                    
                    if (extractedUrl && typeof extractedUrl === 'string' && extractedUrl.startsWith('http')) {
                        mp3Url = extractedUrl;
                        successfulApi = api;
                        console.log(`✅ Success with API ${index + 1}: ${mp3Url}`);
                        break;
                    } else {
                        console.log(`⚠️ API ${index + 1} returned invalid URL:`, JSON.stringify(response.data, null, 2));
                    }
                } catch (e) {
                    console.log(`❌ API ${index + 1} failed: ${e.message}`);
                }
            }

            if (!mp3Url) {
                return sock.sendMessage(sender, {
                    text: '❌ All conversion APIs failed! Try again later.',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            // Generate temp filename
            const tempDir = path.join(__dirname, '../temp');
            if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });
            
            const filename = sanitizeFilename(title) + '.mp3';
            const filePath = path.join(tempDir, filename);

            // Download MP3 with proper error handling
            try {
                console.log(`Starting download from: ${mp3Url}`);
                const response = await axios({
                    url: mp3Url,
                    method: 'GET',
                    responseType: 'stream',
                    timeout: 60000
                });

                await pipeline(response.data, fs.createWriteStream(filePath));
                console.log(`✅ Download complete: ${filePath}`);
            } catch (downloadError) {
                console.error('❌ Download failed:', downloadError);
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
                        body: `🎵 Music Downloader (${fileSizeMB}MB) | Source: ${new URL(successfulApi).hostname}`,
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
            console.error('❌ Music plugin error:', error);
            sock.sendMessage(sender, {
                text: '❌ Failed to download music. Please try another song.',
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};
