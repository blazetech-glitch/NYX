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

        const text = `*┏────〘 BOT INFO 〙───⊷*\n` +
            `*┃* *Name:* ${config.BOT_NAME || pkg.name || 'NYX MD'}\n` +
            `*┃* *Owner:* ${config.OWNER_NAME || 'Owner'}\n` +
            `*┃* *Prefix:* ${config.PREFIX || '.'}\n` +
            `*┃* *Version:* ${pkg.version || '1.0.0'}\n` +
            `*┃* *Commands:* ${totalCmds}\n` +
            `*┃* *Uptime:* ${up}\n` +
            `*┃* *Memory:* ${usedMB} MB / ${totalMB} MB\n` +
            `*┃* *Node:* ${node}\n` +
            `*┃* *Platform:* ${platform}\n` +
            `*┃* *CPU:* ${cpu}\n` +
            `*┃* *Group Link:* ${config.GROUP_LINK || 'Not set'}\n` +
            `*┃* *Channel:* ${config.CHANNEL_LINK || 'Not set'}\n` +
            `*┗──────────────⊷*`;

        await conn.sendMessage(from, { text, contextInfo: { mentionedJid: [sender] } }, { quoted: mek });

    } catch (e) {
        console.error('Error in botinfo command:', e);
        reply(`An error occurred: ${e.message}`);
    }
});
