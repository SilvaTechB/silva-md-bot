const fs = require('fs');
// Load .env first (standard dotenv), then config.env (overrides .env if both exist)
if (fs.existsSync('.env')) require('dotenv').config({ path: './.env' });
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env', override: true });

function toBool(val, defaultOn = true) {
    if (val === undefined || val === null || val === '') return defaultOn;
    return val.toLowerCase() !== 'false';
}

module.exports = {
    SESSION_ID:            process.env.SESSION_ID || "Silva~H4sIAAAAAAAAA5VW21LbSBD9l3lNVzLdc3cVVWsM4ZIYzC3X4kG2xrbAloUkQ0yKf9/qkQl52M2yVFGY0WjO6dPn9PinKFdFEz/Ejej9FFVd3Gdt5I/tpoqiJ3bX02msBYg8azPR+45aA2kLpACNAmNBOUDrQTtA4wG9AdIe0BI4C6gIUCtAQAWEDkgSGA2oAxA5IKXSdm+BMAA6D84DOg2kDKAFL6+fQFTr8aKY/ImWc4COgMgCH6kUpCW1ZUQEyL/BgCZAiRAYmEmARkDpALVJJJUBYoakU12IARwCSSBUgEECOgQbwNL1E1PLirooZ/vVPC5jnS0+xM0oK+pXqqlsOjYBogREB0gKSAZAqQE9AqEHJFZXApIHT4DWAvoAhJi6QOSBDAE6Cy6AMYBBgeUHBrwCbpoJgMqlrUjqVaKyalw6MmJICN5DYFwLPiQxSG77apO41kEwiRtK34GxhrxmntvQGYQ7xWVyOcEDsY28BK+Sqk0xK2N+lMeyLdrN691pCChVnSA1cwRERkdAFpIFVQhKQkCwMnU9SGCeGlBtuTs2uEwFOvYJeK6U7Ur8ngRLEF7pTLZ2ah2wITWgkxA6mVxnfm4h24wN6JMJFRsTwVGiaJFtyrVxqjBoYIqduR2/o5OjmZz1v8k3qp9zfft/TKkIGJslYX4aiCQEIA4OR0CxqjbBpsK28eFkaN3VZZMHmaNUPAaUAyapNGsQDCQvuM7WaF+dcMuI3EgeIaR0kiVwBnSKC/vSYWKZnC/TuOFVTCwNcHAssdLGJutJ9oQH5G4r27kzneRBvWiZtev6T5KRlN0QVOwXi2DZ0T4R246khBRMCovmsDg2nfIdnFTgkY2IFED7JB/3wQPxePISUIIFZugR0Br2ExJ2MtqQtqQOhWSnoDv5sUto6pvrcFB2AU67mR9bR1PigTzZKXQAIYBRXBKGbpZT4E7dxs1RLnr4BKKOs6Jp66wtVmVa0wFElt9fxEkd2+Q98WXyeViOLuT4g1EP/Zvjo1X+5c2n+rxYvlct9u/yWtFJfTaffvu6I0BU9WoSmybmh0XTrurNMDZNNouN6H2/BlHGH23naoZTCGJa1E17Va6rxSrLny3//DCbTFbrsr3YlJMBf4i16MmX5di2RTlruK/rMqsn8+I+DuZZ24jeNFs08VeFsY75du3X2/xWHtusWDSiJwajpdQn/mD/eG89C5ODg92jWX8w64sXtGcbdbK8qS5Xm1Bt2sfT/GZ6eud+XN7PdKvXn8xSj9WdGR8sm+mgWswfdv7hENETk+HZ8NPucDi+8qer7GF4J/f35gdh8e7udnG7yq8uB3uXfTqePJ48jg6/LnR8l5vdVX1zcSvX5fnYLD+bk7acu1Exi1+PHsYXy0Psn+0wWh7vi0n8HWy4f2LPyqtju94M3LjNw8ntRsp4OH5Q++3Vx3Ixrh6XN+2dn36hwbtZ/VnOvs1pdDVef8T5wRt7fx52B/FyJHfn+fnZfPJe7lXz2c6OeAKxTMkqctETpEnaYJ1C0j0V/mrePnA/sqp6W8ZWgFh024x3UinyxiqFgXfyg+ewLrb3RpFsw0fzv9MipgFYZgz431CdCGwl+QS/nbEdqf8yCUw3E/mC4/ym25G/RPBdroCHl+FbgCOn0lVAPOu7P6iwm64k00XAIZbb64xv+zTwQvfFhgeZc0BadvE3Eojn1TWIapG101W9FD1RVPNVGQWIerVmrx+V09UfyHsg8GDSYOKoL7Km7b9k6LJYxqbNlpXooQsKyfMcEctNv6ou2qx9jp7o88/wbiye/gb2+lfaXwoAAA==",
    // PREFIX supports comma-separated list: ".,!,/,?"
    // Use "any" to accept any leading symbol, or "" / "none" for no prefix
    PREFIX:                process.env.PREFIX || ".",
    BOT_NAME:              process.env.BOT_NAME || "Silva MD",
    OWNER_NUMBER:          process.env.OWNER_NUMBER || "24269673124",
    OWNER_NAME:            process.env.OWNER_NAME || "Silva MD",
    DESCRIPTION:           process.env.DESCRIPTION || "Silva MD Bot",
    ALIVE_IMG:             process.env.ALIVE_IMG || "https://files.catbox.moe/5uli5p.jpeg",
    LIVE_MSG:              process.env.LIVE_MSG || "Silva MD is active",
    MODE:                  process.env.MODE || "both",
    AUTO_STATUS_SEEN:      toBool(process.env.AUTO_STATUS_SEEN,      true),
    AUTO_STATUS_REACT:     toBool(process.env.AUTO_STATUS_REACT,     true),
    AUTO_STATUS_REPLY:     toBool(process.env.AUTO_STATUS_REPLY,     false),
    AUTO_STATUS_MSG:       process.env.AUTO_STATUS_MSG || "Seen by Silva MD",
    CUSTOM_REACT_EMOJIS:   process.env.CUSTOM_REACT_EMOJIS || "❤️,🔥,💯,😍,👏,💙,🙌",
    Status_Saver:          process.env.Status_Saver  || process.env.STATUS_SAVER  || 'false',
    STATUS_REPLY:          process.env.STATUS_REPLY  || 'false',
    STATUS_MSG:            process.env.STATUS_MSG    || 'SILVA MD 💖 SUCCESSFULLY VIEWED YOUR STATUS',
    READ_MESSAGE:          toBool(process.env.READ_MESSAGE,          false),
    AUTO_REACT_NEWSLETTER:   toBool(process.env.AUTO_REACT_NEWSLETTER,   true),
    ANTI_BAD:              toBool(process.env.ANTI_BAD,              false),
    ALWAYS_ONLINE:         toBool(process.env.ALWAYS_ONLINE,         true),
    AUTO_TYPING:           toBool(process.env.AUTO_TYPING,           true),
    AUTO_RECORDING:        toBool(process.env.AUTO_RECORDING,        false),
    DELETE_LINKS:          toBool(process.env.DELETE_LINKS,          false),
    ANTIDELETE_GROUP:      toBool(process.env.ANTIDELETE_GROUP,      true),
    ANTIDELETE_PRIVATE:    toBool(process.env.ANTIDELETE_PRIVATE,    true),
    ANTILINK:              toBool(process.env.ANTILINK,               false),
    ANTICALL:              toBool(process.env.ANTICALL,               true),
    ANTIVV:                toBool(process.env.ANTIVV,                 true),
    DEBUG:                 toBool(process.env.DEBUG,                 false),
    THEME:                 (process.env.THEME || 'silva').toLowerCase().trim(),
    GREETING:              process.env.GREETING || '',
    APP_URL:               process.env.APP_URL || '',
    INSTAGRAM_SESSION:     process.env.INSTAGRAM_SESSION || '',
};
