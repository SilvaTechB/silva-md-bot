'use strict';

const UNDECRYPTABLE_LOG_THRESHOLD = 10;

function trackUndecryptableMessage(state = {}, logger = () => {}) {
    const count = Number(state.count || 0) + 1;

    if (count >= UNDECRYPTABLE_LOG_THRESHOLD) {
        logger(count);
        return { count: 0, thresholdReached: true };
    }

    return { count, thresholdReached: false };
}

module.exports = { UNDECRYPTABLE_LOG_THRESHOLD, trackUndecryptableMessage };