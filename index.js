const bot = require(__dirname + '/lib/smd')
const { VERSION } = require(__dirname + '/config')

const start = async () => {
    Debug.info(`Gifted ${VERSION}`)
  try {
    await bot.init()
    bot.logger.info('⏳ Gifted Database is syncing!')
    await bot.DATABASE.sync()
    await bot.connect()
  } catch (error) {
    Debug.error(error);
    start();
  }
}
start();


