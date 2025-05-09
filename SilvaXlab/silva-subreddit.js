import fetch from 'node-fetch'

let subredditHandler = async (m, { conn, text }) => {
  if (!text) throw 'Please provide a subreddit name'

  try {
    let res = await fetch(`https://api.popcat.xyz/subreddit/${encodeURIComponent(text)}`)

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`)
    }

    let json = await res.json()

    console.log('JSON response:', json)

    let subredditInfo = `*𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 Subreddit Information:*\n
     • *Name:* ${json.name}\n
     • *Title:* ${json.title}\n
     • *Active Users:* ${json.active_users}\n
     • *Members:* ${json.members}\n
     • *Description:* ${json.description}\n
     • *Allow Videos:* ${json.allow_videos ? 'Yes' : 'No'}\n
     • *Allow Images:* ${json.allow_images ? 'Yes' : 'No'}\n
     • *Over 18:* ${json.over_18 ? 'Yes' : 'No'}\n
     • *URL:* ${json.url}`

    // if icon is not null or undefined, send it along with the subreddit information as caption
    // otherwise, only send the subreddit information
    if (json.icon) {
      await conn.sendFile(m.chat, json.icon, 'icon.jpg', subredditInfo, m)
    } else {
      m.reply(subredditInfo)
    }
  } catch (error) {
    console.error(error)
    // Handle the error appropriately
  }
}

subredditHandler.help = ['subreddit']
subredditHandler.tags = ['tools']
subredditHandler.command = /^(subreddit|reddit)$/i

export default subredditHandler
