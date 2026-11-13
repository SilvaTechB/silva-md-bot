'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');

test('caches wrapped view-once media at arrival time', async () => {
    const chunks = [Buffer.from('view-once-'), Buffer.from('bytes')];
    const downloader = async (content, type) => {
        assert.equal(type, 'imageMessage');
        assert.equal(content.mediaKey.toString(), 'media-key');
        return Buffer.concat(chunks);
    };

    const pluginPath = require.resolve('../plugins/viewonce');
    delete require.cache[pluginPath];
    const plugin = require(pluginPath);
    global.viewOnceCache = new Map();

    try {
        await plugin.cacheViewOnce({
            key: { id: 'arrival-view-once' },
            message: {
                ephemeralMessage: {
                    message: {
                        viewOnceMessageV2: {
                            message: {
                                imageMessage: {
                                    mediaKey: Buffer.from('media-key'),
                                    mimetype: 'image/jpeg',
                                    caption: 'test image',
                                },
                            },
                        },
                    },
                },
            },
        }, downloader);

        const cached = global.viewOnceCache.get('arrival-view-once');
        assert.ok(cached);
        assert.equal(cached.type, 'imageMessage');
        assert.deepEqual(cached.buffer, Buffer.concat(chunks));
        assert.equal(cached.caption, 'test image');
    } finally {
        delete require.cache[pluginPath];
        global.viewOnceCache = new Map();
    }
});
