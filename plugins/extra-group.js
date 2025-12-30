const { cmd } = require('../command');

cmd({
    pattern: 'membercount',
    react: '👥',
    desc: 'Show total members in the group',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { isGroup, groupMetadata, participants, groupName, reply }) => {
    try {
        if (!isGroup) return reply('This command works in groups only.');
        const count = (groupMetadata && groupMetadata.participants) ? groupMetadata.participants.length : (participants ? participants.length : 0);
        await reply(`👥 Total members in ${groupName || 'this group'}: ${count}`);
    } catch (e) {
        console.error('Membercount command error:', e);
        reply('❌ Error retrieving member count');
    }
});
