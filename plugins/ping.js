const config = require('../config');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');

cmd({
    pattern: "ping",
    alias: ["speed", "pong", "ping2"],
    desc: "Check bot's response time and system stats.",
    category: "main",
    react: "⚡",
    filename: __filename
},
    async (conn, mek, m, { from, quoted, sender, reply }) => {
        try {
            const start = Date.now();
            const loading = await conn.sendMessage(from, { text: '*Pinging...*' });

            // small reaction for flair
            try { await conn.sendMessage(from, { react: { text: '⚡', key: mek.key } }) } catch (e) { }

            const end = Date.now();
            const latency = end - start; // ms

            const up = runtime(process.uptime());
            const mem = process.memoryUsage();
            const usedMB = (mem.heapUsed / 1024 / 1024).toFixed(2);
            const totalMB = (mem.heapTotal / 1024 / 1024).toFixed(2);

            const platform = `${os.type()} ${os.arch()} (${os.platform()})`;
            const cpus = os.cpus()[0].model;

            const nice = `⚡ *PONG!* ${['🚀', '🌟', '💫', '🔥'][Math.floor(Math.random() * 4)]}\n*Latency:* ${latency} ms\n*Uptime:* ${up}\n*Memory:* ${usedMB} MB / ${totalMB} MB\n*Platform:* ${platform}\n*CPU:* ${cpus}\n*Bot:* ${config.BOT_NAME}\n*Owner:* ${config.OWNER_NAME}\n`;

            await conn.sendMessage(from, {
                image: { url: config.MENU_IMAGE_URL },
                caption: nice,
                contextInfo: { mentionedJid: [sender] }
            }, { quoted: loading }).catch(() => {
                // fallback to text only
                conn.sendMessage(from, { text: nice }, { quoted: loading }).catch(() => { });
            });

        } catch (e) {
            console.error("Error in ping command:", e);
            reply(`An error occurred: ${e.message}`);
        }
    });
