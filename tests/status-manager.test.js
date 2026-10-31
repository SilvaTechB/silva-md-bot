'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const config = require('../config');
const { handleStatusBroadcast } = require('../lib/statusManager');

test('reacts to LID status updates using the owner phone JID', async () => {
    const oldFlags = global.autoStatusFlags;
    const oldSeen = config.AUTO_STATUS_SEEN;
    const oldReact = config.AUTO_STATUS_REACT;
    const receipts = [];
    const sends = [];
    global.autoStatusFlags = { seen: true, react: true };
    config.AUTO_STATUS_SEEN = true;
    config.AUTO_STATUS_REACT = true;

    const status = {
        key: {
            id: 'status-reaction-test-1',
            remoteJid: 'status@broadcast',
            participant: '12345@lid',
            participantPn: '254700123456@s.whatsapp.net',
            fromMe: false,
        },
        message: { imageMessage: { caption: 'hello' } },
    };
    const sock = {
        sendReceipt: async (...args) => receipts.push(args),
        sendMessage: async (...args) => sends.push(args),
    };

    try {
        await handleStatusBroadcast(sock, status);
        assert.equal(receipts.length, 1);
        assert.equal(sends.length, 1);
        assert.equal(sends[0][0], 'status@broadcast');
        assert.deepEqual(sends[0][2], { statusJidList: ['254700123456@s.whatsapp.net'] });
        assert.equal(sends[0][1].react.key.participant, '254700123456@s.whatsapp.net');
        assert.equal(sends[0][1].react.key.remoteJid, 'status@broadcast');
        assert.equal(sends[0][1].react.key.participantPn, undefined);
    } finally {
        global.autoStatusFlags = oldFlags;
        config.AUTO_STATUS_SEEN = oldSeen;
        config.AUTO_STATUS_REACT = oldReact;
    }
});

test('runtime auto-like off suppresses status reactions', async () => {
    const oldFlags = global.autoStatusFlags;
    const oldSeen = config.AUTO_STATUS_SEEN;
    const oldReact = config.AUTO_STATUS_REACT;
    const sends = [];
    global.autoStatusFlags = { seen: false, react: false };
    config.AUTO_STATUS_SEEN = true;
    config.AUTO_STATUS_REACT = true;

    try {
        await handleStatusBroadcast({ sendMessage: async (...args) => sends.push(args) }, {
            key: {
                id: 'status-reaction-test-2',
                remoteJid: 'status@broadcast',
                participant: '12346@lid',
                participantPn: '254700123457@s.whatsapp.net',
                fromMe: false,
            },
            message: { conversation: 'status' },
        });
        assert.equal(sends.length, 0);
    } finally {
        global.autoStatusFlags = oldFlags;
        config.AUTO_STATUS_SEEN = oldSeen;
        config.AUTO_STATUS_REACT = oldReact;
    }
});
