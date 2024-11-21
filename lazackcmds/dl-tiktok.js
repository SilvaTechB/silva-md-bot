import fetch from 'node-fetch'; // Ensure you have the node-fetch module installed

let handler = async (m, { conn, args }) => {
  const url = args[0];  // Extract URL from user input
  
  // Check if the URL is a valid TikTok link
  if (url.startsWith("https://vt.tiktok.com/") || 
      url.startsWith("https://www.tiktok.com/") || 
      url.startsWith("https://t.tiktok.com/") || 
      url.startsWith("https://vm.tiktok.com/")) {

    m.reply('*Please wait while we fetch the video...*');
    
    try {
      // Attempt to fetch the video data from the first API
      const response = await fetch(`https://api.tiklydown.eu.org/api/download?url=${encodeURIComponent(url)}`);
      const data = await response.json();
      
      if (data.video && data.video.noWatermark) {
        const videoUrl = data.video.noWatermark;
        const caption = `
        *TIKTOK DOWNLOADER*

        *Video by*: _${data.author.name || 'Unknown'}_ ([@${data.author.unique_id || 'N/A'}])
        *Likes*: ${data.stats.likeCount || 0}
        *Comments*: ${data.stats.commentCount || 0}
        *Shares*: ${data.stats.shareCount || 0}
        *Plays*: ${data.stats.playCount || 0}
        *Saves*: ${data.stats.saveCount || 0}

        \`⏤͟͟͞͞ Downloader By Silva MD Bot\`
        `;
        
        // Send the video to the user
        await conn.sendMessage(m.chat, {
          caption: caption,
          video: { url: videoUrl }
        }, { quoted: m });

      } else {
        throw new Error("Failed to fetch video data.");
      }

    } catch (error) {
      // Fallback: try using another API if the first one fails
      try {
        const response = await fetch(`https://widipe.com/download/tikdl?url=${encodeURIComponent(url)}`);
        const data = await response.json();
        
        if (data.result && data.result.video) {
          const videoUrl = data.result.video;
          const caption = `
          *TIKTOK DOWNLOADER*

          *Video by*: _${data.author.name || 'Unknown'}_ ([@${data.author.unique_id || 'N/A'}])
          *Likes*: ${data.stats.likeCount || 0}
          *Comments*: ${data.stats.commentCount || 0}
          *Shares*: ${data.stats.shareCount || 0}
          *Plays*: ${data.stats.playCount || 0}
          *Saves*: ${data.stats.saveCount || 0}

          \`⏤͟͟͞͞ Downloader By Silva MD Bot\`
          `;
          
          // Send the video to the user
          await conn.sendMessage(m.chat, {
            caption: caption,
            video: { url: videoUrl }
          }, { quoted: m });

        } else {
          throw new Error("Failed to fetch video data.");
        }

      } catch (error) {
        // Handle errors gracefully
        conn.reply(m.chat, "Sorry, we couldn't fetch the video. Please try again later.", m);
      }
    }
  } else {
    conn.reply(m.chat, "Please provide a valid TikTok URL.", m);
  }
};

handler.help = ["tiktok", "tikdown"];
handler.tags = ["downloader"];
handler.command = ["tiktok", "tikdown"];
handler.owner = false;
handler.private = true;

export default handler;
