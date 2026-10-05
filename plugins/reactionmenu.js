const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'reactionmenu',
    alias: ['reactmenu', 'reaction'],
    desc: 'Show all Reaction commands',
    category: 'reactions',
    react: '✨',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('dddd, DD MMMM YYYY');

        const reactRows = [
            { title: "React Emoji", rowId: `${prefix}reactemoji`, description: "React with emoji" },
            { title: "React Text", rowId: `${prefix}reacttext`, description: "React with text" }
        ];

        const listMessage = {
            text: "*✨ REACTION MENU*\n\nSelect a command below:",
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open Reaction Menu",
            sections: [{ title: "Reaction Commands", rows: reactRows }],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: require('../lib/branding').getMainImage() || { url: 'https://files.catbox.moe/kbbm5e.jpg' }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });

    } catch (e) {
        console.error('Reaction Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
