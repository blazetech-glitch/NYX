/**
 * NYX MD - Auto Join WhatsApp Group Module
 * Handles automatic joining of WhatsApp groups from GROUP_LINK config
 */

const config = require('../config');

module.exports = {
    /**
     * Initialize auto-join functionality
     * Call this when bot connection is ready (connection === 'open')
     * @param {object} conn - WhatsApp connection instance
     * @param {object} logger - Logger/console object
     */
    initAutoJoin: async (conn, logger = console) => {
        try {
            if (!config.GROUP_LINK) {
                logger.log('ℹ️  No valid GROUP_LINK found in config to auto-join.');
                return false;
            }

            logger.log('🔄 Attempting to auto-join NYX group...');

            // Extract group code from link
            const groupCodeMatch = config.GROUP_LINK.match(/chat\.whatsapp\.com\/([a-zA-Z0-9]+)/);
            if (!groupCodeMatch || !groupCodeMatch[1]) {
                logger.warn('⚠️  Invalid GROUP_LINK format in config');
                return false;
            }

            const groupCode = groupCodeMatch[1];
            logger.log(`📝 Group Code: ${groupCode}`);

            try {
                // Attempt to join the group
                const result = await conn.groupAcceptInvite(groupCode);
                logger.log('✅ Successfully joined NYX group from GROUP_LINK');

                // Send welcome message to group
                try {
                    const groupInfo = await conn.groupMetadata(result);
                    if (groupInfo && groupInfo.id) {
                        await conn.sendMessage(groupInfo.id, {
                            text: `✅ *NYX MD Bot Joined*\n\n👋 Hello! I'm NYX MD Bot\n\n📋 Type .menu to see all available commands\n\n🔗 Group Link Setup Complete!\n\n*Happy using the bot!*`
                        });
                    }
                } catch (msgErr) {
                    logger.warn('⚠️  Could not send welcome message:', msgErr.message);
                }

                return true;

            } catch (joinError) {
                const errorMsg = joinError.message || '';

                if (errorMsg.includes('already')) {
                    logger.log('ℹ️  Already a member of the NYX group');
                    return true;
                } else if (errorMsg.includes('suspended')) {
                    logger.warn('🚫 Group has been suspended');
                    return false;
                } else if (errorMsg.includes('not found') || errorMsg.includes('invalid')) {
                    logger.warn('❌ Invalid or expired GROUP_LINK');
                    return false;
                } else if (errorMsg.includes('closed')) {
                    logger.warn('🔒 Group is closed - cannot join');
                    return false;
                } else {
                    logger.warn(`❌ Error joining group: ${errorMsg}`);
                    return false;
                }
            }

        } catch (error) {
            logger.error('❌ Auto-join error:', error.message);
            return false;
        }
    },

    /**
     * Verify if bot is in NYX group
     * @param {object} conn - WhatsApp connection instance
     * @returns {boolean} - True if in group, false otherwise
     */
    isInNYXGroup: async (conn) => {
        try {
            const chats = await conn.groupFetchAllParticipating();
            if (chats) {
                // Check if we're in any group (basic check)
                return Object.keys(chats).length > 0;
            }
            return false;
        } catch (error) {
            console.error('Error checking group membership:', error.message);
            return false;
        }
    },

    /**
     * Force rejoin NYX group (useful for reconnection)
     * @param {object} conn - WhatsApp connection instance
     * @returns {boolean} - Success status
     */
    forceRejoin: async (conn) => {
        console.log('🔄 Force rejoining NYX group...');
        return module.exports.initAutoJoin(conn);
    }
};
