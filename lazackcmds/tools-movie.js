import fetch from 'node-fetch'

let imdbHandler = async (m, { conn, text }) => {
  if (!text) throw 'Please provide a movie title'

  try {
    let res = await fetch(`https://api.popcat.xyz/imdb?q=${encodeURIComponent(text)}`)

    if (!res.ok) {
      throw new Error(`API request failed with status ${res.status}`)
    }

    let json = await res.json()

    console.log('JSON response:', json)

    let ratings = json.ratings.map(rating => `• *${rating.source}:* ${rating.value}`).join('\n')

    let movieInfo = `*𝐒𝐈𝐋𝐕𝐀 𝐌𝐃 𝐁𝐎𝐓 Movie Information:*\n
     • *Title:* ${json.title}\n
     • *Year:* ${json.year}\n
     • *Seasons:* ${json.totalseasons}\n
     • *Rated:* ${json.rated}\n
     • *Released:* ${json.released}\n
     • *Runtime:* ${json.runtime}\n
     • *Genres:* ${json.genres}\n
     • *Director:* ${json.director}\n
     • *Writer:* ${json.writer}\n
     • *Actors:* ${json.actors}\n
     • *Plot:* ${json.plot}\n
     • *Languages:* ${json.languages}\n
     • *Country:* ${json.country}\n
     • *Awards:* ${json.awards}\n
     • *Metascore:* ${json.metascore}\n
     • *Rating:* ${json.rating}\n
     • *Votes:* ${json.votes}\n
     • *IMDB ID:* ${json.imdbid}\n
     • *Type:* ${json.type}\n
     • *DVD:* ${json.dvd}\n
     • *Box Office:* ${json.boxoffice}\n
     • *Production:* ${json.production}\n
     • *Website:* ${json.website}\n\n
     *Ratings:*\n${ratings}`

    // send the movie poster along with the movie information as caption
    await conn.sendFile(m.chat, json.poster, 'poster.jpg', movieInfo, m)
  } catch (error) {
    console.error(error)
    // Handle the error appropriately
  }
}

imdbHandler.help = ['imdb']
imdbHandler.tags = ['tools']
imdbHandler.command = /^(imdb|movie)$/i

export default imdbHandler
