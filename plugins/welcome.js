const { cmd } = require('../command');
const config = require('../config');
const pluginSettings = require('../lib/pluginSettings');

const isEnabled = (value) => value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'on';

function participantName(groupMetadata, participant) {
    const record = groupMetadata.participants.find((entry) => (entry?.id || entry?.jid) === participant);
    return record?.notify || record?.name || 'New Member';
}

module.exports.handleWelcome = async (conn, id, participants, groupMetadata) => {
    if (!conn || !id || !Array.isArray(participants) || !groupMetadata?.participants) return;

    let enabled = isEnabled(config.WELCOME);
    try {
        const override = await pluginSettings.get(id, 'welcome');
        if (override !== undefined) enabled = isEnabled(override);
    } catch (error) {
        console.error('Error reading welcome setting:', error.message);
    }
    if (!enabled) return;

    const groupName = groupMetadata.subject || 'Group';
    const template = typeof config.WELCOME_MESSAGE === 'string' && config.WELCOME_MESSAGE.trim()
        ? config.WELCOME_MESSAGE
        : 'Welcome {name} to {group}!\nYou are member #{members}.\n\nPlease introduce yourself and follow the group rules.';

    await Promise.allSettled(participants.map(async (entry) => {
        const participant = typeof entry === 'string' ? entry : entry?.id || entry?.jid;
        if (!participant) return;
        const number = participant.replace('@s.whatsapp.net', '');
        const caption = template
            .replace(/{name}/g, participantName(groupMetadata, participant))
            .replace(/{number}/g, number)
            .replace(/{members}/g, String(groupMetadata.participants.length))
            .replace(/{group}/g, groupName);
        await conn.sendMessage(id, { text: caption, mentions: [participant] });
    }));
};

cmd({
    pattern: 'setwelcome',
    desc: 'Set a custom welcome message',
    category: 'other',
    filename: __filename
}, async (conn, mek, m, { q, isAdmins, isGroup, reply }) => {
    if (!isGroup) return reply('❌ This command can only be used in groups!');
    if (!isAdmins) return reply('❌ You must be a group admin to set welcome messages!');
    if (!q) return reply(`📝 *Custom Welcome Message Setup*\n\nPlaceholders: {name}, {number}, {members}, {group}\n\nUsage: .setwelcome <your custom message>`);
    config.WELCOME_MESSAGE = q;
    return reply(`✅ *Welcome message updated!*\n\n📝 Custom message:\n${q}`);
});
