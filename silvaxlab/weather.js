const axios = require('axios');

const handler = {
  command: "weather",
  alias: ["forecast", "cuaca"],
  react: "🌤️",
  desc: "Get weather information for a city",
  category: "tools",

  execute: async ({ sock, message, args }) => {
    try {
      const city = args.join(" ").trim();
      const jid = message.key.remoteJid;

      if (!city) {
        return sock.sendMessage(jid, { text: "❌ Please provide a city name.\nExample: `.weather London`" }, { quoted: message });
      }

      // Using wttr.in for free, no-key weather data
      const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
      const data = res.data.current_condition[0];
      const location = res.data.nearest_area[0];

      const caption = `🌤️ *WEATHER REPORT: ${location.areaName[0].value.toUpperCase()}*

🌡️ *Temp:* ${data.temp_C}°C (${data.temp_F}°F)
☁️ *Condition:* ${data.weatherDesc[0].value}
💧 *Humidity:* ${data.humidity}%
💨 *Wind Speed:* ${data.windspeedKmph} km/h
🌅 *Sunrise:* ${res.data.weather[0].astronomy[0].sunrise}
🌇 *Sunset:* ${res.data.weather[0].astronomy[0].sunset}

📍 *Location:* ${location.areaName[0].value}, ${location.region[0].value}, ${location.country[0].value}`;

      await sock.sendMessage(jid, { text: caption }, { quoted: message });

    } catch (err) {
      await sock.sendMessage(message.key.remoteJid, { text: "❌ City not found or API error." }, { quoted: message });
    }
  }
};

module.exports = { handler };
