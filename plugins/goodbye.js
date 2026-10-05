const { cmd } = require('../command');
const config = require('../config');
const pluginSettings = require('../lib/pluginSettings');

const isEnabled = (value) => value === true || String(value).toLowerCase() === 'true' || String(value).toLowerCase() === 'on';

module.exports.handleGoodbye = async (conn, id, participants, groupMetadata) => {
    if (!conn || !id || !Array.isArray(participants) || !groupMetadata?.participants) return;

    let enabled = isEnabled(config.GOODBYE);
    try {
        const override = await pluginSettings.get(id, 'goodbye');
        if (override !== undefined) enabled = isEnabled(override);
    } catch (error) {
        console.error('Error reading goodbye setting:', error.message);
    }
    if (!enabled) return;

    const groupName = groupMetadata.subject || 'Group';
    const template = typeof config.GOODBYE_MESSAGE === 'string' && config.GOODBYE_MESSAGE.trim()
        ? config.GOODBYE_MESSAGE
        : 'Goodbye {name}.\nWe now have {members} members remaining.\n\nHope to see you again!';

    await Promise.allSettled(participants.map(async (entry) => {
        const participant = typeof entry === 'string' ? entry : entry?.id || entry?.jid;
        if (!participant) return;
        const number = participant.replace('@s.whatsapp.net', '');
        const caption = template
            .replace(/{name}/g, 'Member')
            .replace(/{number}/g, number)
            .replace(/{members}/g, String(groupMetadata.participants.length))
            .replace(/{group}/g, groupName);
        await conn.sendMessage(id, { text: caption, mentions: [participant] });
    }));
};

cmd({
    pattern: 'setgoodbye',
    desc: 'Set a custom goodbye message',
    category: 'settings',
    filename: __filename
}, async (conn, mek, m, { q, isAdmins, isGroup, reply }) => {
    if (!isGroup) return reply('❌ This command can only be used in groups!');
    if (!isAdmins) return reply('❌ You must be a group admin to set goodbye messages!');
    if (!q) return reply(`📝 *Custom Goodbye Message Setup*\n\nPlaceholders: {name}, {number}, {members}, {group}\n\nUsage: .setgoodbye <your custom message>`);
    config.GOODBYE_MESSAGE = q;
    return reply(`✅ *Goodbye message updated!*\n\n📝 Custom message:\n${q}`);
});
