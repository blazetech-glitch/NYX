const { cmd, commands } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');
const config = require('../config');
const pkg = require('../package.json');

cmd({
    pattern: 'botinfo',
    alias: ['info', 'about'],
    desc: "Show bot information and stats",
    category: 'main',
    react: '🤖',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
    try {
        const totalCmds = commands.length;
        const up = runtime(process.uptime());
        const mem = process.memoryUsage();
        const usedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
        const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);

        const node = process.version;
        const platform = `${os.type()} ${os.release()} ${os.arch()}`;
        const cpu = os.cpus()[0].model;

        const text = `╔════════════════════════════╗
║   🤖 *BOT INFORMATION* 🤖  ║
╚════════════════════════════╝

╭─────────────────────────────╮
│ 📋 *DETAILS*
├─────────────────────────────┤
│ 🏷️  Name: *${config.BOT_NAME || pkg.name || 'SUPËR-MD'}*
│ 👑 Owner: *${config.OWNER_NAME || 'Owner'}*
│ 🔑 Prefix: *${config.PREFIX || '.'}*
│ 📦 Version: *${pkg.version || '3.0.0'}*
│ 🧩 Commands: *${totalCmds}*
├─────────────────────────────┤
│ ⏱️  Uptime: ${up}
│ 💾 Memory: ${usedMB} MB / ${totalMB} MB
│ 🖥️  Platform: ${platform}
│ 🔧 Node: ${node}
│ ⚙️  CPU: ${cpu.substring(0, 25)}...
╰─────────────────────────────╯

*> Powered by @whiskeysockets/baileys*`;

        // Build buttons for links
        const buttons = [];
        if (config.GROUP_LINK) {
            buttons.push({
                buttonId: 'group_link',
                buttonText: { displayText: '👥 Join Group' },
                type: 1
            });
        }
        if (config.CHANNEL_LINK) {
            buttons.push({
                buttonId: 'channel_link',
                buttonText: { displayText: '📢 Follow Channel' },
                type: 1
            });
        }

        buttons: buttons,
            headerType: 1,
                contextInfo: { mentionedJid: [sender] }
    }, { quoted: mek });
        } else {
    // Fallback to plain text if no links configured
    await conn.sendMessage(from, { text, contextInfo: { mentionedJid: [sender] } }, { quoted: mek });
}

    } catch (e) {
    console.error('Error in botinfo command:', e);
    reply(`An error occurred: ${e.message}`);
}
});
