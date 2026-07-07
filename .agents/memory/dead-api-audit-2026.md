---
name: Silva MD Dead API Audit June 2026
description: Which external APIs are dead vs live; what replacements were used.
---

## Dead APIs (removed June 2026)
| API | Reason |
|-----|--------|
| nexoracle.com | Returns bot-protection HTML on all endpoints |
| siputzx.my.id | ENOTFOUND — domain gone |
| paxsenix.biz.id | ENOTFOUND — domain gone |
| ryzendesu.vip | Bot-protected — returns HTML, not JSON |
| giftedtech.web.id | ENOTFOUND — domain gone |
| api.shrtco.de/v2 | ENOTFOUND — domain gone |
| api.lyrics.ovh | ECONNREFUSED / no response |
| meme-api.com | 500 errors / no response |
| numbersapi.com | ECONNREFUSED |
| hastebin.com/documents | Connection refused |
| sofascore.com API | 403/blocked |
| saavn.dev | ENOTFOUND — domain gone |
| restcountries.com v2/v3.1 | Deprecated/broken |
| fastdl.app | Bot-blocked |
| saveig.app | Dead |
| snapinsta.app | Dead |
| adviceslip.com | Frequent timeouts (kept as secondary) |

## Live APIs (confirmed June 2026)
- ch.at/api/chat — fast, ~400ms
- pollinations.ai text — ~3-5s fallback
- davidcyriltech.my.id ytmp3/ytmp4 — 3-5s
- play-dl (npm) — YouTube search, no API key needed
- coingecko.com/api/v3 — crypto
- frankfurter.app — currency
- jikan.moe/v4 — anime
- mymemory.translated.net — translation
- qrserver.com — QR generation
- official-joke-api.appspot.com — jokes
- opentdb.com/api — trivia
- datamuse.com/api — words
- wttr.in — weather
- tinyurl.com/api-create.php — URL shortening
- v.gd/create.php — URL shortening
- cleanuri.com/api/v1 — URL shortening
- uselessfacts.jsph.pl/api/v2 — random facts
- v2.jokeapi.dev — jokes
- thecolorapi.com — color info
- ip-api.com/json — IP lookup
- zenquotes.io/api — quotes/advice
- saurav.tech/NewsAPI — news
- countriesnow.space/api/v0.1 — country data
- worldbank.org/v2/country — country data
- imgflip.com/get_memes — meme templates
- site.api.espn.com — sports scores/standings (no key)
- some-random-api.com/lyrics — song lyrics
- carbon.now.sh + thum.io screenshot — code images
- paste.rs — text paste (no account)
- dpaste.org/api — text paste fallback
- catbox.moe/user/api.php — file/text upload
- vxtwitter.com / fxtwitter.com — Twitter media

## Replacement Strategy
- AI commands: ch.at primary + pollinations fallback (never timeout)
- YouTube: play-dl for search, davidcyriltech for download
- Country info: countriesnow.space + worldbank fallback
- Sports: ESPN public API (no key needed)
- Memes: Reddit JSON then imgflip templates
- Lyrics: some-random-api.com then Genius scrape then search links
- Paste: paste.rs → dpaste.org → catbox.moe
- URL shorten: tinyurl → v.gd
- Twitter: vxtwitter API → fxtwitter API
- Instagram: 8-strategy chain (session cookie, GraphQL, mobile API, embed page, parallel APIs, snapsave, igram, oEmbed)
- Facebook: fdownloader.net → getvideourl.com → link fallback
- Pinterest: oEmbed → page scrape → pinterestdownloader → link fallback

**Why:** Free/unofficial APIs die frequently; always chain multiple sources and end with a graceful link fallback so the command never crashes the bot.
