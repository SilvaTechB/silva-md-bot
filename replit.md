# Silva MD Bot

## Overview
Silva MD Bot is a multi-functional WhatsApp bot built with Node.js and the Baileys library. It provides moderation, automation, media tools, and AI-powered features for WhatsApp groups and individual chats.

## Project Architecture
- **silva.js** - Main entry point. Starts Express server on port 5000, serves modern landing page, and spawns the bot process
- **sylivanus.js** - Core bot logic. Handles WhatsApp connection, message processing, plugin loading, and database management
- **handler.js** - Message handler that processes incoming messages and routes them to plugins
- **config.js** - Bot configuration (owner numbers, API keys, bot settings)
- **lib/makesession.js** - Session loader. Parses `Silva~<compressed_base64>` format, decompresses gzip, writes creds.json
- **silvaxlab/** - Plugin commands directory (232+ plugins)
- **lib/** - Utility libraries (scrapers, converters, database adapters, etc.)
- **session/** - WhatsApp session credentials storage
- **jusorts/** - Static assets served by Express (landing page, images)
- **media/** - Media files (audio, images)

## Key Dependencies
- `@whiskeysockets/baileys` - WhatsApp Web API (uses buffered event system with `conn.ev.process()`)
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
- `statusview` - Auto-view WhatsApp statuses (must be exactly "true" to enable)
- `autoRead` - Auto-read incoming messages (must be exactly "true" to enable)
- `AUTO_STATUS_LIKE` - Auto-like WhatsApp statuses (must be exactly "true" to enable)
- `AUTO_STATUS_LIKE_EMOJI` - Emoji used for status likes (default: heart)
- `Status_Saver` - Save statuses to bot owner (must be exactly "true" to enable)
- `STATUS_REPLY` - Auto-reply to status posters (must be exactly "true" to enable)
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

## Baileys Event System (CRITICAL)
- Baileys uses an internal event buffering system (`makeEventBuffer` in Utils/event-buffer.js)
- When the bot is already authenticated, socket.js calls `ev.buffer()` on startup to buffer events during initial sync
- The buffer is only flushed when the `CB:ib,,offline` event fires (offline notifications handled)
- **MUST use `ev.process(handler)` pattern** - this hooks into the aggregate 'event' emitter which fires on buffer flush
- **DO NOT use `ev.on('messages.upsert', handler)`** - individual event listeners miss buffered events
- `ev.process()` returns an unsubscribe function that should be stored and called before re-registering
- `registerEventHandlers()` function in sylivanus.js sets up all event listeners via `ev.process()`
- On reconnect, the old process handler is unsubscribed (not `removeAllListeners` which destroys internal dispatch)
- The emit interceptor uses `_silvaPatched` flag to prevent stacking on reconnection
- Handler methods (conn.handler, conn.pollUpdate, etc.) are bound via `reloadHandler()` after initial import

## Stability Features
- **Handler timeout**: Plugin execution is wrapped in a 60-second timeout to prevent hanging
- **Watchdog**: Heartbeat monitor every 60s checks if handler is bound, rebinds automatically if missing
- **Emit interceptor guard**: `_silvaPatched` flag prevents emit wrapper from stacking on reconnection
- **processedMsgIds cleared on reconnect**: Prevents missing messages after reconnection
- **Handler auto-rebind**: If handler becomes null while connected, it's automatically rebound
- **Memory management**: Automatic cache clearing when heap exceeds 300MB
- **Error boundaries**: All event handlers wrapped in try/catch to prevent one error from breaking others

## Recent Changes
- 2026-02-19: Added global contextInfo forwarding to all bot messages
  - All messages sent by the bot now appear forwarded from "Silva Tech Nexus" newsletter
  - Wrapped both sendMessage and relayMessage in lib/simple.js to inject contextInfo globally
  - Added auto-react (🔥) to all messages posted in channel 120363200367779016@newsletter
  - Further log cleanup: silenced reactionMessage, empty messages, newsletter/lid messages
- 2026-02-19: Major log noise reduction
  - Removed verbose message boxes (RAW-EMIT, DEBUG-HANDLER) - replaced with single-line [MSG] format
  - Silenced status broadcast messages and protocolMessage from logs
  - Made heartbeat conditional (only logs when connected, high memory, or handler missing)
  - Silenced newsletter follow errors and self-test logs
  - Removed duplicate QR/IPC messages from parent process (silva.js)
  - Fixed duplicate bot instances: removed restart-on-exit handler, added 5s delay before restart
  - Fixed welcome message showing "undefined" name - now falls back to "Boss"
  - Fixed senderName crash in handler.js after debug log cleanup
- 2026-02-19: Fixed autoread bug - was reading messages even when autoRead was set to "false"
  - Root cause: `if (process.env.autoRead)` is truthy for ANY non-empty string including "false"
  - Fix: Changed to strict `=== 'true'` comparison in both handler.js and sylivanus.js
  - Same fix applied to statusview env variable
- 2026-02-19: Major stability improvements to prevent bot from stopping responding
  - Added 60s timeout on handler execution to prevent plugin hangs from blocking all messages
  - Fixed emit interceptor stacking with `_silvaPatched` guard flag
  - Added watchdog that auto-rebinds handler if it becomes null while connected
  - Added handler auto-rebind on connection open
  - Clear processedMsgIds on reconnect to prevent missing messages
  - Wrapped all event handlers in try/catch for isolation
  - Enhanced heartbeat with memory, message count, and last message time tracking
- 2026-02-19: Cleaned up project - removed Docker, Heroku, Render, Koyeb deployment files
  - Deleted: docker-compose.yml, heroku.yml, Procfile, render.yaml, CNAME, koyeb.js, server.js
  - Deleted: app.json, auth_info.json, talkdrove.json, sample.env, silva.html
  - Deleted: CODE_OF_CONDUCT.md, CONTRIBUTING.md, SECURITY.md, CODEOWNERS
  - Added .gitignore for node_modules, session, temp, .cache, .env
- 2026-02-18: Switched from `ev.on()` to `ev.process()` pattern to fix message delivery
- 2026-02-18: Fixed reconnection to use unsubscribe pattern
- 2026-02-18: Fixed endless reconnection loop
- 2026-02-18: Removed all database dependencies - bot uses in-memory storage only

## Known Issues
- console.log output is buffered/lost in child process context - use process.stdout.write for critical logs

## User Preferences
- Project uses ES modules (type: "module" in package.json)
- Node.js 20+ required
- QR code should print in terminal, not on web page
- Landing page should show useful bot info (features, commands, stats)
- User wants maximum stability - bot should recover from any error and keep responding
