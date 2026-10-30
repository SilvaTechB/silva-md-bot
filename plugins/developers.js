'use strict';

const { getDevelopers } = require('../lib/database');

module.exports = {
    commands: ['developers', 'devs', 'devcontact'],
    description: 'Show Silva developer contacts',
    usage: '.developers',
    permission: 'public',
    group: true,
    private: true,
    run: async (sock, message, args, ctx) => {
        const developers = await getDevelopers();
        const lines = developers.map((developer, index) => `${index + 1}. *${developer.name || 'Silva'}* — ${developer.role || 'developer'}\n   +${developer.phone}`);
        return ctx.reply(`👨‍💻 *Silva Developers*\n\n${lines.join('\n\n')}\n\n_For support and bot development._`);
    }
};
