# Silva MD Bot

## Overview
Silva MD Bot is a WhatsApp bot built with Node.js using the Baileys library. It features a plugin system with 80+ commands for media downloading, AI interactions, group management, protection, fun games, and more. Includes its own media API server for reliable YouTube/TikTok/Instagram downloads.

## Project Architecture
- **Runtime**: Node.js 20.x
- **Entry Point**: `index.js` (obfuscated) - starts HTTP health check server and bot
- **Bot Logic**: `silva.js` - main WhatsApp connection and message handling
- **Config**: `config.js` - bot configuration via environment variables
- **Plugins**: `silvaxlab/` directory - individual command plugins (80+)
- **Libraries**: `lib/` - utility functions (antidelete, status handler, events, logger, media API)
- **Media API**: `lib/mediaApi.js` - self-hosted Express API server on port 3001 for YouTube/TikTok/Instagram/Facebook downloads using yt-dlp

## Key Features
- **Auto Status View**: Automatically views all WhatsApp statuses (enabled by default)
- **Auto Status React**: Automatically likes/reacts to statuses with random emojis (enabled by default)
- **Anti-Delete**: Recovers deleted messages with media and forwards to owner (enabled by default, setup in setupEvents for reconnection support)
- **Newsletter Auto-Follow**: Automatically follows configured newsletters on connection
- **QR Code Auth**: Uses QR code for authentication, or SESSION_ID env var to restore sessions
- **Anti-Link**: Detects and removes link messages from non-admins in groups
- **Anti-Call**: Automatically rejects incoming calls (except from owner)
- **Anti-Spam**: Detects and warns spam behavior in groups
- **Welcome/Goodbye**: Configurable welcome and goodbye messages per group
- **Anti-Bot**: Detects and removes other bots from groups when enabled
- **Plugin System**: 90 commands loaded from `silvaxlab/` directory
- **Ephoto360**: Text-to-image effects with 20 styles (neon, fire, galaxy, etc.)
- **TextPro.me**: Text effect generator with 25 styles (matrix, toxic, lava, etc.)
- **Self-Hosted Media API**: Express server on port 3001 using yt-dlp for reliable media downloads
- **AI Chat**: GPT/AI integration for conversational AI
- **TTS**: Text-to-speech in 19+ languages
- **Fancy Text**: 10 Unicode font styles
- **Ban System**: Owner can ban/unban users from bot usage
- **Bug Sender**: 10 bug types (text bomb, emoji flood, blank bomb, zalgo, reverse, vcard bomb, contact array, forward flood, location spam, giant wall)
- **Sticker Maker**: Real sticker creation from images and videos using sharp + ffmpeg
- **Music/Video Player**: YouTube search + audio/video download via self-hosted API with external fallbacks
- **Video Download**: Dedicated YouTube video downloader
- **APK Download**: Search and download Android apps from Play Store
- **Profile Picture**: View anyone's profile picture
- **User Info (Whois)**: Detailed user info lookup with status, group role, etc.
- **Group Info**: Full group metadata display
- **Group Link**: Get group invite link
- **Set Group Picture**: Change group profile picture
- **Mute/Unmute**: Mute/unmute group chat
- **Everyone/Hidetag**: Tag all members without showing mentions
- **Fun & Games**: Truth/Dare, 8-Ball, Jokes, Riddles, Coin Flip, RPS, Love Meter, Facts, Quotes
- **Warn System**: 3-strike warning system that auto-kicks on 3rd warn
- **Polls**: Native WhatsApp poll creation
- **Announcement Mode**: Toggle group announcement mode
- **Group Description**: Set group description via command
- **List Admins**: Show all group admins
- **Revoke Link**: Reset group invite link
- **Interactive Menu**: Categorized command display with banner image

## Configuration
Environment variables:
- `SESSION_ID` - WhatsApp session credentials (required to connect)
- `PREFIX` - Command prefix (default: `.`)
- `BOT_NAME` - Bot display name
- `OWNER_NUMBER` - Bot owner's WhatsApp number
- `PORT` - HTTP server port (set to 5000 for Replit)
- `HOST` - Server host (set to 0.0.0.0)
- `AUTO_STATUS_VIEW` - Auto view statuses (default: true)
- `AUTO_STATUS_REACT` - Auto react to statuses (default: true)
- `ANTI_DELETE` - Anti-delete feature (default: true)
- `ANTI_CALL` - Auto-reject calls (default: true)
- `NEWSLETTER_IDS` - Comma-separated newsletter JIDs to auto-follow
- `AUTO_UPDATE` - Enable auto-update from GitHub (default: true)
- `UPDATE_REPO` - GitHub repo URL for updates (default: SilvaTechB/silva-md-bot)

## Running
The bot runs via `node index.js` which starts:
1. HTTP health check server on port 5000
2. Silva Media API server on port 3001 (internal)
3. WhatsApp bot connection via Baileys

## Technical Notes
- **Antidelete fix**: Setup moved to `setupEvents()` so it re-registers on every reconnection. Uses `currentSetupId` to prevent duplicate handlers from old sockets.
- **Media API**: Uses yt-dlp system binary as primary download method, falls back to external APIs. Auto-cleans temp files older than 10 minutes.
- **Package.json**: Uses `dgxeon-soket` (custom Baileys fork). Express added for API server.

## Recent Changes
- 2026-02-12: v3.5 - Fixed antidemote botAdmin check (LID format support). Fixed group event handler (unified welcome/goodbye systems). Made startup parallel (session + plugins load concurrently). Added ephoto360 plugin (20 effects). Added textpro.me plugin (25 effects). Updated menu with maker section. Total: 90 plugins.
- 2026-02-12: v3.4 - Fixed duplicate command responses (filter by message type 'notify', skip bot's own messages, removed overlapping built-in commands). Fixed music/video download (installed yt-dlp, improved media API with better error handling and additional fallback APIs). Added auto-update system that checks main GitHub repo (SilvaTechB/silva-md-bot) every 30 minutes for plugin and lib updates. New update plugin for manual updates.
- 2026-02-10: v3.3 - Replaced JSON health check with modern HTML dashboard (live uptime counter, plugin count, memory usage, protection status, bot config). Cleaned up obfuscated index.js.
- 2026-02-10: v3.2 - Created antibot plugin. Fixed ai.js/gpt.js command conflict (ai.js now only /^(ai)$/, gpt.js handles gpt/chatgpt/ask). Removed all broken templateButtons/sections code from alive.js, ping.js, menu.js (deprecated in modern Baileys). Rewrote start command with comprehensive info display (uptime, RAM, plugin count, protection status, quick start guide, banner image). Updated menu with all new plugins (warn, poll, announce, gdesc, admins, revoke, antibot, setwelcome, setgoodbye). Reduced status handler log verbosity. Total: 87 plugins.
- 2026-02-10: Major upgrade v3.1 - Fixed antidelete, created self-hosted Media API server, enhanced bug plugin, added 10 new plugins, updated menu. Total: 80 plugins.
- 2026-02-10: Fixed sticker plugin, music plugin, added 9 fun plugins. Total: 70 plugins.
- 2026-02-09: Speed & fix update, ban system, antilink, anticall, bug plugin. Total: 61 plugins.
- 2026-02-09: Fixed command handling, antidelete, added 13 new plugins. Total: 55+ plugins.
- 2026-02-08: Initial Replit setup
