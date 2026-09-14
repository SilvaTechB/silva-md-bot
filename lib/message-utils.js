'use strict';

function unwrapMessageContent(content) {
    let current = content;

    // WhatsApp can stack disappearing, view-once, device-sent, and document
    // wrappers. Unwrap a bounded number of layers so malformed input cannot
    // create an infinite loop.
    for (let i = 0; i < 8 && current; i++) {
        const next = current.deviceSentMessage?.message
            || current.ephemeralMessage?.message
            || current.viewOnceMessageV2?.message
            || current.viewOnceMessageV2Extension?.message
            || current.viewOnceMessage?.message
            || current.documentWithCaptionMessage?.message
            || current.editedMessage?.message?.protocolMessage?.editedMessage;

        if (!next || next === current) break;
        current = next;
    }

    return current || content;
}

function extractMessageText(rawMessage, normalize = value => value) {
    if (!rawMessage) return '';

    const normalized = normalize(rawMessage) || rawMessage;
    const message = unwrapMessageContent(normalized) || normalized;

    return (
        message.conversation ||
        message.extendedTextMessage?.text ||
        message.imageMessage?.caption ||
        message.videoMessage?.caption ||
        message.audioMessage?.caption ||
        message.documentMessage?.caption ||
        message.buttonsMessage?.contentText ||
        message.buttonsResponseMessage?.selectedDisplayText ||
        message.listMessage?.description ||
        message.listResponseMessage?.title ||
        message.listResponseMessage?.singleSelectReply?.selectedRowId ||
        message.templateMessage?.hydratedTemplate?.hydratedContentText ||
        message.templateButtonReplyMessage?.selectedDisplayText ||
        message.interactiveMessage?.body?.text ||
        message.interactiveResponseMessage?.body?.text ||
        message.interactiveResponseMessage?.nativeFlowResponseMessage?.paramsJson ||
        message.highlyStructuredMessage?.hydratedHsm?.hydratedContentText ||
        message.highlyStructuredMessage?.hydratedHsm?.hydratedButtons?.[0]?.callToActionButton?.displayText ||
        message.productMessage?.contextInfo?.quotedMessage?.conversation ||
        message.orderMessage?.message ||
        message.reactionMessage?.text ||
        rawMessage.conversation ||
        rawMessage.extendedTextMessage?.text ||
        ''
    ).replace(/^\uFEFF/, '').replace(/^\u200B+/, '').trim();
}

module.exports = { unwrapMessageContent, extractMessageText };