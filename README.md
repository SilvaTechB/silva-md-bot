<div align="center">

<img src="https://i.imgur.com/dBaSKWF.gif" height="20" width="100%">

<br>

[![Typing SVG](https://readme-typing-svg.demolab.com?font=JetBrains+Mono&weight=800&size=45&duration=3000&pause=800&color=FF00A6&center=true&vCenter=true&width=900&height=80&lines=SILVA+MD+BOT;Next-Gen+WhatsApp+Bot)](https://git.io/typing-svg)

<br>

<img src="https://i.imgur.com/RvEKtPJ.jpeg" alt="Silva MD Bot" width="280" style="border-radius: 20px;">

<br><br>

[![Stars](https://img.shields.io/github/stars/SilvaTechB/silva-md-bot?style=for-the-badge&logo=github&logoColor=white&labelColor=0d1117&color=FF00A6)](https://github.com/SilvaTechB/silva-md-bot/stargazers)
[![Forks](https://img.shields.io/github/forks/SilvaTechB/silva-md-bot?style=for-the-badge&logo=git&logoColor=white&labelColor=0d1117&color=6f42c1)](https://github.com/SilvaTechB/silva-md-bot/network/members)
[![Last Commit](https://img.shields.io/github/last-commit/SilvaTechB/silva-md-bot?style=for-the-badge&logo=github&logoColor=white&labelColor=0d1117&color=00d4aa)](https://github.com/SilvaTechB/silva-md-bot/commits)
[![License](https://img.shields.io/github/license/SilvaTechB/silva-md-bot?style=for-the-badge&logo=opensourceinitiative&logoColor=white&labelColor=0d1117&color=3b82f6)](LICENSE)

<br>

**A powerful, feature-rich WhatsApp bot with 90+ commands, AI integration, media tools, group management, and themed responses — built on Node.js and the Baileys library.**

<img src="https://i.imgur.com/dBaSKWF.gif" height="20" width="100%">

</div>

---

## ⚡ Deploy First — Pick Your Platform

> **Step 1 — Get your Session ID:**  [![Get Session](https://img.shields.io/badge/GET_SESSION_ID-1e293b?style=for-the-badge&logo=whatsapp&logoColor=25D366)](https://silva-session-selector.vercel.app/)
>
> **Step 2 — Choose a platform below and follow the guide:**

---

<details>
<summary><b>🟣 Heroku — Recommended for 24/7 uptime</b></summary>

<br>

> Heroku keeps your bot alive around the clock with zero manual management.

**Requirements:** Free Heroku account · GitHub account

1. **Fork** the repository — [![Fork](https://img.shields.io/badge/FORK_REPO-0d1117?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SilvaTechB/silva-md-bot/fork)
2. Go to [silva-md-fork-checker.vercel.app](https://silva-md-fork-checker.vercel.app/) and click **Deploy to Heroku**
3. Fill in the environment variables on the Heroku setup screen:
   - `SESSION_ID` — paste the session ID you got from the session generator
   - `OWNER_NUMBER` — your WhatsApp number with country code (e.g. `254712345678`)
   - `BOT_NAME` — whatever you want to call your bot
4. Click **Deploy App** and wait ~2 minutes
5. Go to **More → View Logs** to confirm the bot connected
6. Your bot is live ✅

**Keeping it awake:** Use [UptimeRobot](https://uptimerobot.com) to ping your Heroku URL every 5 minutes on a free dyno.

</details>

---

<details>
<summary><b>🚂 Railway — Fast deploy, generous free tier</b></summary>

<br>

> Railway gives you $5 free credits monthly — enough for 24/7 bot hosting.

1. **Fork** the repo: [![Fork](https://img.shields.io/badge/FORK_REPO-0d1117?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SilvaTechB/silva-md-bot/fork)
2. Go to [railway.app](https://railway.app) → **New Project → Deploy from GitHub repo**
3. Select your forked `silva-md-bot` repo
4. Click **Variables** → Add the following:

   | Variable | Value |
   |----------|-------|
   | `SESSION_ID` | Your session ID |
   | `OWNER_NUMBER` | Your number e.g. `254712345678` |
   | `BOT_NAME` | Your bot's name |
   | `PREFIX` | `.` (or your preferred prefix) |

5. Railway will auto-detect Node.js and deploy — watch the build logs
6. Once deployed, check logs for `✅ Connected to WhatsApp` ✅

</details>

---

<details>
<summary><b>🟡 Koyeb — Zero cold-start free hosting</b></summary>

<br>

> Koyeb's free tier keeps your bot running without sleeping.

1. **Fork** the repo: [![Fork](https://img.shields.io/badge/FORK_REPO-0d1117?style=for-the-badge&logo=github&logoColor=white)](https://github.com/SilvaTechB/silva-md-bot/fork)
2. Go to [app.koyeb.com](https://app.koyeb.com) → **Create App → GitHub**
3. Select your fork, set **Run command** to `node silva.js`
4. Under **Environment Variables**, add:
   - `SESSION_ID`, `OWNER_NUMBER`, `BOT_NAME`
5. Set **Region** to whichever is closest to you
6. Click **Deploy** — takes about 3 minutes
7. Check the **Logs** tab for the connected message ✅

</details>

---

<details>
<summary><b>🟠 Replit — Deploy directly in your browser</b></summary>

<br>

> Perfect if you want to see and edit the code while it runs.

1. Open this Repl or fork it in Replit
2. Go to **Tools → Secrets** and add:

   | Secret | Value |
   |--------|-------|
   | `SESSION_ID` | Your session ID |
   | `OWNER_NUMBER` | Your number e.g. `254712345678` |
   | `BOT_NAME` | Your bot's name |

3. Click the **Run** button — the workflow `node silva.js` starts automatically
4. Watch the Console for `✅ Connected to WhatsApp`
5. To keep it online 24/7, use **Replit Deployments** (Always-On) ✅

</details>

---

<details>
<summary><b>🔵 Talkdrove — One-click community hosting</b></summary>

<br>

> Easiest option — no GitHub or coding knowledge needed.

1. Visit the Talkdrove bot page: [![Talkdrove](https://img.shields.io/badge/OPEN_TALKDROVE-2196F3?style=for-the-badge&logo=whatsapp&logoColor=white)](https://host.talkdrove.com/share-bot/49)
2. Click **Host This Bot**
3. Enter your `SESSION_ID` and `OWNER_NUMBER`
4. Click **Deploy** — the bot goes live instantly ✅

</details>

---

<details>
<summary><b>💻 Local / Self-Hosted — Run on your own machine or VPS</b></summary>

<br>

> Best for full control, custom plugins, and development.

**Requirements:** Node.js 18+ · Git · FFmpeg (optional, for media features)

```bash
# 1. Clone the repository
git clone https://github.com/SilvaTechB/silva-md-bot.git
cd silva-md-bot

# 2. Install dependencies
npm install

# 3. Create your config file
cp config.env.example config.env
# Edit config.env and fill in your SESSION_ID, OWNER_NUMBER, etc.

# 4. Start the bot
node silva.js
```

**With PM2 (keeps it running after you close the terminal):**
```bash
npm install -g pm2
pm2 start silva.js --name silva-md
pm2 save
pm2 startup
```

**To update later:**
```bash
git pull
npm install
pm2 restart silva-md
```

</details>

---

## 🔑 How to Get a Session ID

You need a Session ID so the bot can connect to your WhatsApp account without scanning a QR code every time.

<details>
<summary><b>📱 Session ID setup guide</b></summary>

<br>

1. Open the session generator: [![Session Generator](https://img.shields.io/badge/OPEN_SESSION_GENERATOR-1e293b?style=for-the-badge&logo=whatsapp&logoColor=25D366)](https://silva-session-selector.vercel.app/)
2. Choose **QR Code** or **Pairing Code** method
3. Scan with WhatsApp → **Settings → Linked Devices → Link a Device**
4. Copy the `SESSION_ID` value shown on screen
5. Paste it into your platform's environment/secret variables as `SESSION_ID`

> ⚠️ **Keep your Session ID private.** It gives full access to your WhatsApp account. Never share it publicly.

**Session rules (important for stability):**
- On restart, only `creds.json` is replaced from the session — never delete `pre-key-*.json` or `session-*.json` files manually, this causes auth failures
- If the bot stops responding after a restart, regenerate your session ID from the generator above

</details>

---

## ✨ Features

<details>
<summary><b>📥 Media & Downloads</b></summary>

<br>

| Command | Description |
|---------|-------------|
| `.play` / `.music` | Download YouTube audio |
| `.yt` / `.youtube` | Download YouTube video |
| `.tiktok` / `.tt` | Download TikTok videos |
| `.instagram` / `.ig` | Download Instagram reels & posts |
| `.facebook` / `.fb` | Download Facebook videos |
| `.lyrics` | Fetch song lyrics |
| `.apk` | Download APK from Play Store |
| `.shorten` | Shorten any URL |
| `.tourl` / `.imgurl` | Upload media and get a link |
| `.gitclone` | Clone a GitHub repo as a zip |

</details>

<details>
<summary><b>🤖 AI & Smart Tools</b></summary>

<br>

| Command | Description |
|---------|-------------|
| `.ai` / `.gpt` | Chat with an AI assistant |
| `.tts` / `.speak` | Text-to-speech (19+ languages) |
| `.translate` / `.tr` | Translate text to any language |
| `.define` / `.dict` | Dictionary definition |
| `.weather` | Real-time weather lookup |
| `.wiki` / `.wikipedia` | Wikipedia search |
| `.qr` / `.qrcode` | Generate a QR code from any text |
| `.calc` / `.math` | Calculator |
| `.base64` / `.b64` | Encode / decode base64 |
| `.morse` | Morse code encoder/decoder |
| `.ip` | IP address lookup |
| `.virus` / `.scanurl` | Scan a URL for malware |

</details>

<details>
<summary><b>👥 Group Management</b></summary>

<br>

| Command | Description |
|---------|-------------|
| `.kick` / `.remove` | Remove a member |
| `.promote` / `.demote` | Change admin status |
| `.warn` | Issue a warning (auto-kick at 3) |
| `.warnlist` | View all active warnings |
| `.tagall` / `.mentionall` | Mention all members |
| `.hidetag` | Silent tag (notify without showing) |
| `.lock` / `.unlock` | Toggle send-message restriction |
| `.antilink on/off` | Block links from non-admins |
| `.welcome` / `.goodbye` | Auto-messages when members join/leave |
| `.setname` / `.setdesc` | Change group name or description |
| `.grouplink` / `.revoke` | Get or revoke group invite link |
| `.poll` / `.vote` | Create a native WhatsApp poll |
| `.antigm` | Block @everyone mass-mentions |

</details>

<details>
<summary><b>🛡️ Protection Suite</b></summary>

<br>

| Feature | Command | What it does |
|---------|---------|-------------|
| Anti-Delete | `.antidelete on/off` | Recovers deleted messages, forwards to owner with full media |
| Anti-Link | `.antilink on/off` | Removes links posted by non-admins in groups |
| Anti-Call | `.anticall` | Auto-rejects incoming calls (owner exempt) |
| Anti-Fake | `.antifake` | Blocks users with unrecognized country codes |
| Anti-@Everyone | `.antigm` | Deletes/warns/kicks users who mass-mention |
| Anti-Demote | `.antidemote` | Auto-restores demoted admins |
| Anti-ViewOnce | `ANTIVV=true` | Automatically forwards view-once media to you |
| Auto Status View | `AUTO_STATUS_SEEN=true` | Silently views all contact statuses |
| Auto Status React | `AUTO_STATUS_REACT=true` | Reacts to statuses with random emojis |

</details>

<details>
<summary><b>🎮 Fun & Games</b></summary>

<br>

| Command | Description |
|---------|-------------|
| `.joke` / `.jokes` | Random joke |
| `.quote` / `.inspire` | Inspirational quote |
| `.fact` / `.funfact` | Random interesting fact |
| `.riddle` | Random riddle |
| `.flip` / `.coin` | Flip a coin |
| `.dice` / `.roll` | Roll a dice |
| `.compliment` | Random compliment |
| `.bible` / `.verse` | Random Bible verse |
| `.numberfact` | Fact about any number |
| `.ascii` / `.art` | Text art generator |
| `.sticker` / `.s` | Create sticker from image or video |

</details>

<details>
<summary><b>👑 Owner Tools</b></summary>

<br>

| Command | Description |
|---------|-------------|
| `.ban` / `.unban` | Ban users from using bot commands |
| `.broadcast` / `.bc` | Send a message to all chats |
| `.eval` / `.exec` | Run JavaScript code live |
| `.settings` / `.config` | View all bot settings |
| `.theme` / `.settheme` | Change bot theme/character voice |
| `.setgreet` | Set auto-greeting for DMs |
| `.greeton` / `.greetoff` | Toggle daily auto-greeting |
| `.warn` | Warn group members |
| `.promote` / `.demote` | Manage group admins |
| `.owner` / `.creator` | Show owner contact info |

</details>

---

## ⚙️ Environment Variables

<details>
<summary><b>View all variables</b></summary>

<br>

| Variable | Description | Default |
|----------|-------------|---------|
| `SESSION_ID` | WhatsApp session credentials | **required** |
| `PREFIX` | Command prefix character | `.` |
| `BOT_NAME` | Display name for the bot | `Silva MD` |
| `OWNER_NUMBER` | Your WhatsApp number with country code | **required** |
| `OWNER_NAME` | Your name shown in bot info | `Silva MD` |
| `DESCRIPTION` | Caption for the bot menu | `Silva MD Bot` |
| `THEME` | Bot theme — `silva`, `naruto`, `gojo`, `batman`, [more](#-themes) | `silva` |
| `MODE` | Who can use the bot: `public`, `private`, `group`, `inbox` | `public` |
| `GREETING` | Auto-greeting for DMs (sent once per day) | *(blank = off)* |
| `AUTO_STATUS_SEEN` | Auto-view all statuses | `true` |
| `AUTO_STATUS_REACT` | Auto-react to statuses | `true` |
| `AUTO_STATUS_REPLY` | Auto-reply to statuses | `false` |
| `AUTO_STATUS_MSG` | Message used for auto status reply | `Seen by Silva MD` |
| `AUTO_REACT_NEWSLETTER` | React to newsletter/channel messages | `true` |
| `CUSTOM_REACT_EMOJIS` | Comma-separated emojis for status reactions | `❤️,🔥,💯,😍,👏` |
| `ANTIDELETE_GROUP` | Restore deleted messages in groups | `true` |
| `ANTIDELETE_PRIVATE` | Restore deleted messages in private | `true` |
| `ANTILINK` | Block links globally in all groups | `false` |
| `ANTIVV` | Auto-open view-once messages | `true` |
| `ALWAYS_ONLINE` | Show bot as always online | `false` |
| `AUTO_TYPING` | Show typing indicator while processing | `true` |
| `AUTO_RECORDING` | Show recording indicator for media commands | `false` |
| `READ_MESSAGE` | Auto blue-tick all messages | `false` |
| `ALIVE_IMG` | Image URL shown in `.alive` command | *(default)* |
| `LIVE_MSG` | Message shown in `.alive` command | `Silva MD is active` |
| `DEBUG` | Enable verbose logging | `false` |

</details>

---

## 🎨 Themes

<details>
<summary><b>Available themes — change with <code>.settheme &lt;name&gt;</code></b></summary>

<br>

Each theme gives the bot a different personality, name, and response style.

| Theme | Character | Style |
|-------|-----------|-------|
| `silva` | Silva MD | Default — clean and professional |
| `naruto` | Naruto Uzumaki | Energetic, ninja spirit |
| `gojo` | Satoru Gojo | Confident, Jujutsu Kaisen |
| `itachi` | Itachi Uchiha | Calm, powerful |
| `goku` | Son Goku | Friendly, Dragon Ball |
| `luffy` | Monkey D. Luffy | Carefree, One Piece |
| `zerotwo` | Zero Two | Playful, Darling in the FranXX |
| `nezuko` | Nezuko Kamado | Gentle, Demon Slayer |
| `batman` | Batman | Dark, serious |
| `thanos` | Thanos | Philosophical, powerful |
| `friday` | FRIDAY | AI assistant style |
| `edith` | EDITH | Tech-forward |
| `gideon` | Gideon | Arrow-verse AI |
| `adam` | Adam | Minimal, elegant |
| `ayanokoji` | Ayanokoji | Cold, calculated |
| `genos` | Genos | One Punch Man |
| `parker` | Peter Parker | Friendly neighborhood style |
| `suhail` | Suhail | Custom |

> **Set via command:** `.settheme gojo`
> **Set via config:** `THEME=gojo` in your secrets/env file

</details>

---

## 🏗️ Project Structure

<details>
<summary><b>Expand file layout</b></summary>

<br>

```
silva-md-bot/
├── silva.js            # WhatsApp connection, auto-status, event loop
├── handler.js          # Message routing, permissions, plugin dispatch
├── config.js           # All environment variables in one place
├── app.json            # Heroku deploy config + variable definitions
│
├── plugins/            # 90 command plugins (one file per feature)
│   ├── menu.js         # Help menu
│   ├── settings.js     # Bot settings panel
│   ├── greet.js        # Daily auto-greeting (on/off, once per day)
│   ├── warn.js         # Warning system (auto-kick at 3)
│   ├── antigm.js       # Anti-@everyone mass-mention
│   ├── antifake.js     # Block unrecognized country codes
│   ├── sticker.js      # Sticker creator
│   ├── silva-ai.js     # AI chat
│   ├── music.js        # YouTube audio
│   ├── tiktok.js       # TikTok downloader
│   ├── welcome.js      # Welcome / goodbye system
│   ├── warn.js         # Warning + auto-kick system
│   └── ...             # 78+ more plugins
│
├── lib/
│   ├── theme.js        # Theme engine + fmt() helper
│   └── ...
│
├── themes/             # Theme JSON files (silva, naruto, gojo, etc.)
│   └── silva.json
│
├── data/               # Runtime JSON storage (warns, greet, etc.)
│   ├── warns.json
│   └── greet.json
│
└── package.json
```

</details>

---

## 📋 Full Command List

<details>
<summary><b>All 90 commands by category</b></summary>

<br>

| Category | Commands |
|----------|---------|
| **Media** | `.play` `.music` `.yt` `.youtube` `.tiktok` `.tt` `.instagram` `.ig` `.facebook` `.fb` `.lyrics` `.apk` `.shorten` `.tourl` `.imgurl` `.gitclone` |
| **AI & Tools** | `.ai` `.gpt` `.tts` `.speak` `.translate` `.tr` `.define` `.dict` `.weather` `.wiki` `.qr` `.qrcode` `.calc` `.math` `.base64` `.b64` `.morse` `.ip` `.virus` `.scanurl` `.shazam` `.ascii` |
| **Stickers** | `.sticker` `.s` `.toaudio` `.tomp3` |
| **Group Management** | `.kick` `.remove` `.promote` `.demote` `.admin` `.unadmin` `.warn` `.unwarn` `.warnlist` `.tagall` `.mentionall` `.hidetag` `.silenttag` `.lock` `.unlock` `.antilink` `.welcome` `.goodbye` `.setname` `.setdesc` `.grouplink` `.revoke` `.poll` `.vote` `.antigm` |
| **Protection** | `.antidelete` `.anticall` `.antifake` `.antidemote` `.antivv` `.antilink` |
| **Fun** | `.joke` `.quote` `.inspire` `.fact` `.funfact` `.riddle` `.flip` `.coin` `.dice` `.roll` `.compliment` `.bible` `.verse` `.numberfact` |
| **Owner** | `.ban` `.unban` `.banlist` `.broadcast` `.bc` `.eval` `.exec` `.settings` `.config` `.theme` `.settheme` `.setgreet` `.getgreet` `.delgreet` `.greeton` `.greetoff` `.owner` `.creator` |
| **Utility** | `.menu` `.help` `.ping` `.alive` `.bot` `.botinfo` `.uptime` `.runtime` `.getjid` `.jid` `.profile` `.spp` `.getpp` `.remind` `.remindme` `.presence` `.typing` `.online` `.offline` `.react` `.afk` `.back` `.time` `.clock` `.currency` `.convert` `.country` `.ip` `.password` `.tempmail` `.viewonce` `.vv` |

</details>

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
[![Twitter](https://img.shields.io/badge/X_(Twitter)-000000?style=for-the-badge&logo=x&logoColor=white)](https://x.com/silva_african)

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

<sub>Silva MD Bot — 90 commands. One scan. Unlimited possibilities.</sub>

</div>
