# Silva MD Bot

A modular WhatsApp bot built with Baileys (multi-device), featuring an admin dashboard web interface.

## Architecture

- **Runtime**: Node.js 20
- **Entry point**: `silva.js`
- **Web dashboard**: `smm/silva.html` — served via Express at port 5000
- **Plugins**: `plugins/` directory — loaded dynamically on start
- **Config**: `config.js` reads from `config.env` (if present) or environment variables
- **Session storage**: `session/` directory (multi-file auth state)

## Key Components

| File/Dir         | Purpose                                         |
|------------------|-------------------------------------------------|
| `silva.js`       | Main entry — connects to WhatsApp, runs Express |
| `handler.js`     | Message handler & command dispatcher            |
| `config.js`      | Config reader (env vars / config.env)           |
| `plugins/`       | Individual feature plugins (commands)           |
| `lib/`           | Shared utilities and functions                  |
| `utils/`         | Delay, safeSend, warmupGroup helpers            |
| `smm/silva.html` | Admin dashboard (served as static file)         |

## Environment Variables

See `sample.env` for the full list. Key ones:

- `SESSION_ID` — WhatsApp session (required). Format: `Silva~<base64-gzip>`
- `OWNER_NUMBER` — Bot owner's WhatsApp number
- `PREFIX` — Command prefix (default `.`)
- `MODE` — `public`, `private`, or `both`
- `PORT` — HTTP server port (set to `5000` for Replit)

## Workflow

- **Command**: `node silva.js`
- **Port**: 5000 (Express web dashboard)
- **Output type**: webview

## Deployment

- **Target**: VM (always-running — maintains WhatsApp connection)
- **Run**: `node silva.js`

## Plugin System

All 31 plugins use a unified shape:
```js
{ commands, description, permission, group, private, run(sock, message, args, ctx) }
```

**Permission tiers:**
- `public` — any user
- `admin` — group admins + owner
- `owner` — bot owner only

**ctx object keys:** `sock, conn, m, message, sender, jid, chat, isGroup, isAdmin, isBotAdmin, isOwner, args, text, prefix, groupMetadata, contextInfo, mentionedJid, safeSend, reply`

## Installed Plugins (33)

| Plugin | Commands | Permission |
|--------|----------|------------|
| afk | afk, back | owner |
| anticall | anticall | owner |
| antidelete | antidelete, antidel | owner |
| antidemote | antidemote | admin |
| apk | apk, apkdl, getapk | public |
| autoreply | autoreply, ar | admin |
| blocklist | blocklist, listblock | owner |
| call | call, support, ss | public |
| catbox | tourl, imgtourl, imgurl, geturl, upload | public |
| facebook | facebook, fb, fbdl | public |
| getpp | spp, profile, getpp | public |
| gitclone | gitclone | public |
| hello | hello | public |
| instagram | instagram, igdl, ig, insta | public |
| menu | menu, help, list | public |
| music | play | public |
| repo | repo, repository, github | public |
| shazam | shazam, identify, song | public |
| silva-ai | ai, gpt, chatgpt | public |
| silva-getjid | getjid, jid | public |
| silva-owner | owner, creator | public |
| silva-ping | ping | public |
| silva-shorturl | shorten | public |
| silva-uptime | uptime, runtime | public |
| statussave | save, nitumie, statussave | public |
| sticker | sticker, s | public |
| test | test, botdemo, features | public |
| testhandler | testhandler | owner |
| tiktok | tiktok, tt, ttdl, tiktokdl | public |
| viewonce | vv, antivv, avv, viewonce, open, openphoto, openvideo, vvphoto | owner |
| virus | scanurl, urlscan, checksafe | public |
| weather | weather, climate, mosam | public |
| yt | yt, youtube | public |

## Notes

- The bot requires a `SESSION_ID` secret to connect to WhatsApp. Without it, the web dashboard still runs but the bot won't connect.
- Session data is stored in the `session/` directory.
- Baileys: `@whiskeysockets/baileys@6.7.21` — direct stable release (no alias)
- `config.OWNER_NUMBER` is set dynamically on `connection.update → open` from `sock.user.id` — no need to hardcode it.
- `handler.js` exports: `handleMessages, safeSend, setupConnectionHandlers, PERM, plugins`
- Anti-delete (`messages.update` + `messages.delete`) always forwards recovered/edited messages to owner JID only.
- Anti-demote: `group-participants.update` listener re-promotes demoted admins in groups tracked by `global.antiDemoteGroups` (Set).
- AFK auto-reply fires before prefix check for non-owner messages; owner messages bypass it so `.back` always works.
