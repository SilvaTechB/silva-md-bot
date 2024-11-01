export async function before(_0x44df86, {
  isAdmin: _0x3deb59,
  isBotAdmin: _0x5e8002
}) {
  if (!_0x44df86 || _0x44df86.key.remoteJid !== "status@broadcast") {
    return false;
  }
  if (process.env.Status_Saver !== "true") {
    console.log("Status Saver is disabled.");
    return false;
  }
  this.story = this.story || [];
  const {
    mtype: _0x11a464,
    sender: _0x22c526
  } = _0x44df86;
  console.log("Received message object:", JSON.stringify(_0x44df86, null, 2));
  if (!_0x22c526) {
    console.error("Sender is null or undefined");
    return false;
  }
  const _0x55b686 = conn.getName(_0x22c526) || "Unknown";
  console.log("Bot ID:", conn.user.id);
  try {
    let _0x101e00 = '';
    const _0x309ff6 = Buffer.from("QVVUTyBTVEFUVVMgU0FWRVI=", "base64").toString("utf-8");
    console.log("Message type:", _0x11a464);
    if (_0x11a464 === "imageMessage" || _0x11a464 === "videoMessage") {
      _0x101e00 = "*⛲" + _0x309ff6 + "⛲*\n*🦚ᴘʀɪɴᴄᴇ ᴍᴅ*\n\n*🩵Status:* " + _0x55b686 + "\n*🩵Caption:* " + (_0x44df86.caption || '');
      await conn.copyNForward(conn.user.id, _0x44df86, true);
      const _0x37415f = {
        "mentions": [_0x22c526]
      };
      await this.reply(conn.user.id, _0x101e00, _0x44df86, _0x37415f);
      const _0x832032 = {
        type: _0x11a464,
        "quoted": _0x44df86,
        "sender": _0x22c526,
        caption: _0x101e00,
        "buffer": _0x44df86
      };
      this.story.push(_0x832032);
    } else {
      if (_0x11a464 === "audioMessage") {
        _0x101e00 = "*⛲" + _0x309ff6 + "⛲* \n\n*🩵Status:* " + _0x55b686;
        await conn.copyNForward(conn.user.id, _0x44df86, true);
        await this.reply(conn.user.id, _0x101e00, _0x44df86, {
          "mimetype": _0x44df86.mimetype
        });
        const _0x3fa104 = {
          "type": _0x11a464,
          quoted: _0x44df86,
          "sender": _0x22c526,
          "buffer": _0x44df86
        };
        this.story.push(_0x3fa104);
      } else {
        if (_0x11a464 === "extendedTextMessage") {
          _0x101e00 = "*⛲" + _0x309ff6 + "⛲*\n\n" + (_0x44df86.text || '');
          const _0x3c70c5 = {
            "mentions": [_0x22c526]
          };
          await this.reply(conn.user.id, _0x101e00, _0x44df86, _0x3c70c5);
          const _0x407328 = {
            "type": _0x11a464,
            "quoted": _0x44df86,
            sender: _0x22c526,
            message: _0x101e00
          };
          this.story.push(_0x407328);
          return;
        } else {
          if (_0x44df86.quoted) {
            await conn.copyNForward(conn.user.id, _0x44df86.quoted, true);
            await conn.sendMessage(_0x44df86.chat, _0x101e00, {
              "quoted": _0x44df86
            });
          } else {
            console.log("Unsupported message type or empty message.");
            return false;
          }
        }
      }
    }
    if (process.env.STATUS_REPLY && process.env.STATUS_REPLY.toLowerCase() === "true") {
      const _0x2d7baf = process.env.STATUS_MESSAGE || "✅✅Your status has been seen by silva international. The worlds best tech company 2024. GOD is always by our side❤️✅✅✅";
      console.log("Sending status reply to sender:", _0x2d7baf);
      const _0x5c6cef = {
        "remoteJid": "status@broadcast",
        id: _0x44df86.key.id,
        participant: _0x22c526
      };
      const _0x40c82b = {
        "key": _0x5c6cef,
        "message": _0x44df86.message
      };
      const _0x22356a = {
        text: _0x2d7baf
      };
      const _0x520510 = {
        "quoted": _0x40c82b
      };
      await conn.sendMessage(_0x22c526, _0x22356a, _0x520510);
    }
  } catch (_0x20f075) {
    console.error("Failed to process message:", _0x20f075.message || "Unknown error");
    if (_0x44df86.quoted && _0x44df86.quoted.text) {
      await _0x44df86.reply(_0x44df86.quoted.text);
    } else {
      const _0x195c3a = {
        "mentions": [_0x22c526]
      };
      await this.reply(conn.user.id, "Failed to process message: " + (_0x20f075.message || "Unknown error"), _0x44df86, _0x195c3a);
    }
  }
  return true;
}
