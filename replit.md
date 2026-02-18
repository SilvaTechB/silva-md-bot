# Silva MD Bot

## Overview
Silva MD Bot is a multi-functional WhatsApp bot built with Node.js and the Baileys library. It provides moderation, automation, media tools, and AI-powered features for WhatsApp groups and individual chats.

## Project Architecture
- **silva.js** - Main entry point. Starts Express server on port 5000, serves modern landing page, and spawns the bot process
- **sylivanus.js** - Core bot logic. Handles WhatsApp connection, message processing, plugin loading, and database management
- **handler.js** - Message handler that processes incoming messages and routes them to plugins
- **config.js** - Bot configuration (owner numbers, API keys, bot settings)
- **lib/makesession.js** - Session loader. Parses `Silva~<compressed_base64>` format, decompresses gzip, writes creds.json
- **silvaxlab/** - Plugin commands directory (257 plugins)
- **lib/** - Utility libraries (scrapers, converters, database adapters, etc.)
- **session/** - WhatsApp session credentials storage
- **jusorts/** - Static assets served by Express (landing page, images)
- **media/** - Media files (audio, images)

## Key Dependencies
- `gifted-baileys@2.0.6` - WhatsApp Web API (uses buffered event system with `conn.ev.process()`)
- `express` - Web server for landing page
- `pino` - Logging
- `chalk` - Terminal colors
- `figlet` - ASCII art banners
- `node-cache` - Caching
- `zlib` (built-in) - Session decompression

## Session Format
- SESSION_ID format: `Silva~<base64_gzip_compressed_creds>`
- The `lib/makesession.js` module handles parsing, decompressing, and saving session credentials
- When no SESSION_ID is set, QR code prints directly in the terminal for scanning

## Environment Variables
- `SESSION_ID` - WhatsApp session ID (format: Silva~base64data, get from session generator)
- `BOTNAME` - Bot display name
- `MODE` - Bot mode (public/private)
- `PREFIX` - Command prefix (default: .)
- `PORT` - Server port (default: 5000)
- `statusview` - Auto-view WhatsApp statuses (true/false)
- `autoRead` - Auto-read incoming messages (true/false)
- `AUTO_STATUS_LIKE` - Auto-like WhatsApp statuses (true/false)
- `AUTO_STATUS_LIKE_EMOJI` - Emoji used for status likes (default: 💚)
- `Status_Saver` - Save statuses to bot owner (true/false)
- `STATUS_REPLY` - Auto-reply to status posters (true/false)
- `STATUS_MSG` - Custom reply message for status viewers

## Running the Bot
The bot runs via `node silva.js` which:
1. Starts Express server on port 5000 with modern landing page
2. Spawns `sylivanus.js` as a child process
3. sylivanus.js loads session from SESSION_ID (Silva~ compressed format) or starts QR mode
4. QR code prints in terminal for WhatsApp pairing (no web QR page)
5. Loads all plugins from silvaxlab/ directory

## Security
- The bot includes a security check that verifies the package.json author name is "SILVA"
- Unauthorized copies will not start

## gifted-baileys Event System (CRITICAL)
- gifted-baileys uses an internal event buffering system (`makeEventBuffer` in Utils/event-buffer.js)
- When the bot is already authenticated, socket.js calls `ev.buffer()` on startup to buffer events during initial sync
- The buffer is only flushed when the `CB:ib,,offline` event fires (offline notifications handled)
- **MUST use `ev.process(handler)` pattern** - this hooks into the aggregate 'event' emitter which fires on buffer flush
- **DO NOT use `ev.on('messages.upsert', handler)`** - individual event listeners miss buffered events because the internal buffer consolidates events and dispatches via the 'event' aggregate event
- `ev.process()` returns an unsubscribe function that should be stored and called before re-registering
- `registerEventHandlers()` function in sylivanus.js sets up all event listeners via `ev.process()`
- On reconnect, the old process handler is unsubscribed (not `removeAllListeners` which destroys internal dispatch)
- Handler methods (conn.handler, conn.pollUpdate, etc.) are bound via `reloadHandler()` after initial import

## Recent Changes
- 2026-02-18: **CRITICAL FIX** - Switched from `ev.on()` to `ev.process()` pattern to fix message delivery
  - Root cause: gifted-baileys buffers events internally (socket.js calls ev.buffer() on auth)
  - ev.on() handlers never fired because buffered events only dispatch via aggregate 'event' event
  - ev.process() hooks directly into the aggregate event, receiving all events reliably
- 2026-02-18: Fixed reconnection to use unsubscribe pattern instead of removeAllListeners (which destroyed internal event dispatcher)
- 2026-02-18: Reduced log noise by filtering out presence.update from event batch logging
- 2026-02-18: Fixed endless reconnection loop by restricting welcome messages and newsletter auto-follows to first connection only
- 2026-02-18: Added code 440-specific longer backoff delays (10s increments up to 60s)
- 2026-02-18: Switched critical logging to process.stdout.write for child process reliability
- 2026-02-18: Removed duplicate connectionUpdate function that caused double-reconnection race condition
- 2026-02-18: Fixed QR mode startup - bot no longer returns early when no SESSION_ID is set
- 2026-02-18: Added welcome message on successful WhatsApp connection (sent to bot owner)
- 2026-02-18: Fixed session overwrite bug - makesession.js no longer overwrites creds.json on restart
- 2026-02-18: Disabled destructive clearsession() that was deleting pre-keys every 10 minutes
- 2026-02-18: Added lib/newsletter.js - auto-follows WhatsApp newsletters on connection open
- 2026-02-18: Removed all database dependencies (lowdb, MongoDB, CloudDBAdapter) - bot uses in-memory storage only
- 2026-02-18: Switched Baileys library from @fizzxydev/baileys-pro to gifted-baileys@2.0.6
- 2026-02-18: Updated makesession.js to use Silva~ compressed base64 session format

## Known Issues
- console.log output is buffered/lost in child process context - use process.stdout.write for critical logs

## User Preferences
- Project uses ES modules (type: "module" in package.json)
- Node.js 20+ required
- QR code should print in terminal, not on web page
- Landing page should show useful bot info (features, commands, stats)
