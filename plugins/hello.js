'use strict';

module.exports = {
    commands:    ['hello'],
    description: 'Simple hello test command',
    permission:  'public',
    group:       true,
    private:     true,
    run: async (sock, message, args, { reply }) => {
        await reply(`✅ Hello! Args received: ${args.join(', ') || 'none'}`);
    }
};
