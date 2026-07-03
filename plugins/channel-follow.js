const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');

const followedChannelsFile = path.join(__dirname, '../assets/followed_channels.json');

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
    addTarget(config.CHANNEL_LINK);
    addTarget('120363424512102809');

    return targets;
}

// Function to handle channel reactions
async function handleChannelReaction(conn, mek) {
    try {
        if (String(config.AUTO_REACT).toLowerCase() !== 'true' && config.AUTO_REACT !== true) return;

        const targets = getConfiguredChannelTargets();
        const remoteJid = mek?.key?.remoteJid;
        const participant = mek?.key?.participant;
        const sender = mek?.sender || participant || remoteJid;
        const incomingJids = [remoteJid, participant, sender].filter(Boolean);

        if (mek?.key?.fromMe || !incomingJids.length) return;

        const hasTargetedChannel = incomingJids.some((jid) => {
            const incomingId = getChannelBaseId(jid);
            return incomingId && [...targets].some((target) => getChannelBaseId(target) === incomingId);
        });

        if (!hasTargetedChannel) return;

        const from = remoteJid || participant || sender;
        const emojis = ['❤️', '💸', '😇', '🍂', '💥', '💯', '🔥', '💫', '💎', '💗', '🤍', '🖤', '👀', '🙌', '🙆', '🚩', '🥰', '💐', '😎', '🤎', '✅', '🫀', '🧡', '😁', '😄', '🌸', '🌷', '⛅', '🌟', '🗿', '🌝', '💜', '💙', '🖤', '💚'];
        const randomEmoji = emojis[Math.floor(Math.random() * emojis.length)];

        let sentReact = false;
        const reactionKey = {
            ...mek.key,
            remoteJid: from,
            participant: participant || from
        };
        try {
            await conn.sendMessage(from, { react: { text: randomEmoji, key: reactionKey } });
            sentReact = true;
        } catch (reactErr) {
            console.error('Channel reaction via react failed:', reactErr);
        }

        if (!sentReact) {
            try {
                await conn.sendMessage(from, { text: `🤖 Auto-reacted with ${randomEmoji}` });
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