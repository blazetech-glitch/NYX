const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');

const followedChannelsFile = path.join(__dirname, '../assets/followed_channels.json');

function normalizeChannelJid(channelId) {
    if (!channelId) return null;
    channelId = channelId.toString().trim();
    if (!channelId) return null;
    if (!channelId.includes('@')) {
        return `${channelId}@newsletter`;
    }
    return channelId;
}

// Function to read followed channels
function readFollowedChannels() {
    try {
        if (!fs.existsSync(followedChannelsFile)) {
            fs.writeFileSync(followedChannelsFile, '[]');
        }
        return JSON.parse(fs.readFileSync(followedChannelsFile, 'utf8'));
    } catch (e) {
        console.error('Error reading followed channels:', e);
        return [];
    }
}

// Function to write followed channels
function writeFollowedChannels(channels) {
    try {
        fs.writeFileSync(followedChannelsFile, JSON.stringify(channels, null, 2));
    } catch (e) {
        console.error('Error writing followed channels:', e);
    }
}

// Command to follow a channel
cmd({
    pattern: "follow",
    desc: "Follow a WhatsApp channel to auto-react to its updates",
    category: "tools",
    filename: __filename
},
    async (conn, mek, m, { from, args, isCreator, reply }) => {
        try {
            if (!isCreator) return reply("*📛 Only the owner can use this command!*");

            const channelJid = args[0];
            if (!channelJid) {
                return reply("*🫟 Example: .follow 120363421014261315@newsletter*");
            }

            const normalizedJid = normalizeChannelJid(channelJid);
            if (!normalizedJid || !normalizedJid.includes('@newsletter')) {
                return reply("*❌ Invalid channel JID. It should be a newsletter channel e.g. 120363421014261315@newsletter*");
            }

            let followedChannels = readFollowedChannels();

            if (followedChannels.includes(normalizedJid)) {
                return reply("*ℹ️ This channel is already being followed.*");
            }

            followedChannels.push(normalizedJid);
            writeFollowedChannels(followedChannels);

            // Try to follow the channel
            try {
                await conn.newsletterFollow(channelJid);
                reply(`✅ *Followed and added to auto-react list:*\n${channelJid}`);
            } catch (e) {
                reply(`✅ *Added to auto-react list:*\n${channelJid}\n⚠️ *Note: Could not follow the channel automatically.*`);
            }

        } catch (e) {
            console.error(e);
            reply("❌ Error: " + e.message);
        }
    });

// Command to unfollow a channel
cmd({
    pattern: "unfollow",
    desc: "Unfollow a WhatsApp channel and stop auto-reacting",
    category: "tools",
    filename: __filename
},
    async (conn, mek, m, { from, args, isCreator, reply }) => {
        try {
            if (!isCreator) return reply("*📛 Only the owner can use this command!*");

            const channelJid = args[0];
            if (!channelJid) {
                return reply("*🫟 Example: .unfollow 120363421014261315@newsletter*");
            }

            let followedChannels = readFollowedChannels();

            const index = followedChannels.indexOf(channelJid);
            if (index === -1) {
                return reply("*ℹ️ This channel is not in the followed list.*");
            }

            followedChannels.splice(index, 1);
            writeFollowedChannels(followedChannels);

            reply(`✅ *Removed from auto-react list:*\n${channelJid}`);

        } catch (e) {
            console.error(e);
            reply("❌ Error: " + e.message);
        }
    });

// Command to list followed channels
cmd({
    pattern: "followed",
    desc: "List all followed channels",
    category: "tools",
    filename: __filename
},
    async (conn, mek, m, { from, isCreator, reply }) => {
        try {
            if (!isCreator) return reply("*📛 Only the owner can use this command!*");

            const followedChannels = readFollowedChannels();

            if (followedChannels.length === 0) {
                return reply("*ℹ️ No channels are currently being followed.*");
            }

            let message = "*📢 Followed Channels:*\n\n";
            followedChannels.forEach((jid, index) => {
                message += `${index + 1}. ${jid}\n`;
            });

            reply(message);

        } catch (e) {
            console.error(e);
            reply("❌ Error: " + e.message);
        }
    });

// Function to handle channel reactions
async function handleChannelReaction(conn, mek) {
    try {
        const followedChannels = readFollowedChannels();
        const from = mek.key.remoteJid;
        const channelId = normalizeChannelJid(config.NEWSLETTER_JID) || normalizeChannelJid(config.CHANNEL_JID);
        const explicitChannelId = normalizeChannelJid('120363424512102809');
        const allTargets = new Set([...followedChannels, channelId, explicitChannelId]);

        console.log('handleChannelReaction called:', {
            from,
            isFromMe: mek.key?.fromMe,
            messageKeys: Object.keys(mek.message || {}),
            followedChannels
        });

        if (mek.key?.fromMe) return;

        if (!from) return;

        // Channel can be in @newsletter or @broadcast forms
        const isChannel = allTargets.has(from) || from.includes('@newsletter') || from.includes('@broadcast');
        if (!isChannel) return;

        const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🌷', '⛅', '🌟', '🗿', '🌝', '💜', '💙', '🖤', '💚'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];
        console.log('Reacting to channel message with:', randomEmoji);

        // Try to send a rich react first, then also send visible text emoji
        let sentReact = false;
        const reactionKey = {
            ...mek.key,
            remoteJid: from,
            participant: mek.key.participant || from
        };
        try {
            await conn.sendMessage(from, { react: { text: randomEmoji, key: reactionKey } });
            sentReact = true;
            console.log('Reaction sent to channel via react object');
        } catch (reactErr) {
            console.error('Channel reaction via react failed:', reactErr);
        }

        // Do not send a visible autoreply message when reacting to channel posts.
        // Only send a visible message if the rich react failed.
        if (!sentReact) {
            try {
                await conn.sendMessage(from, { text: `🤖 Auto-reacted with ${randomEmoji}` });
                console.log('Visible reaction message sent to channel (fallback)');
            } catch (textErr) {
                console.error('Visible reaction message send failed (fallback):', textErr);
            }
        }
    } catch (e) {
        console.error('Error in handleChannelReaction:', e);
    }
}

// Export the followed channels for use in other parts
module.exports = {
    getFollowedChannels: readFollowedChannels,
    handleChannelReaction
};

// Auto-add channels on module load
const channels = readFollowedChannels();
const autoChannels = new Set([
    normalizeChannelJid(config.NEWSLETTER_JID),
    normalizeChannelJid(config.CHANNEL_JID),
    normalizeChannelJid('120363424512102809')
]);
for (const channelJid of autoChannels) {
    if (channelJid && !channels.includes(channelJid)) {
        channels.push(channelJid);
        console.log('Auto-added channel to followed list:', channelJid);
    }
}
writeFollowedChannels(channels);