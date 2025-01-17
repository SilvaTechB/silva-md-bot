const axios = require('axios');

const getBuffer = async (url, options) => {
  try {
    options = options || {};
    const response = await axios({
      method: "get",
      url: url,
      headers: {
        'DNT': 1,
        'Upgrade-Insecure-Request': 1,
      },
      ...options,
      responseType: "arraybuffer",
    });
    return response.data;
  } catch (error) {
    console.error(error);
  }
};

const getGroupAdmins = (participants) => {
  const admins = [];
  for (const participant of participants) {
    if (participant.admin !== null) {
      admins.push(participant.id);
    }
  }
  return admins;
};

const getRandom = (suffix) => {
  return `${Math.floor(Math.random() * 10000)}${suffix}`;
};

const formatNumber = (number) => {
  const units = ['', 'K', 'M', 'B', 'T', 'P', 'E'];
  const unitIndex = Math.floor(Math.log10(Math.abs(number)) / 3) || 0;
  if (unitIndex === 0) return number;

  const unit = units[unitIndex];
  const scaledNumber = number / Math.pow(10, unitIndex * 3);
  return `${scaledNumber.toFixed(1).replace(/\.0$/, '')}${unit}`;
};

const isUrl = (text) => {
  const urlRegex = new RegExp(
    /https?:\/\/(www\.)?[-a-zA-Z0-9@:%.+~#=]{1,256}\.[a-zA-Z0-9()]{1,6}\b([-a-zA-Z0-9()@:%+.~#?&/=]*)/,
    'gi'
  );
  return text.match(urlRegex);
};

const toJson = (object) => {
  return JSON.stringify(object, null, 2);
};

const runtime = (seconds) => {
  seconds = Number(seconds);
  const days = Math.floor(seconds / 86400);
  const hours = Math.floor((seconds % 86400) / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = Math.floor(seconds % 60);

  const daysStr = days > 0 ? `${days} ${days === 1 ? "day" : "days"}, ` : '';
  const hoursStr = hours > 0 ? `${hours} ${hours === 1 ? "hour" : "hours"}, ` : '';
  const minutesStr = minutes > 0 ? `${minutes} ${minutes === 1 ? "minute" : "minutes"}, ` : '';
  const secondsStr = remainingSeconds > 0 ? `${remainingSeconds} ${remainingSeconds === 1 ? "second" : "seconds"}` : '';

  return daysStr + hoursStr + minutesStr + secondsStr;
};

const sleep = async (ms) => {
  return new Promise(resolve => setTimeout(resolve, ms));
};

const fetchJson = async (url, options) => {
  try {
    options = options || {};
    const response = await axios({
      method: "GET",
      url: url,
      headers: {
        'User-Agent': "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36",
      },
      ...options,
    });
    return response.data;
  } catch (error) {
    return error;
  }
};

module.exports = {
  getBuffer,
  getGroupAdmins,
  getRandom,
  formatNumber,
  isUrl,
  toJson,
  runtime,
  sleep,
  fetchJson,
};
