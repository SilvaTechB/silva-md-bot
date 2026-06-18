<div align="center">

<img src="https://i.imgur.com/dBaSKWF.gif" height="20" width="100%">

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=800&size=45&duration=3000&pause=800&color=FF00A6&center=true&vCenter=true&width=900&height=80&lines=SILVA+MD+BOT;Next-Gen+WhatsApp+Bot)](https://git.io/typing-svg)

<img src="https://i.imgur.com/RvEKtPJ.jpeg" alt="Silva MD Bot" width="280" style="border-radius:20px">

<br>

[![Stars](https://img.shields.io/github/stars/SilvaTechB/silva-md-bot?style=for-the-badge&logo=github&logoColor=white&labelColor=0d1117&color=FF00A6)](https://github.com/SilvaTechB/silva-md-bot/stargazers)
[![Forks](https://img.shields.io/github/forks/SilvaTechB/silva-md-bot?style=for-the-badge&logo=git&logoColor=white&labelColor=0d1117&color=6f42c1)](https://github.com/SilvaTechB/silva-md-bot/network/members)
[![Last Commit](https://img.shields.io/github/last-commit/SilvaTechB/silva-md-bot?style=for-the-badge&logo=github&logoColor=white&labelColor=0d1117&color=00d4aa)](https://github.com/SilvaTechB/silva-md-bot/commits)
[![License](https://img.shields.io/github/license/SilvaTechB/silva-md-bot?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=0d1117&color=3b82f6)](LICENSE)

**A powerful, feature-rich multi-device WhatsApp bot — 1500+ commands, AI agent, 19 smart features, and anti-ban protection. Built with Node.js and Baileys.**

<img src="https://i.imgur.com/dBaSKWF.gif" height="20" width="100%">

</div>

---

## 🔐 Step 1 — Get Your Session ID

> You need this before deploying. It connects the bot to your WhatsApp account.

<div align="center">

<a href="https://silva-session-selector.vercel.app/">
  <img src="https://img.shields.io/badge/🔐%20GET%20SESSION%20ID-Click%20Here%20to%20Generate-25D366?style=for-the-badge&labelColor=075E54&color=25D366" alt="Get Session ID" height="40">
</a>

</div>

1. Open the link above → choose **QR Code** or **Pairing Code**
2. Link your WhatsApp → copy the `SESSION_ID` value shown
3. Paste it as `SESSION_ID` in your host's environment/secrets panel

> ⚠️ **Keep your Session ID private.** It gives full access to your WhatsApp. Never share it publicly.

---

## 🚀 Step 2 — Deploy

<div align="center">

<a href="https://silva-md-fork-checker.vercel.app/">
  <img src="https://img.shields.io/badge/HEROKU-Deploy%20Now-430098?style=for-the-badge&logo=heroku&logoColor=white" height="36">
</a>&nbsp;
<a href="https://railway.app/new">
  <img src="https://img.shields.io/badge/RAILWAY-Deploy%20Now-0B0D0E?style=for-the-badge&logo=railway&logoColor=white" height="36">
</a>&nbsp;
<a href="https://app.koyeb.com">
  <img src="https://img.shields.io/badge/KOYEB-Deploy%20Now-121212?style=for-the-badge&logo=koyeb&logoColor=white" height="36">
</a>&nbsp;
<a href="https://replit.com">
  <img src="https://img.shields.io/badge/REPLIT-Deploy%20Now-F26207?style=for-the-badge&logo=replit&logoColor=white" height="36">
</a>

</div>

<br>

<details>
<summary><b>🟣 Heroku</b> — Recommended · 24/7 uptime · Auto-restart on crash</summary>

<br>

| Step | Action |
|:----:|--------|
| **1** | [Fork the repo](https://github.com/SilvaTechB/silva-md-bot/fork) to your GitHub |
| **2** | Open [silva-md-fork-checker.vercel.app](https://silva-md-fork-checker.vercel.app/) → click **Deploy to Heroku** |
| **3** | Fill in `SESSION_ID`, `OWNER_NUMBER`, `BOT_NAME` on the setup screen |
| **4** | Click **Deploy App** — wait ~2 minutes |
| **5** | Go to **More → View Logs** → confirm `✅ Connected to WhatsApp` |

> 💡 Heroku eco/basic dynos keep the bot online 24/7. Recommended for stability.

</details>

<details>
<summary><b>🚂 Railway</b> — $5 free credits/month · No sleep · Fast builds</summary>

<br>

| Step | Action |
|:----:|--------|
| **1** | [Fork the repo](https://github.com/SilvaTechB/silva-md-bot/fork) to your GitHub |
| **2** | Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub** |
| **3** | Select your forked `silva-md-bot` repo |
| **4** | Open the **Variables** tab and add `SESSION_ID`, `OWNER_NUMBER`, `BOT_NAME` |
| **5** | Railway auto-detects Node.js — watch the build logs |
| **6** | Look for `✅ Connected to WhatsApp` in the deploy logs |

</details>

<details>
<summary><b>🟡 Koyeb</b> — Always-on free tier · Zero cold-starts · Global edge</summary>

<br>

| Step | Action |
|:----:|--------|
| **1** | [Fork the repo](https://github.com/SilvaTechB/silva-md-bot/fork) to your GitHub |
| **2** | Go to [app.koyeb.com](https://app.koyeb.com) → **Create App → GitHub** |
| **3** | Select your fork · Set **Run command** to `node silva.js` |
| **4** | Add `SESSION_ID`, `OWNER_NUMBER`, `BOT_NAME` under **Environment Variables** |
| **5** | Pick the region closest to you → click **Deploy** (~3 min) |
| **6** | Check the **Logs** tab for `✅ Connected to WhatsApp` |

</details>

<details>
<summary><b>🟠 Replit</b> — Browser IDE · Edit code live · Always-On deployments</summary>

<br>

| Step | Action |
|:----:|--------|
| **1** | Open or fork this project in Replit |
| **2** | Go to **Tools → Secrets** (lock icon in the sidebar) |
| **3** | Add `SESSION_ID`, `OWNER_NUMBER`, `BOT_NAME` as secrets |
| **4** | Hit the **Run** button — `node silva.js` starts automatically |
| **5** | Watch the Console for `✅ Connected to WhatsApp` |
| **6** | For 24/7 uptime → enable **Deployments → Always On** |

</details>

<details>
<summary><b>🔵 Talkdrove</b> — No coding needed · One-click · Beginner friendly</summary>

<br>

| Step | Action |
|:----:|--------|
| **1** | Open [host.talkdrove.com/share-bot/49](https://host.talkdrove.com/share-bot/49) |
| **2** | Click **Host This Bot** |
| **3** | Enter your `SESSION_ID` and `OWNER_NUMBER` |
| **4** | Click **Deploy** — your bot goes live instantly ✅ |

> No GitHub account or terminal required. Perfect for first-time bot owners.

</details>

<details>
<summary><b>💻 Local / VPS</b> — Full control · Custom plugins · Developer mode</summary>

<br>

**Requirements:** Node.js 20+ · Git · FFmpeg *(optional — for media conversion)*

```bash
# 1. Clone
git clone https://github.com/SilvaTechB/silva-md-bot.git
cd silva-md-bot

# 2. Install dependencies
npm install

# 3. Configure
cp config.env.example config.env
# Edit config.env — fill in SESSION_ID, OWNER_NUMBER, etc.

# 4. Run
node silva.js
```

**Keep it running 24/7 with PM2:**
```bash
npm install -g pm2
pm2 start silva.js --name silva-md
pm2 save && pm2 startup
```

**Update:**
```bash
git pull && npm install && pm2 restart silva-md
```

</details>

---

## ⚙️ Environment Variables

All variables can be set as environment secrets on your host, or in a `config.env` file locally.

### Core Settings

| Variable | Default | Description |
|----------|---------|-------------|
| `SESSION_ID` | **required** | WhatsApp session credentials (from session generator) |
| `OWNER_NUMBER` | auto | Your WhatsApp number with country code e.g. `254712345678` |
| `OWNER_NAME` | `Silva MD` | Your name shown in bot info |
| `BOT_NAME` | `Silva MD` | Bot display name shown in menus |
| `PREFIX` | `.` | Command prefix — single (`.`) or multi (`.` `,` `!`) |
| `MODE` | `public` | Who can use the bot: `public` · `private` · `group` · `inbox` |
| `THEME` | `silva` | Bot personality/theme — see [Themes](#-themes) |
| `DESCRIPTION` | `Silva MD Bot` | Caption in the bot menu |
| `PORT` | `5000` | HTTP port for the web dashboard |

### Auto-Status & Reactions

| Variable | Default | Description |
|----------|---------|-------------|
| `AUTO_STATUS_SEEN` | `true` | Auto-view all contacts' WhatsApp statuses |
| `AUTO_STATUS_REACT` | `true` | Auto-react to statuses with random emojis |
| `AUTO_STATUS_REPLY` | `false` | Auto-reply to statuses with a message |
| `AUTO_STATUS_MSG` | `Seen by Silva MD` | Message sent on auto status reply |
| `CUSTOM_REACT_EMOJIS` | `❤️,🔥,💯,😍,👏` | Comma-separated emojis for status reactions |
| `AUTO_REACT_NEWSLETTER` | `true` | React to newsletter/channel posts |

### Protection & Safety

| Variable | Default | Description |
|----------|---------|-------------|
| `ANTICALL` | `true` | Auto-reject all incoming WhatsApp calls + notify owner |
| `ANTIDELETE_GROUP` | `true` | Recover deleted messages in groups → forward to owner |
| `ANTIDELETE_PRIVATE` | `true` | Recover deleted messages in private → forward to owner |
| `ANTILINK` | `false` | Auto-remove links posted by non-admins in groups |
| `ANTIVV` | `true` | Auto-reveal view-once messages → forward to owner |
| `ANTI_BAD` | `false` | Detect and remove bad-word messages in groups |

### Behavior & Display

| Variable | Default | Description |
|----------|---------|-------------|
| `ALWAYS_ONLINE` | `true` | Keep bot shown as always online |
| `AUTO_TYPING` | `true` | Show typing indicator while processing a command |
| `AUTO_RECORDING` | `false` | Show recording indicator for media commands |
| `READ_MESSAGE` | `false` | Auto blue-tick all incoming messages |
| `ALIVE_IMG` | *(default)* | Image URL shown with the `.alive` command |
| `LIVE_MSG` | `Silva MD is active` | Text shown with the `.alive` command |
| `GREETING` | *(blank)* | Auto-greeting sent to DMs once per day (blank = off) |
| `DEBUG` | `false` | Enable verbose logging to console |

---

## ✨ Features

### 🛡️ Protection Suite

| Feature | Toggle | What it does |
|---------|--------|--------------|
| **Anti-Call** | `ANTICALL=true` or `.anticall on` | Rejects all incoming calls, sends caller a message, notifies owner |
| **Anti-Delete** | `ANTIDELETE_GROUP/PRIVATE=true` | Recovers deleted messages with full media, forwards to owner |
| **Anti-Link** | `.antilink on/off` | Removes links posted by non-admins in groups |
| **Anti-ViewOnce** | `ANTIVV=true` | Auto-opens view-once media and forwards it privately to owner |
| **Anti-Fake** | `.antifake` | Blocks users with unrecognized country codes |
| **Anti-Demote** | `.antidemote` | Re-promotes admins that were demoted without permission |
| **Anti-Flood** | `.antiflood` | Per-group configurable message flood protection |
| **Anti-Spam** | `.antispam` | Pattern-based spam detection and auto-removal |
| **Anti-Bot** | `.antibot` | Prevents other bots from operating in the group |

### 🎵 Media & Downloads

| Command | Description |
|---------|-------------|
| `.play` / `.music` / `.song` | Search YouTube → send audio as voice + downloadable MP3 |
| `.ytmp3 <url>` | Download YouTube audio by URL |
| `.ytmp4 <url>` / `.yt` / `.youtube` | Download YouTube video (max 10 min) |
| `.tiktok` / `.tt` | Download TikTok video without watermark |
| `.instagram` / `.ig` | Download Instagram reels and posts |
| `.facebook` / `.fb` | Download Facebook videos |
| `.lyrics` | Fetch song lyrics |
| `.apk` | Download APK from Play Store |
| `.tourl` / `.imgurl` | Upload media and get a shareable URL |
| `.gitclone` | Clone a GitHub repo as a zip file |

### 🤖 AI & Smart Tools

| Command | Description |
|---------|-------------|
| `.silva` / `.ask` / `.ai` | Chat with an AI assistant |
| `.tts` / `.speak` | Text-to-speech (19+ languages) |
| `.translate` / `.tr` | Translate text to any language |
| `.define` / `.dict` | Dictionary definition |
| `.weather` | Real-time weather lookup |
| `.wiki` / `.wikipedia` | Wikipedia search |
| `.qr` / `.qrcode` | Generate a QR code from any text |
| `.calc` / `.math` | Calculator |
| `.base64` / `.morse` | Encode / decode various formats |

### 👥 Group Management

| Command | Description |
|---------|-------------|
| `.kick` / `.remove` | Remove a group member |
| `.promote` / `.demote` | Change admin status |
| `.warn` | Issue a warning (auto-kick at 3 warnings) |
| `.tagall` / `.mentionall` | Mention all group members |
| `.hidetag` | Silent tag — notify without showing names |
| `.lock` / `.unlock` | Toggle who can send messages |
| `.antilink on/off` | Block links from non-admins |
| `.welcome` / `.goodbye` | Auto-messages when members join or leave |
| `.setname` / `.setdesc` | Change group name or description |
| `.poll` / `.vote` | Create a native WhatsApp poll |
| `.grouplink` / `.revoke` | Get or revoke the group invite link |

### 🎮 Games & Fun

| Command | Description |
|---------|-------------|
| `.rps` | Rock Paper Scissors |
| `.hangman` | Hangman word game |
| `.ttt` | Tic-Tac-Toe |
| `.trivia` | Random trivia question |
| `.8ball` | Magic 8-ball answer |
| `.scramble` | Word scramble game |
| `.joke` / `.dadjoke` | Random jokes |
| `.quote` / `.inspire` | Inspirational quotes |
| `.fact` / `.funfact` | Random interesting facts |

### 👑 Owner Tools

| Command | Description |
|---------|-------------|
| `.ban` / `.unban` | Ban users from using bot commands |
| `.broadcast` / `.bc` | Send a message to all chats |
| `.eval` / `.exec` | Run JavaScript code live |
| `.settings` / `.config` | View all current bot settings |
| `.theme` / `.settheme` | Change the bot theme/character |
| `.restart` | Restart the bot |
| `.sudo add/del/list` | Manage sudo users (owner-level access) |

---

## 📞 Anti-Call Feature

Anti-Call automatically handles all incoming WhatsApp calls so you never get disturbed.

**What it does:**
- Rejects every incoming call (voice and video) instantly
- Sends the caller a polite auto-reply message
- Sends you (the owner) a private alert with the caller's number and call type

**Enable/disable via environment variable:**
```
ANTICALL=true    # on by default
ANTICALL=false   # disable entirely
```

**Manage at runtime with bot commands** (owner only):
```
.anticall          → show current status
.anticall on       → enable protection
.anticall off      → disable protection
.anticall block <number>    → block a specific number from calling
.anticall unblock <number>  → unblock a number
```

---

## 🎨 Themes

Change the bot's personality with `.settheme <name>` or set `THEME=<name>` in your config.

| Theme | Character | Personality |
|-------|-----------|-------------|
| `silva` | Silva MD | Default — clean and professional |
| `naruto` | Naruto Uzumaki | Energetic, never give up spirit |
| `gojo` | Satoru Gojo | Confident, Jujutsu Kaisen |
| `itachi` | Itachi Uchiha | Calm and powerful |
| `goku` | Son Goku | Friendly, Dragon Ball energy |
| `luffy` | Monkey D. Luffy | Carefree, One Piece |
| `zerotwo` | Zero Two | Playful, Darling in the FranXX |
| `nezuko` | Nezuko Kamado | Gentle, Demon Slayer |
| `batman` | Batman | Dark and serious |
| `thanos` | Thanos | Philosophical, all-powerful |
| `friday` | FRIDAY | Iron Man AI assistant style |
| `edith` | EDITH | Tech-forward AI |
| `gideon` | Gideon | Arrow-verse AI |
| `ayanokoji` | Ayanokoji | Cold and calculated |
| `genos` | Genos | One Punch Man cyborg |
| `parker` | Peter Parker | Friendly neighborhood style |
| `adam` | Adam | Minimal and elegant |

---

## 🏗️ Project Structure

```
silva-md-bot/
├── silva.js          ← Main entry: WhatsApp connection + Express server
├── handler.js        ← Message router & command dispatcher
├── config.js         ← All environment variables in one place
├── app.json          ← Heroku deploy config + variable definitions
│
├── plugins/          ← 214 plugin files (1500+ commands), loaded dynamically
│   ├── anticall.js   ← Anti-call protection (reject + notify)
│   ├── antidelete.js ← Anti-delete (recover + forward)
│   ├── antilink.js   ← Anti-link (group link filter)
│   ├── antivv.js     ← Anti-ViewOnce (auto-reveal)
│   ├── music.js      ← YouTube audio download
│   ├── ytmp4.js      ← YouTube video download
│   ├── sticker.js    ← Sticker creator
│   ├── silva-agent.js← AI chat agent
│   └── ...           ← 206 more plugins
│
├── lib/
│   ├── theme.js      ← Theme engine + fmt() helper
│   └── statusManager.js ← Auto-status view/react logic
│
├── themes/           ← 19 theme JSON files (silva, naruto, gojo, etc.)
├── data/             ← Runtime JSON storage (warns, greet, sudo, etc.)
├── session/          ← WhatsApp multi-file auth state
├── smm/silva.html    ← Admin dashboard (served at port 5000)
└── utils/            ← delay, safeSend, warmupGroup helpers
```

---

## 🔧 Built With

<div align="center">

[![Node.js](https://img.shields.io/badge/Node.js_20-339933?style=for-the-badge&logo=nodedotjs&logoColor=white)](https://nodejs.org)
[![Baileys](https://img.shields.io/badge/Baileys-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://github.com/SilvaTechB/Baileys)
[![Express](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)](https://expressjs.com)
[![Sharp](https://img.shields.io/badge/Sharp-99CC00?style=for-the-badge&logo=sharp&logoColor=white)](https://sharp.pixelplumbing.com)
[![FFmpeg](https://img.shields.io/badge/FFmpeg-007808?style=for-the-badge&logo=ffmpeg&logoColor=white)](https://ffmpeg.org)

</div>

---

## 🤝 Connect With Silva

<div align="center">

[![WhatsApp Channel](https://img.shields.io/badge/WhatsApp_Channel-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://whatsapp.com/channel/0029VaAkETLLY6d8qhLmZt2v)
[![Support Group](https://img.shields.io/badge/Support_Group-25D366?style=for-the-badge&logo=whatsapp&logoColor=white)](https://chat.whatsapp.com/Ik0YpP0dM8jHVjScf1Ay5S)
[![Instagram](https://img.shields.io/badge/Instagram-E4405F?style=for-the-badge&logo=instagram&logoColor=white)](https://instagram.com/_its.silva)
[![Facebook](https://img.shields.io/badge/Facebook-1877F2?style=for-the-badge&logo=facebook&logoColor=white)](https://www.facebook.com/profile.php?id=100055490090211)
[![Twitter/X](https://img.shields.io/badge/X_(Twitter)-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/silva_african)

</div>

---

## 👨‍💻 Contributors

<div align="center">

| <img src="https://github.com/SilvaTechB.png?size=100" width="80" style="border-radius:50%"> | <img src="https://github.com/Sylivanu.png?size=100" width="80" style="border-radius:50%"> |
|:---:|:---:|
| **[Silva](https://github.com/SilvaTechB)** | **[CEO](https://github.com/Sylivanu)** |
| Creator & Lead Dev | Contributor |

</div>

---

## 🌍 Community

<div align="center">

[![Forkers](https://reporoster.com/forks/SilvaTechB/silva-md-bot)](https://github.com/SilvaTechB/silva-md-bot/network/members)
[![Stargazers](https://reporoster.com/stars/SilvaTechB/silva-md-bot)](https://github.com/SilvaTechB/silva-md-bot/stargazers)

</div>

---

## 📄 License

MIT License — free to use, modify, and distribute with attribution.

<div align="center">

**Built with purpose by [Silva Tech Inc](https://github.com/SilvaTechB)**

<img src="https://i.imgur.com/dBaSKWF.gif" height="20" width="100%">

<sub>Silva MD Bot — 1500+ commands. One scan. Unlimited possibilities.</sub>

</div>
