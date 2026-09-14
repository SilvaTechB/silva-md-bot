'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

const {
    extractMessageText,
    safeSend,
    handleMessages,
} = require('../handler');
const {
    isDuplicateMessage,
    rememberMessageIfContent,
} = require('../lib/message-gate');
const {
    UNDECRYPTABLE_LOG_THRESHOLD,
    trackUndecryptableMessage,
} = require('../lib/session-recovery');

test('extracts commands from nested WhatsApp wrappers', () => {
    const wrapped = {
        ephemeralMessage: {
            message: {
                viewOnceMessageV2: {
                    message: {
                        extendedTextMessage: { text: '\uFEFF .ping  ' },
                    },
                },
            },
        },
    };

    assert.equal(extractMessageText(wrapped), '.ping');
});

test('extracts interactive response text without a live WhatsApp connection', () => {
    const message = {
        interactiveResponseMessage: {
            nativeFlowResponseMessage: {
                paramsJson: '{"id":"alive"}',
            },
        },
    };

    assert.equal(extractMessageText(message), '{"id":"alive"}');
});

test('does not mark an empty delivery as seen before the real message arrives', () => {
    const seen = new Set();
    const stub = { key: { id: 'same-message' } };
    const real = { key: { id: 'same-message' }, message: { conversation: '.ping' } };

    assert.equal(isDuplicateMessage(stub, seen), false);
    assert.equal(rememberMessageIfContent(stub, seen), false);
    assert.equal(isDuplicateMessage(real, seen), false);
    assert.equal(rememberMessageIfContent(real, seen), true);
    assert.equal(isDuplicateMessage(real, seen), true);
});

test('sends replies to LID chats after attempting session establishment', async () => {
    const calls = [];
    const sock = {
        assertSessions: async jids => calls.push({ type: 'assertSessions', jids }),
        sendMessage: async (jid, content) => {
            calls.push({ type: 'sendMessage', jid, content });
            return { key: { id: 'reply' } };
        },
    };

    const result = await safeSend(sock, '123456789@lid', { text: 'pong' });

    assert.equal(result.key.id, 'reply');
    assert.deepEqual(calls, [
        { type: 'assertSessions', jids: ['123456789@lid'] },
        { type: 'sendMessage', jid: '123456789@lid', content: { text: 'pong' } },
    ]);
});

test('routes a prefixed command to a plugin without a live WhatsApp connection', async () => {
    const sent = [];
    const sock = {
        sendMessage: async (jid, content) => {
            sent.push({ jid, content });
            return { key: { id: `reply-${sent.length}` } };
        },
        sendPresenceUpdate: async () => {},
    };

    await handleMessages(sock, {
        key: {
            id: 'incoming-ping',
            remoteJid: '254700000000@s.whatsapp.net',
            fromMe: false,
        },
        message: { conversation: '.ping' },
    });

    assert.equal(sent.length, 2);
    assert.equal(sent[0].jid, '254700000000@s.whatsapp.net');
    assert.match(sent[0].content.text, /Pinging/);
    assert.match(sent[1].content.text, /Bot is Online/);
});

test('undecryptable-message tracking only logs and resets its counter', () => {
    const logs = [];
    let state = { count: 0 };

    for (let i = 0; i < UNDECRYPTABLE_LOG_THRESHOLD - 1; i++) {
        state = trackUndecryptableMessage(state, count => logs.push(count));
    }
    assert.equal(logs.length, 0);
    assert.equal(state.count, UNDECRYPTABLE_LOG_THRESHOLD - 1);

    state = trackUndecryptableMessage(state, count => logs.push(count));
    assert.deepEqual(logs, [UNDECRYPTABLE_LOG_THRESHOLD]);
    assert.deepEqual(state, { count: 0, thresholdReached: true });
});