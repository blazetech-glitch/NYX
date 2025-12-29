const { cmd, commands } = require('../command');
const os = require('os');
const { runtime, getBuffer } = require('../lib/functions');
const config = require('../config');

cmd({
    pattern: 'alive',
    alias: ['status', 'live'],
    desc: 'Check uptime and system status',
    category: 'main',
    react: '🟢',
    filename: __filename
},
    async (conn, mek, m, { from, sender, reply }) => {
        try {
            const totalCmds = commands.length;
            const up = runtime(process.uptime());
            const mem = process.memoryUsage();
            const usedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
            const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);
            const platform = `${os.type()} ${os.release()} ${os.arch()}`;
            const cpu = os.cpus()[0].model;

            const aliveText = `*┏────〘 ${config.BOT_NAME || 'NYX MD'} 〙───⊷*
*┃* *👑 Owner:* ${config.OWNER_NAME || 'Owner'}
*┃* *🔹 Prefix:* ${config.PREFIX || '.'}
*┃* *🧩 Version:* 1.0.0 Beta
*┃* *📁 Commands:* ${totalCmds}
*┃* *⏱ Uptime:* ${up}
*┃* *💾 Memory:* ${usedMB} MB / ${totalMB} MB
*┃* *🖥 Platform:* ${platform}
*┃* *⚙️ CPU:* ${cpu}
*┃* *🔗 Group:* ${config.GROUP_LINK || 'Not set'}
*┃* *🔔 Channel:* ${config.CHANNEL_LINK || 'Not set'}
*┗──────────────⊷*`;

            // try to send an image (alive image) with the card
            try {
                const img = config.ALIVE_IMG || config.MENU_IMAGE_URL;
                await conn.sendMessage(from, {
                    image: { url: img },
                    caption: aliveText,
                    contextInfo: { mentionedJid: [sender] }
                }, { quoted: mek });
            } catch (err) {
                // fallback to text only
                await conn.sendMessage(from, { text: aliveText, contextInfo: { mentionedJid: [sender] } }, { quoted: mek });
            }

        } catch (e) {
            console.error('Error in alive command:', e);
            reply(`An error occurred: ${e.message}`);
        }
    });
