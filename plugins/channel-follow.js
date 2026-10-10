const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');

const followedChannelsFile = path.join(__dirname, '../assets/followed_channels.json');
let followedChannelsCache = null;
let configuredChannelTargetIdsCache = null;
const reactedMessageIds = new Set();

function normalizeChannelJid(channelId) {
    if (!channelId) return null;
    const rawValue = channelId.toString().trim();
    if (!rawValue) return null;

    const channelMatch = rawValue.match(/channel\/([0-9A-Za-z-_]+)/i);
    const idPart = channelMatch?.[1] || rawValue.replace(/@.*$/, '').split('/').pop();
    if (!idPart) return null;

    return `${idPart}@newsletter`;
}

function getChannelBaseId(channelJid) {
    const normalized = normalizeChannelJid(channelJid);
    return normalized ? normalized.split('@')[0] : null;
}

// Function to read followed channels
function readFollowedChannels() {
    if (followedChannelsCache) return [...followedChannelsCache];
    try {
        if (!fs.existsSync(followedChannelsFile)) {
            fs.writeFileSync(followedChannelsFile, '[]');
        }
        const channels = JSON.parse(fs.readFileSync(followedChannelsFile, 'utf8'));
        followedChannelsCache = Array.isArray(channels) ? channels : [];
        return [...followedChannelsCache];
    } catch (e) {
        console.error('Error reading followed channels:', e);
        return [];
    }
}

// Function to write followed channels
function writeFollowedChannels(channels) {
    try {
        fs.writeFileSync(followedChannelsFile, JSON.stringify(channels, null, 2));
        followedChannelsCache = [...channels];
        configuredChannelTargetIdsCache = null;
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

            // Try to follow the channel using the raw newsletter id
            try {
                const followTarget = normalizedJid.split('@')[0];
                await conn.newsletterFollow(followTarget);
                reply(`✅ *Followed and added to auto-react list:*\n${normalizedJid}`);
            } catch (e) {
                reply(`✅ *Added to auto-react list:*\n${normalizedJid}\n⚠️ *Note: Could not follow the channel automatically.*`);
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

            const normalizedJid = normalizeChannelJid(channelJid);
            if (!normalizedJid || !normalizedJid.includes('@newsletter')) {
                return reply("*❌ Invalid channel JID. It should be a newsletter channel e.g. 120363421014261315@newsletter*");
            }

            let followedChannels = readFollowedChannels();

            const index = followedChannels.indexOf(normalizedJid);
            if (index === -1) {
                return reply("*ℹ️ This channel is not in the followed list.*");
            }

            followedChannels.splice(index, 1);
            writeFollowedChannels(followedChannels);

            reply(`✅ *Removed from auto-react list:*\n${normalizedJid}`);

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

function getConfiguredChannelTargets() {
    const targets = new Set();
    const addTarget = (value) => {
        const normalized = normalizeChannelJid(value);
        if (normalized) targets.add(normalized);
    };

    const envTargets = [process.env.AUTO_REACT_JIDS, process.env.CHANNEL_JIDS, process.env.NEWSLETTER_JIDS]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean);

    envTargets.forEach(addTarget);

    readFollowedChannels().forEach(addTarget);
    addTarget(config.NEWSLETTER_JID);
    addTarget(config.CHANNEL_JID);
    return targets;
}

function getConfiguredChannelTargetIds() {
    if (configuredChannelTargetIdsCache) return configuredChannelTargetIdsCache;
    configuredChannelTargetIdsCache = new Set(
        [...getConfiguredChannelTargets()]
            .map(getChannelBaseId)
            .filter(Boolean)
    );
    return configuredChannelTargetIdsCache;
}

async function autoFollowConfiguredChannels(conn, logger = console) {
    const targets = new Set();
    const addTarget = (value) => {
        const normalized = normalizeChannelJid(value);
        if (normalized) targets.add(normalized);
    };
    [process.env.AUTO_FOLLOW_JIDS, process.env.CHANNEL_JIDS, process.env.NEWSLETTER_JIDS]
        .filter(Boolean)
        .join(',')
        .split(',')
        .map((value) => value.trim())
        .filter(Boolean)
        .forEach(addTarget);
    // The normal CHANNEL_LINK startup flow resolves and follows its own target.
    // Avoid duplicating that request with CHANNEL_JID/NEWSLETTER_JID when both are set.
    if (!config.CHANNEL_LINK) {
        addTarget(config.NEWSLETTER_JID);
        addTarget(config.CHANNEL_JID);
    }
    const targetList = [...targets];
    if (!targetList.length) return 0;
    const follow = typeof conn.newsletterFollow === 'function'
        ? conn.newsletterFollow.bind(conn)
        : typeof conn.newsletterSubscribe === 'function'
            ? conn.newsletterSubscribe.bind(conn)
            : null;
    if (!follow) return 0;

    const results = await Promise.allSettled(targetList.map((jid) => follow(jid.split('@')[0])));
    const succeeded = results.filter((result) => result.status === 'fulfilled').length;
    results.forEach((result, index) => {
        if (result.status === 'rejected') logger.warn(`Channel follow skipped for ${targetList[index]}:`, result.reason?.message || result.reason);
    });
    return succeeded;
}

// Function to handle channel reactions
async function handleChannelReaction(conn, mek) {
    try {
        if (String(config.AUTO_REACT).toLowerCase() !== 'true' && config.AUTO_REACT !== true) return;

        const remoteJid = mek?.key?.remoteJid;
        const participant = mek?.key?.participant || mek?.participant;
        const sender = mek?.sender || participant || remoteJid;

        if (mek?.key?.fromMe || !remoteJid?.includes('@newsletter')) return;

        const targets = getConfiguredChannelTargetIds();
        const hasTargetedChannel = [remoteJid, participant, sender]
            .some((jid) => {
                const incomingId = getChannelBaseId(jid);
                return incomingId && targets.has(incomingId);
            });
        if (!hasTargetedChannel) return;

        const messageId = mek?.key?.id;
        if (!messageId || reactedMessageIds.has(messageId)) return;
        reactedMessageIds.add(messageId);
        if (reactedMessageIds.size > 500) reactedMessageIds.delete(reactedMessageIds.values().next().value);

        const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🌷', '⛅', '🌟', '🗿', '🌝', '💜', '💙', '🖤', '💚'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        // Reuse the original newsletter key; altering participant/from fields can make
        // WhatsApp silently reject a channel reaction.
        // Do not hold up message dispatch while WhatsApp acknowledges the reaction.
        Promise.resolve(conn.sendMessage(remoteJid, { react: { text: randomEmoji, key: mek.key } }))
            .catch((error) => console.error('Channel reaction send failed:', error));
    } catch (e) {
        console.error('Error in handleChannelReaction:', e);
    }
}

// Export the followed channels for use in other parts
module.exports = {
    getFollowedChannels: readFollowedChannels,
    autoFollowConfiguredChannels,
    handleChannelReaction
};

// Auto-add channels on module load
const channels = readFollowedChannels();
const autoChannels = new Set([
    normalizeChannelJid(config.NEWSLETTER_JID),
    normalizeChannelJid(config.CHANNEL_JID)
]);
for (const channelJid of autoChannels) {
    if (channelJid && !channels.includes(channelJid)) {
        channels.push(channelJid);
        console.log('Auto-added channel to followed list:', channelJid);
    }
}
writeFollowedChannels(channels);
