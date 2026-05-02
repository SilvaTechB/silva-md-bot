const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function toBool(val, defaultOn = true) {
    if (val === undefined || val === null || val === '') return defaultOn;
    return val.toLowerCase() !== 'false';
}

module.exports = {
    SESSION_ID:            process.env.SESSION_ID || "Silva~H4sIAAAAAAAAA5VW607bSBR+lWr+clTmnLlHQtoQCARKS8utpeKHE0+M2+AE2wmkFdJqX2FfdB9hdcZQqpW2ywpZOM7kzHe+yxl/F9W8bOJhXIved7Goy1XWRr5t14soemJ7OZ3GWoDIszYTvc+KANEBelCAxgGRBuRLGiAiQF7gEBADoApACsEoQOWAlAWSGlADegNoFZAElAhoAxD/Rw9apnrGgzXgPXhz9QBisRzPyskvcGkDxBem7choQKWAKAAiQ2YIBlDzpXkTYnDoO+AJPC/3YCWgNam3wC0ieA3I9Vy3TmrQCGg8INqrBwaXlXVZFbuL63gT62x2GNfHWVm/jFAMxGwSalDMBiPqKA4S0BAgEXiVoHsNQSfiLAJ6ArSsgATUEqxKwJ1PnHcicbeK6xqbdiCDYP2LCEWVtHjsnbnUAZQFoyEwEwFIW0AngZhQZoxBYuKbjAFk0FIBJmKxk97x/sAe8a5TwzhA6YBA6URmUxZVzEd5rNqyXb/Yl2lXrkfIEJnVhMVA6FBiCIzSWW4iOVYh6MR9Qs28SctcMUZMjjX8zKdGCVBb1sE6sC+zJLGeaEEBKZ/aNwq0TrbSHjyg9WADQ0raPVqU2QKSBJQMTGAJlGdUbEZktYODgEBogZEpZlD+RN5x/ZTnr//biVonISltxZcFpToneZadWSVlwDKrnb34InIJLz8yNnGuCGTCTyb5h8OdVOd0SZ1aRIkvotJ5MCbpQ7YzF5MWUtz5I0uadA7gMaF1CJwd1t+AC4BMqGZIltICToROU4ANyvWIgZIC82zErF3Wv6TMuS4GxFhc17sELs3yytSkMt0ccgQpFpYjQJwWtClIHExFyW2e3cFpYTt41eUW+Y5JZrsmrwIy3xwoGwAtMRc8NnjKkgHejW85VzyaLbtcEwcjASZAXk6cTi9TWFhPr9NPOPkpIBYhOf1rXI9y0cMHEHUsyqats7acV/zMaxBZvjqJkzq2yXTi3oyL6dfTYb1t4u1edbd999H4mdycNnufqrNhPu8Hd/6pXe7nxZYAsajnk9g0Md8vm3Zer49i02RFbETv8xWIKt63nZ15N4UgpmXdtGfVcjGbZ/mT15++zCaT+bJqT9bVZMA3sRY9+fw4tm1ZFQ0LuqyyenJdruLgOmsb0Ztmsyb+aDDWMRe9tl7GH9N9MM/ZAcGaE2PsqQBxk5xR5qInSGknjVM+eEs9Tb81r++4brZYvK5iK0BUGS8Xw6y9jvWr+fRVfzb7688/fhcgZqmEQW0pKOPQBJVq8POHH+B5rzy2WTlrRE8MRjvD60/Fzu6x20bv9/b6RdEfFH3x3OyTfTtVlqcb7fbppWn8+/WqqXHz8vbucjIaZbKZfJn73fOP83b9dme1c5pU+WcR0RONvdXq5P1482iVDz+s+9d4cjyuig3/TRV+W1X5Gdn7cHAUDt5cHCyGZ4f3+t3ZZnH05psaLy8kleN8356P7OBbrWKfZHW8eT3ob/FueVyVk/jzZquNO3Nb6aE3/dm7UX918X64uxwvztaDeD8v7tTJ8sKf3zVxdLA43Pxy+uHj/hsZvozQZ8cDIw+azcPx5N3kvsbj2duwfTkkXWwMiq0t8RTs2eMJUyansYz8cVrGNCwf1fpvWTvkbD/5AD8VeZy//zI2TJpAPPCdApPOK448j6lgwch09qcjgF9peFKk9w/bvSwFzWeHdDxsiU8vSiNYAw9pIj7lSMru5OLxxlPk6uHhCsRilrXTeX3Dat6MMwGini85EqNqOv8FXs9FfPpLA2GWNW3/OWqn5U1s2uxmIXronHOEVtqHvwGapudMWgoAAA==",
    // PREFIX supports comma-separated list: ".,!,/,?"
    // Use "any" to accept any leading symbol, or "" / "none" for no prefix
    PREFIX:                process.env.PREFIX || ".",
    BOT_NAME:              process.env.BOT_NAME || "Silva MD",
    OWNER_NUMBER:          process.env.OWNER_NUMBER || "2347057389862",
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
    ANTIVV:                toBool(process.env.ANTIVV,                 true),
    DEBUG:                 toBool(process.env.DEBUG,                 false),
    THEME:                 (process.env.THEME || 'silva').toLowerCase().trim(),
    GREETING:              process.env.GREETING || '',
    APP_URL:               process.env.APP_URL || '',
};
