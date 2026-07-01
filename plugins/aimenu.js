const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');

cmd({
    pattern: 'aimenu',
    alias: ['aimen', 'aicommands'],
    desc: 'Show all AI commands',
    category: 'ai',
    react: '🤖',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const prefix = getPrefix();
        const time = moment().tz(config.TIMEZONE || 'Africa/Dodoma').format('HH:mm:ss');
        const date = moment().tz(config.TIMEZONE || 'Africa/Dodoma').format('dddd, DD MMMM YYYY');

        const aiRows = [
            { title: "Chat with AI", rowId: `${prefix}chatgpt`, description: "Talk with the AI" },
            { title: "Image AI", rowId: `${prefix}fluxai`, description: "Generate AI images" },
            { title: "Stable Diffusion", rowId: `${prefix}stablediffusion`, description: "Stable Diffusion images" }
        ];

        const listMessage = {
            text: "*🤖 AI MENU*\n\nSelect a command below:",
            footer: `🌟 SUPËR-MD Bot | supër Tëch 🌟\n👤 User: @${sender.split('@')[0]}\n📅 ${time} • ${date}`,
            buttonText: "Open AI Menu",
            sections: [{ title: "AI Commands", rows: aiRows }],
            headerType: 1,
            contextInfo: { mentionedJid: [sender] },
            image: { url: "https://files.catbox.moe/kbbm5e.jpg" }
        };

        await conn.sendMessage(from, listMessage, { quoted: mek });
    } catch (e) {
        console.error('AI Menu Error:', e);
        await reply(`❌ Error: ${e.message}`);
    }
});
