const axios = require("axios");
const ytsearch = require("@neeraj-x0/ytsearch");

const search = async (query, limit = 1) => {
  const filters = await ytsearch.getFilters(query);
  const filter = filters.get("Type").get("Video");
  const options = {
    limit,
  };
  const searchResults = await ytsearch(filter.url, options);
  return searchResults.items.map(
    ({ title, url, author, views, duration, uploadedAt }) => {
      return { title, url, author, views, duration, uploadedAt };
    }
  );
};

const ytdlget = async (url) => {
  return new Promise((resolve, reject) => {
    let qu = "query=" + encodeURIComponent(url);

    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://tomp3.cc/api/ajax/search",
      headers: {
        accept: "*/*",
        "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      },
      data: qu,
    };

    axios
      .request(config)
      .then((response) => {
        resolve(response.data);
      })
      .catch((error) => {
        reject(error);
      });
  });
};

/**
 *
 * @param {JSON} data
 * @param {String} type  mp4, mp3, 3gp
 * @returns
 */

function formatYtdata(data, options) {
  const { type, quality } = options;
  const formatted_data = [];

  const processFormat = (format) => {
    const info = {
      vid: data.vid,
      id: format.k,
      size: format.size,
      quality: format.q,
      type: format.f,
    };
    formatted_data.push(info);
  };

  Object.values(data.links.mp4).forEach(processFormat);
  processFormat(data.links.mp3.mp3128);
  processFormat(data.links["3gp"]["3gp@144p"]);
  let formatted = formatted_data;
  if (type) {
    formatted = formatted_data.filter((format) => format.type === type);
  }
  if (quality) {
    formatted = formatted_data.filter((format) => format.quality === quality);
  }
  return formatted;
}
async function ytdlDl(vid, k) {
  const data = `vid=${vid}&k=${encodeURIComponent(k)}`;

  const config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://tomp3.cc/api/ajax/convert",
    headers: {
      accept: "*/*",
      "accept-language": "en-US,en;q=0.9,en-IN;q=0.8",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
    },
    data: data,
  };

  try {
    const response = await axios.request(config);
    return response.data;
  } catch (error) {
    console.error(error);
    throw new Error("An error occurred during the request");
  }
}

async function yta(url) {
  const data = await ytdlget(url);
  const formatted_data = formatYtdata(data, {
    type: "mp3",
  });
  const k = formatted_data[0].id;
  const vid = formatted_data[0].vid;
  let response = await ytdlDl(vid, k);

  response = {
    ...response,
    sizes: formatted_data[0].size,
    thumb: `https://i.ytimg.com/vi/${vid}/0.jpg`,
  };
  return response;
}

async function ytv(url, quality = "480p") {
  const data = await ytdlget(url);
  const formatted_data = formatYtdata(data, { type: "mp4", quality });
  const k = formatted_data[0].id;
  const vid = formatted_data[0].vid;
  let response = await ytdlDl(vid, k);
  response = {
    ...response,
    sizes: formatted_data[0].size,
    thumb: `https://i.ytimg.com/vi/${vid}/0.jpg`,
  };
  return response;
}

const ytsdl = async (query, type = "audio") => {
  const searchResults = await search(query);
  const url = searchResults[0].url;
  if (type === "audio") {
    return await yta(url);
  } else if (type === "video") {
    return await ytv(url);
  } else {
    throw new Error("Invalid type. Use 'audio' or 'video'");
  }
};

module.exports = { yta, ytv, ytdlDl, ytdlget, formatYtdata, ytsdl };