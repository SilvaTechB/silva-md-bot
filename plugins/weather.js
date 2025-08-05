const axios = require('axios');

module.exports = {
    name: 'weather',
    commands: ['weather', 'climate', 'mosam'],
    handler: async ({ sock, m, sender, args, contextInfo }) => {
        try {
            // Check if location is provided
            if (!args || args.length === 0) {
                return sock.sendMessage(sender, {
                    text: '*❌ Please provide a location to search*\nExample: .weather Nairobi',
                    contextInfo: contextInfo
                }, { quoted: m });
            }

            const location = args.join(' ');
            const apiKey = '060a6bcfa19809c2cd4d97a212b19273';
            const apiUrl = `https://api.openweathermap.org/data/2.5/weather?q=${location}&units=metric&appid=${apiKey}`;
            
            // Send loading message
            const loadingMsg = await sock.sendMessage(sender, {
                text: '⏳ Fetching weather data...',
                contextInfo: contextInfo
            }, { quoted: m });

            const response = await axios.get(apiUrl);
            const data = response.data;

            const name = data.name;
            const country = data.sys.country;
            const weatherDesc = data.weather[0].description;
            const temp = data.main.temp + "°C";
            const tempMin = data.main.temp_min + "°C";
            const tempMax = data.main.temp_max + "°C";
            const humidity = data.main.humidity + "%";
            const windSpeed = data.wind.speed + " km/h";
            const iconCode = data.weather[0].icon;
            const weatherIcon = `https://openweathermap.org/img/wn/${iconCode}@4x.png`;

            // Create formatted weather message
            const weatherMessage = `
🌍 *${name}, ${country} Weather Report*
⏰ ${new Date().toLocaleString('en-US', { timeZone: 'UTC' })}

🌡️ Temperature: ${temp}
📉 Min: ${tempMin} | 📈 Max: ${tempMax}
💧 Humidity: ${humidity}
💨 Wind: ${windSpeed}
🌤️ Conditions: ${weatherDesc.charAt(0).toUpperCase() + weatherDesc.slice(1)}

🔍 Search Query: ${location}
            `;

            // Delete loading message
            if (loadingMsg) {
                await sock.sendMessage(sender, {
                    delete: loadingMsg.key
                });
            }

            // Send weather information with icon
            await sock.sendMessage(sender, {
                image: { url: weatherIcon },
                caption: weatherMessage,
                contextInfo: {
                    ...contextInfo,
                    externalAdReply: {
                        title: "Silva MD Weather Service",
                        body: "Accurate weather information",
                        thumbnailUrl: "https://files.catbox.moe/5uli5p.jpeg",
                        sourceUrl: `https://openweathermap.org/city/${data.id}`,
                        mediaType: 1,
                        renderLargerThumbnail: true
                    }
                }
            }, { quoted: m });

        } catch (error) {
            console.error('Weather Plugin Error:', error);
            
            let errorMessage = '❌ Failed to fetch weather data. Please try again later.';
            if (error.response?.status === 404) {
                errorMessage = '❌ Location not found. Please check the name and try again.';
            } else if (error.response?.status === 401) {
                errorMessage = '⚠️ Weather service is currently unavailable.';
            }
            
            await sock.sendMessage(sender, {
                text: errorMessage,
                contextInfo: contextInfo
            }, { quoted: m });
        }
    }
};
