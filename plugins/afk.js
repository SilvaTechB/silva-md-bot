const { bot } = require('../lib/')

global.AFK = {
	isAfk: false,
	reason: false,
	lastseen: 0,
}

bot(
	{
		pattern: 'afk ?(.*)',
		fromMe: true,
		desc: 'away from keyboard',
		type: 'misc',
	},
	async (message, match) => {
		if (!global.AFK.isAfk && !match)
			return await message.send(
				'Example : My owner is AFK\n last seen before #lastseen\nTo off afk send a msg again.'
			)
		if (!global.AFK.isAfk) {
			if (match) global.AFK.reason = match
			global.AFK.isAfk = true
			global.AFK.lastseen = Math.round(new Date().getTime() / 1000)
			return await message.send(
				match.replace(
					'#lastseen',
					Math.round(new Date().getTime() / 1000) - global.AFK.lastseen
				)
			)
		}
	}
)