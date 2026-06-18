# Silva MD Bot

> A powerful, feature-rich multi-device WhatsApp bot built with Node.js and the Baileys library. 1500+ commands, 214 plugins, AI agent, anti-ban protection, and a live admin dashboard.

---

## Quick Start

| Step | Action |
|------|--------|
| 1 | Set `SESSION_ID` secret (format: `Silva~<base64>`) |
| 2 | Run: `node silva.js` |
| 3 | Dashboard at `http://localhost:5000` |
| 4 | Send `.menu` in WhatsApp to see all commands |

---

## Architecture

```
silva-md-bot/
├── silva.js          ← Main entry: WhatsApp connection + Express server
├── handler.js        ← Message router & command dispatcher
├── config.js         ← Config reader (env vars / config.env)
├── plugins/          ← 214 plugin files (1500+ commands), loaded dynamically
├── lib/              ← Shared utilities (theme, statusManager, phone-utils)
├── themes/           ← 19 theme JSON files (default: silva)
├── data/             ← Runtime JSON storage (sudo, pairs, warnings, etc.)
├── session/          ← WhatsApp multi-file auth state
├── smm/silva.html    ← Admin dashboard (served at port 5000)
└── utils/            ← Delay, safeSend, warmupGroup helpers
```

---

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_ID` | — | **Required.** WhatsApp session (`Silva~<base64-gzip>`) |
| `OWNER_NUMBER` | auto | Bot owner's WhatsApp number (auto-set from bot JID) |
| `PREFIX` | `.` | Command prefix. Supports comma list: `.` `,` `!` `/` |
| `BOT_NAME` | `Silva MD` | Bot display name |
| `MODE` | `both` | `public`, `private`, or `both` |
| `PORT` | `5000` | HTTP server port |
| `THEME` | `silva` | Active theme name |
| `AUTO_STATUS_SEEN` | `true` | Auto-view WhatsApp statuses |
| `AUTO_STATUS_REACT` | `true` | Auto-react to statuses |
| `ANTIDELETE_GROUP` | `true` | Forward deleted group messages to owner |
| `ANTIDELETE_PRIVATE` | `true` | Forward deleted private messages to owner |
| `ALWAYS_ONLINE` | `true` | Keep bot always online |
| `DEBUG` | `false` | Enable verbose logging |

See `sample.env` for the full list.

---

## Plugin System

Plugins export a single object or array:

```js
module.exports = {
    commands:    ['cmd', 'alias'],
    description: 'What this does',
    permission:  'public',   // public | admin | owner
    group:       true,       // works in groups
    private:     true,       // works in private chats
    run: async (sock, message, args, ctx) => { ... }
};
```

**`ctx` object:** `sock, m, message, sender, jid, chat, isGroup, isAdmin, isBotAdmin, isOwner, isSudo, args, text, prefix, groupMetadata, contextInfo, mentionedJid, safeSend, reply`

### Permission Tiers

| Level | Who |
|-------|-----|
| `public` | Any user |
| `admin` | Group admins + owner + sudo |
| `owner` | Bot owner + sudo users only |

### Sudo System

Sudo users have owner-level access. Managed with:
- `.sudo add/del/list/reset`
- Only the real owner (matching `OWNER_NUMBER`) can manage sudo
- Persists in `data/sudo.json`

---

## Plugin Categories

| Category | Commands |
|----------|----------|
| 🤖 AI Agent | `silva`, `ask`, `agent`, `do`, `assistant` |
| 🎵 Music & Video | `play`, `music`, `ytmp3`, `ytmp4`, `tiktok`, `tt` |
| 🔤 Text Tools | `reverse`, `upper`, `lower`, `morse`, `binary`, `base64`, `zalgo`, `leet` (68 cmds) |
| 🧮 Math | `add`, `subtract`, `multiply`, `divide`, `sqrt`, `fibonacci`, `bmi`, `convert` (30+ cmds) |
| 🎮 Games | `rps`, `hangman`, `ttt`, `trivia`, `slots`, `8ball`, `scramble`, `flagquiz` (70+ cmds) |
| 🛠 Utility | `date`, `calendar`, `timer`, `qr`, `notes`, `todo`, `uuid`, `speedtest` (49 cmds) |
| 🌐 Social/Group | `tagall`, `hidetag`, `admins`, `mute`, `warn`, `antiflood`, `report` (33 cmds) |
| 📚 Education | `element`, `country`, `planet`, `zodiac`, `vocab`, `currency`, `flag` (35 cmds) |
| 😂 Entertainment | `pickup`, `dadjoke`, `poem`, `meme`, `horoscope`, `ship`, `rate` (30+ cmds) |
| 🔒 Security | `antiban`, `setprefix`, `antilink`, `antibadword`, `antispam`, `restart` (38 cmds) |
| 💪 Health | `workout`, `calories`, `water`, `sleep`, `meditation`, `yoga` (28 cmds) |
| 💻 Dev Tools | `json`, `hash`, `timestamp`, `regex`, `httpcode`, `password`, `cron` (35 cmds) |
| 🎲 Random | `fakename`, `superpower`, `excuse`, `advice`, `motivation`, `dream` (33 cmds) |
| 💰 Finance | `crypto`, `loan`, `savings`, `tax`, `billsplit`, `salary`, `discount` (26 cmds) |
| 📖 Language | `greet`, `proverb`, `slang`, `idiom`, `rhyme`, `synonym`, `antonym` (29 cmds) |
| ✅ Productivity | `pomodoro`, `habit`, `goal`, `journal`, `budget`, `flashcard`, `schedule` (24 cmds) |
| 🎨 Misc/Fun | `matrix`, `uwuify`, `copypasta`, `rainbow`, `zodiacmatch`, `textart` (42 cmds) |

---

## Safety & Anti-Ban Features

- **Rate limiting** — max 30 sends/minute via `safeSend()`
- **Random jitter** — 100–500ms delay between messages
- **Anti-flood** — per-group configurable flood protection
- **Anti-spam** — pattern-based spam detection and removal
- **Anti-link** — auto-delete unauthorized group links
- **Anti-delete** — recovers deleted messages and forwards to owner
- **Anti-ViewOnce** — auto-reveals view-once media to owner
- **Anti-demote** — re-promotes demoted admins in protected groups
- **Message dedup** — `seenCmdIds` set auto-clears every 10 min
- **Message cache** — 3-hour TTL for retry/anti-delete recovery

---

## Deployment

- **Runtime:** Node.js ≥ 20
- **Command:** `node silva.js`
- **Port:** `5000` (configurable via `PORT` env var)
- **Target:** VM / always-running server (maintains WhatsApp connection)
- **Session:** Stored in `session/` directory; restore from `SESSION_ID` secret on cold start

### Auto-Join Groups

The bot hardcodes specific group invite codes in `silva.js` (`HARDCODED_GROUPS` array). These cannot be overridden by environment variables or bot commands — the bot will always rejoin them on every startup.

---

## Key Technical Notes

- **Baileys fork:** `gifted-baileys` via `@whiskeysockets/baileys` alias
- **WA version:** Fetched live from upstream WhiskeySockets/Baileys on startup (pinned fallback: `2.3000.1035194821`)
- **LID support:** Full LID↔JID mapping for newer WhatsApp accounts
- **AFK system:** Auto-reply when AFK; owner `.back` command always bypasses it
- **Anti-delete:** `messages.update` + `messages.delete` listeners → forwards to owner JID only
- **Anti-demote:** `group-participants.update` re-promotes admins in `global.antiDemoteGroups`
- **Session restore:** `SESSION_ID` only writes `creds.json` if it does not already exist (prevents Bad MAC errors)

---

## GitHub

- **Repo:** [github.com/SilvaTechB/silva-md-bot](https://github.com/SilvaTechB/silva-md-bot)
- **npm package:** `@silvatechb/silva-md-bot` → GitHub Packages
- **Docker image:** `ghcr.io/silvatechb/silva-md-v4` → GitHub Container Registry
- **Security:** `package.json` `author` field must equal `"Silva"` — verified on every startup

## User Preferences

- Keep the group auto-join code hardcoded in `silva.js` (`HARDCODED_GROUPS`) so it cannot be changed via env or commands.
