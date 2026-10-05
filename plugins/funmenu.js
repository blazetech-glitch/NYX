const { cmd, commands } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'funmenu',
    alias: ['fun', 'games'],
    desc: 'Show all Fun commands',
    category: 'fun',
    react: '🎮',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Nairobi').format('dddd, DD MMMM YYYY');

        const funRows = [
            { title: "Truth or Dare", rowId: `${prefix}truth`, description: "Play truth or dare" },
            { title: "Jokes", rowId: `${prefix}joke`, description: "Get random jokes" },
            { title: "Fun Facts", rowId: `${prefix}fact`, description: "Random fun facts" },
            { title: "Memes", rowId: `${prefix}meme`, description: "Get random memes" },
            { title: "Riddles", rowId: `${prefix}riddle`, description: "Solve riddles" }
        ];

        const listMessage = {
            text: "*🎮 FUN MENU*\n\nSelect a command below:",
            footer: `🌟 NYX-XD Bot | Blaze Tech 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open Fun Menu",
            sections: [{ title: "Fun Commands", rows: funRows }],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: require('../lib/branding').getMainImage() || { url: 'https://files.catbox.moe/kbbm5e.jpg' }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });
    } catch (e) {
        console.error('Fun Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
