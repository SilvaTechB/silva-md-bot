// lib/autoreact.js

// List of emojis for auto-reaction
export const emojis = [
    '💘', '💝', '💖', '💗', '💓', '💞', '💕', '💟', '❤️',
    '🧡', '💛', '💚', '💙', '💜', '🤎', '🖤', '🤍', '🔥'
];

// Function to send a reaction (emoji) using conn.sendMessage
export async function doReact(emoji, message, conn) {
    try {
        console.log(`Reacting to message with emoji: ${emoji}`);
        
        // Construct the reaction message
        const reactionMessage = {
            react: {
                text: emoji,  // The emoji to react with
                key: message.key    // The message key to react to
            }
        };

        // Send the reaction using conn.sendMessage()
        await conn.sendMessage(message.chat, reactionMessage);
        
        console.log('Reaction sent successfully!');
    } catch (error) {
        console.error('Error sending auto reaction:', error);
    }
}
