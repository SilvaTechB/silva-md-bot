const fs = require('fs-extra');
const { Sequelize } = require('sequelize');
if (fs.existsSync('set.env'))
    require('dotenv').config({ path: __dirname + '/set.env' });
const path = require("path");
const databasePath = path.join(__dirname, './database.db');
const DATABASE_URL = process.env.DATABASE_URL === undefined
    ? databasePath
    : process.env.DATABASE_URL;
module.exports = { session: process.env.SESSION_ID || 'eyJub2lzZUtleSI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoieUVPbkZPTWp2Y2NsRHJ3dUZtRkY4bjhYb2tHQ3BvQUUyTFdySndtSTZFaz0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoiSTVWUy9COXhobFo0a2JYaW5sai9hV3dCaGZYMTRTeGNkT1piazVvNHBtUT0ifX0sInBhaXJpbmdFcGhlbWVyYWxLZXlQYWlyIjp7InByaXZhdGUiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJZQVVUVU1ZbXZZbFlpcXBoMjFOMDh3REtwRmFlRnIrWDRRWnpRWUFRTkU4PSJ9LCJwdWJsaWMiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiJjdXpSZGNpNE4wcjI1MHBoQVVwMWJ2ZC9RczZvV0xYVUs4MllaQU9NY1hrPSJ9fSwic2lnbmVkSWRlbnRpdHlLZXkiOnsicHJpdmF0ZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IktGV1JyUEJXdE9iSC9VSlJqc3hQemdrNEZnQURlVityUTdWTW93em5FbkE9In0sInB1YmxpYyI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkE2anRrQVBzQ2lqa2l6eUlhbTRJbXEyakVaTXd2MkdEMEloeG1xTXA4aFU9In19LCJzaWduZWRQcmVLZXkiOnsia2V5UGFpciI6eyJwcml2YXRlIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoib0pUM3RKY0diQUdYbDBTWXJDY1hwUmlkbk9keDdrL21sQUVPSm1uVWwyRT0ifSwicHVibGljIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoicW5pcWlhc2J1M1VWUjlQMVhJZlR4WUI2bzlaOGo1UWtNdjhJZDNRYVIwRT0ifX0sInNpZ25hdHVyZSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6ImF1Mi9idEV0Vy83WGZmdDdiNXdEYUtlWHorUzJuTmVMb08wMUlXRlhzV09pVFA4enNqSXluU3NVYTBzMzRtRVRJTjVWbXdVVm1nSllIRk5EOGJwcWlBPT0ifSwia2V5SWQiOjF9LCJyZWdpc3RyYXRpb25JZCI6MjUwLCJhZHZTZWNyZXRLZXkiOiJiUHJiZkNLRHQyZ0JpT3p3ckpYMVVBNXFmdEFJZXZsbnlYakg3NThiL1lJPSIsInByb2Nlc3NlZEhpc3RvcnlNZXNzYWdlcyI6W10sIm5leHRQcmVLZXlJZCI6MzEsImZpcnN0VW51cGxvYWRlZFByZUtleUlkIjozMSwiYWNjb3VudFN5bmNDb3VudGVyIjowLCJhY2NvdW50U2V0dGluZ3MiOnsidW5hcmNoaXZlQ2hhdHMiOmZhbHNlfSwiZGV2aWNlSWQiOiJ4Nk95UDIxS1NIYWt6Z2NwUW9iX2JnIiwicGhvbmVJZCI6IjlkZDU4MGFhLWM4OTMtNDM2Yy04MTNmLTZkZjk3Y2FiNmM4MyIsImlkZW50aXR5SWQiOnsidHlwZSI6IkJ1ZmZlciIsImRhdGEiOiIzMWpCMmdGL2FmMGlrVmFGWVVBRktrcGpvdHc9In0sInJlZ2lzdGVyZWQiOnRydWUsImJhY2t1cFRva2VuIjp7InR5cGUiOiJCdWZmZXIiLCJkYXRhIjoidmUzTXBIbHozemo5Y2c2bjdORXFmRUR6ZVJjPSJ9LCJyZWdpc3RyYXRpb24iOnt9LCJwYWlyaW5nQ29kZSI6IlhWUkNSUlNRIiwibWUiOnsiaWQiOiIyNTQ3NDM3MDYwMTA6MzdAcy53aGF0c2FwcC5uZXQifSwiYWNjb3VudCI6eyJkZXRhaWxzIjoiQ0tMUTdjVUdFTWpFeWJRR0dBUWdBQ2dBIiwiYWNjb3VudFNpZ25hdHVyZUtleSI6IjJzR1o4UkJxOVlMbmpFWWN1RUNIRWhqYVhIczdCUVBrak9CNHZadFJwSHc9IiwiYWNjb3VudFNpZ25hdHVyZSI6ImNPSlgzaTF2MlhaSGM3ck5VcFJic2RyODc2bFAzaklBTHhOU2J1QUUyYklHYTNDbVZ4YzlralBzWm1JTTNPcTNSekF0ZllTSGRrTXNnYkpoS2p2V0NnPT0iLCJkZXZpY2VTaWduYXR1cmUiOiJlQVBBSng4a0JkSW5Bck5LZEMrZElPWGlQM1Q0SUovMHlyeVE4bm92RmljTVUvZzUvelhTWis5NUhxclJmYTJKY2FZWUMxVTF5TElYVVZEc0RSa2ZqQT09In0sInNpZ25hbElkZW50aXRpZXMiOlt7ImlkZW50aWZpZXIiOnsibmFtZSI6IjI1NDc0MzcwNjAxMDozN0BzLndoYXRzYXBwLm5ldCIsImRldmljZUlkIjowfSwiaWRlbnRpZmllcktleSI6eyJ0eXBlIjoiQnVmZmVyIiwiZGF0YSI6IkJkckJtZkVRYXZXQzU0eEdITGhBaHhJWTJseDdPd1VENUl6Z2VMMmJVYVI4In19XSwicGxhdGZvcm0iOiJhbmRyb2lkIiwibGFzdEFjY291bnRTeW5jVGltZXN0YW1wIjoxNzIwODY5NDYxLCJteUFwcFN0YXRlS2V5SWQiOiJBQUFBQUNHaiJ9',
    PREFIXE: process.env.PREFIX || "~",
    OWNER_NAME: process.env.OWNER_NAME || "SILVA TECH 💋",
    NUMERO_OWNER : process.env.NUMERO_OWNER || "SILVA",              
    AUTO_READ_STATUS: process.env.AUTO_READ_STATUS || "non",
    AUTO_DOWNLOAD_STATUS: process.env.AUTO_DOWNLOAD_STATUS || 'non',
    BOT : process.env.BOT_NAME || 'SILVA-TECH',
    URL : process.env.BOT_MENU_LINKS || 'https://telegra.ph/file/3647aeca79bcc25555c99.jpg',
    MODE: process.env.PUBLIC_MODE || "yes",
    PM_PERMIT: process.env.PM_PERMIT || 'no',
    HEROKU_APP_NAME : process.env.HEROKU_APP_NAME,
    HEROKU_APY_KEY : process.env.HEROKU_APY_KEY ,
    WARN_COUNT : process.env.WARN_COUNT || '3' ,
    ETAT : process.env.PRESENCE || '',
    //GPT : process.env.OPENAI_API_KEY || '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',
    DP : process.env.STARTING_BOT_MESSAGE || "yes",
    ADM : process.env.ANTI_DELETE_MESSAGE || 'no',
    DATABASE_URL,
    DATABASE: DATABASE_URL === databasePath
        ? "postgres://db_7xp9_user:6hwmTN7rGPNsjlBEHyX49CXwrG7cDeYi@dpg-cj7ldu5jeehc73b2p7g0-a.oregon-postgres.render.com/db_7xp9" : "postgres://db_7xp9_user:6hwmTN7rGPNsjlBEHyX49CXwrG7cDeYi@dpg-cj7ldu5jeehc73b2p7g0-a.oregon-postgres.render.com/db_7xp9",
    /* new Sequelize({
     dialect: 'sqlite',
     storage: DATABASE_URL,
     logging: false,
})
: new Sequelize(DATABASE_URL, {
     dialect: 'postgres',
     ssl: true,
     protocol: 'postgres',
     dialectOptions: {
         native: true,
         ssl: { require: true, rejectUnauthorized: false },
     },
     logging: false,
}),*/
};
let fichier = require.resolve(__filename);
fs.watchFile(fichier, () => {
    fs.unwatchFile(fichier);
    console.log(`mise à jour ${__filename}`);
    delete require.cache[fichier];
    require(fichier);
});
