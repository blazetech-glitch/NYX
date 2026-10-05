const { cmd, commands } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');
const config = require('../config');
const { getMainImage } = require('../lib/branding');
const { userTag, context, image, version } = require('../lib/ui');

cmd({
  pattern: 'alive',
  alias: ['status', 'live'],
  desc: 'Check uptime and system status',
  category: 'main',
  react: '🟢',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const memory = process.memoryUsage();
    const usedMB = (memory.heapUsed / 1024 / 1024).toFixed(1);
    const totalMB = (memory.heapTotal / 1024 / 1024).toFixed(1);
    const cpu = os.cpus()[0]?.model || 'Unknown';
    const status = `╭━━━〔 *${config.BOT_NAME || 'NYX MD'}* 〕━━━╮
┃  *SYSTEM STATUS*
╰━━━━━━━━━━━━━━━━━━━━╯

┌─〔 HEALTH 〕
│ ● Online and ready
│ ⏱ Uptime   ${runtime(process.uptime())}
│ ⚡ Prefix   ${config.PREFIX || '.'}
│ ◈ Version  ${version()}
│ ◇ Commands ${commands.length}
└──────────────

┌─〔 RUNTIME 〕
│ Memory  ${usedMB} MB / ${totalMB} MB
│ Host    ${os.platform()} · ${os.arch()}
│ CPU     ${cpu.slice(0, 34)}${cpu.length > 34 ? '…' : ''}
└──────────────

_Requested by ${userTag(sender)}_`;

    await conn.sendMessage(from, {
      image: image(config, getMainImage),
      caption: status,
      contextInfo: context(sender)
    }, { quoted: mek });
  } catch (error) {
    console.error('Alive Error:', error);
    await reply('Unable to render the status card right now.');
  }
});
