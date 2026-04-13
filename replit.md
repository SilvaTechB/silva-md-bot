# Silva MD Bot

A feature-rich multi-device WhatsApp bot built with Node.js and the Baileys library, featuring 1200+ commands across 196+ plugins, an AI agent, and comprehensive admin tools.

## Architecture

- **Runtime**: Node.js 20
- **Entry point**: `silva.js`
- **Web dashboard**: `smm/silva.html` — served via Express at port 25680
- **Plugins**: `plugins/` directory — loaded dynamically on start
- **Config**: `config.js` reads from `config.env` (if present) or environment variables
- **Session storage**: `session/` directory (multi-file auth state)

## Key Components

| File/Dir         | Purpose                                         |
|------------------|-------------------------------------------------|
| `silva.js`       | Main entry — connects to WhatsApp, runs Express |
| `handler.js`     | Message handler & command dispatcher            |
| `config.js`      | Config reader (env vars / config.env)           |
| `plugins/`       | Individual feature plugins (1200+ commands)     |
| `themes/`        | Theme JSON files (19 themes — silva default)    |
| `lib/theme.js`   | Theme loader — `getStr()`, `setActiveTheme()`   |
| `lib/`           | Shared utilities and functions                  |
| `utils/`         | Delay, safeSend, warmupGroup helpers            |
| `smm/silva.html` | Admin dashboard (served as static file)         |

## Environment Variables

See `sample.env` for the full list. Key ones:

- `SESSION_ID` — WhatsApp session (required). Format: `Silva~<base64-gzip>`
- `OWNER_NUMBER` — Bot owner's WhatsApp number
- `PREFIX` — Command prefix (default `.`)
- `MODE` — `public`, `private`, or `both`
- `PORT` — HTTP server port (default `25680`)

## Workflow

- **Command**: `node silva.js`
- **Port**: 25680 (Express web dashboard)
- **Output type**: webview

## Deployment

- **Target**: VM (always-running — maintains WhatsApp connection)
- **Run**: `node silva.js`

## Plugin System

Plugins use a unified shape (single export or array export):
```js
{ commands, description, permission, group, private, run(sock, message, args, ctx) }
```

**Permission tiers:**
- `public` — any user
- `admin` — group admins + owner
- `owner` — bot owner + sudo users

**Sudo system:** Sudo users get owner-level access to all bot commands. Managed via `.sudo add/del/list/reset` or `.setsudo/.delsudo/.getsudo/.resetsudo`. Only the real owner (matching OWNER_NUMBER or bot number) can manage the sudo list. Sudo list persists in `data/sudo.json` and loads on startup.

**ctx object keys:** `sock, conn, m, message, sender, jid, chat, isGroup, isAdmin, isBotAdmin, isOwner, isSudo, args, text, prefix, groupMetadata, contextInfo, mentionedJid, safeSend, reply`

## Plugin Categories (180+ files, 1200+ commands)

| Category | File(s) | Commands |
|----------|---------|----------|
| AI Agent | silva-agent.js | agent, do, silva, assistant, ask |
| Text Tools | text-tools.js | reverse, upper, lower, mock, morse, binary, base64, rot13, zalgo, leet, etc. (68 cmds) |
| Math Tools | math-tools.js | add, subtract, multiply, divide, sqrt, fibonacci, bmi, convert, roman, etc. (30+ cmds) |
| Games | games.js, emoji-games.js | rps, hangman, ttt, trivia, riddles, slots, 8ball, scramble, flagquiz, mathquiz, etc. (70+ cmds) |
| Utility | utility-tools.js | date, calendar, timer, timezone, qr, choose, notes, todo, uuid, lorem, speedtest, etc. (49 cmds) |
| Fun Facts | fun-facts.js | animal, space, history, science, tech, food, math, body, country, movie, music, sport facts (26 cmds) |
| Social | social-tools.js | tagall, hidetag, admins, groupinfo, mute, warn, rules, antiflood, antispam, report, etc. (33 cmds) |
| Education | education.js | element, country, planet, zodiac, vocab, acronym, currency, flag, phrasebook, nato, etc. (35 cmds) |
| Entertainment | entertainment.js | pickup lines, dad jokes, poems, memes, horoscopes, personality/mbti, ship, rate, etc. (30+ cmds) |
| Dev Tools | dev-tools.js | json, urlencode, hash, timestamp, regex, httpcode, ipinfo, password gen, cron, chmod (35 cmds) |
| Health/Fitness | health-fitness.js | workout, stretching, calories, water, sleep, meditation, steps, heart rate, yoga, recipe (28 cmds) |
| Random Gen | random-generators.js | fake name/email/phone/id, superpower, nickname, excuse, advice, motivation, affirmation, dream (33 cmds) |
| Language | language-tools.js | greetings, I love you, proverbs, slang, idioms, rhymes, synonyms, antonyms, palindrome (29 cmds) |
| Security | security-tools.js | antiban, settings, setprefix, block, setbio, restart, leave, join, antilink, antibadword (38 cmds) |
| Productivity | productivity.js | pomodoro, habits, goals, journal, budget, flashcards, bookmarks, schedule, gratitude (24 cmds) |
| Info Lookup | info-lookup.js | dog/cat breeds, superheroes, programming langs, OS info, social platforms, cars, phones (20 cmds) |
| Crypto/Finance | crypto-finance.js | crypto info, loan calc, savings calc, tax, inflation, bill split, salary, discount (26 cmds) |
| Misc | misc-extras.js | matrix, uwuify, copypasta, border, rainbow text, bio/caption ideas, zodiac match, text art (42 cmds) |
| Original Plugins | 160+ original plugin files | sticker, menu, music, tiktok, instagram, youtube, weather, translate, eval, etc. |

## Safety Features

- **Rate limiting**: max 30 messages/minute via `safeSend()`
- **Random jitter**: 100-500ms delay between messages
- **Anti-spam/flood**: Per-group configurable protection
- **Message cache**: 3-hour TTL for retry/anti-delete recovery
- **`seenCmdIds` cleanup**: Auto-clears every 10 minutes

## GitHub Packages

- **npm package**: `@silvatechb/silva-md-bot` — published to GitHub Packages npm registry
- **Docker image**: `ghcr.io/silvatechb/silva-md-v4` — published to GitHub Container Registry
- **Auto-publish**: GitHub Actions workflows in `.github/workflows/` auto-publish on release or manual trigger
- **Config files**: `.npmrc` (registry), `.npmignore` (excludes session/data), `Dockerfile`, `.dockerignore`
- **Security**: `package.json` author field must be `"Silva"` — integrity check in `silva.js` validates this on startup

## Notes

- The bot requires a `SESSION_ID` secret to connect to WhatsApp. Without it, the web dashboard still runs but the bot won't connect.
- Session data is stored in the `session/` directory.
- Baileys: `@whiskeysockets/baileys@6.7.21` — direct stable release (no alias)
- `config.OWNER_NUMBER` is set dynamically on `connection.update → open` from `sock.user.id` — no need to hardcode it.
- `handler.js` exports: `handleMessages, safeSend, setupConnectionHandlers, PERM, plugins`
- Anti-delete (`messages.update` + `messages.delete`) always forwards recovered/edited messages to owner JID only.
- Anti-demote: `group-participants.update` listener re-promotes demoted admins in groups tracked by `global.antiDemoteGroups` (Set).
- AFK auto-reply fires before prefix check for non-owner messages; owner messages bypass it so `.back` always works.
