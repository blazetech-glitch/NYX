const { cmd } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: 'alive2',
    react: '🧚‍♂️',
    desc: 'Check bot commands',
    category: 'main',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const senderName = m.pushName || 'User';
        const caption = `
*👋 Hello ${senderName}, Welcome to NYX-XD ❄️*

╭──────────────●●►
🛠️ Version: ${require('../package.json').version}
📟 RAM Usage: ${(process.memoryUsage().heapUsed / 1024 / 1024).toFixed(2)}MB / ${Math.round(os.totalmem() / 1024 / 1024)}MB
⏱️ Runtime: ${runtime(process.uptime())}
👨‍💻 Owner: ${config.OWNER_NAME || 'T20_STARBOY'}
╰──────────────●●►

❐ *NYX-XD BOT MENU LIST ☣*
> Created by Arnold Tarimo
        `;

        const imageUrl = 'https://files.catbox.moe/joo2gt.jpg';
        const buttons = [
            { buttonId: 'id1', buttonText: { displayText: '👨‍💻 Contact Owner' }, type: 1 },
            { buttonId: 'id2', buttonText: { displayText: '📜 MENU' }, type: 1 },
            { buttonId: 'id3', buttonText: { displayText: '🏓 PING' }, type: 1 }
        ];

        await conn.sendMessage(from, {
            image: { url: imageUrl },
            caption,
            footer: '© NYX-XD Bot',
            buttons,
            headerType: 1,
            mentions: [m.sender]
        }, { quoted: mek });
    } catch (e) {
        console.error(e);
        reply(`Error: ${e.message}`);
    }
});

module.exports = {};
