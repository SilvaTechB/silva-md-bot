'use strict';

function isDuplicateMessage(message, seenIds) {
    const id = message?.key?.id;
    return Boolean(id && seenIds.has(id));
}

function rememberMessageIfContent(message, seenIds) {
    const id = message?.key?.id;
    if (!id || !message?.message) return false;
    seenIds.add(id);
    return true;
}

module.exports = { isDuplicateMessage, rememberMessageIfContent };