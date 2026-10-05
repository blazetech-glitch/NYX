const { cmd } = require('../command');
const os = require('os');
const { runtime } = require('../lib/functions');
const config = require('../config');
const { getMainImage } = require('../lib/branding');
const { userTag, context, image, version } = require('../lib/ui');

cmd({
  pattern: 'alive2',
  react: '🧚‍♂️',
  desc: 'Show bot status card',
  category: 'main',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const used = (process.memoryUsage().heapUsed / 1024 / 1024).toFixed(1);
    const caption = `╭━━━〔 *${config.BOT_NAME || 'NYX MD'}* 〕━━━╮
┃  *QUICK STATUS*
╰━━━━━━━━━━━━━━━━━━━━╯

┌─〔 READY 〕
│ ● Online
│ ⏱ Uptime   ${runtime(process.uptime())}
│ ◈ Version  ${version()}
│ Memory    ${used} MB
│ Host      ${os.platform()} · ${os.arch()}
└──────────────

_Requested by ${userTag(sender)}_`;
    await conn.sendMessage(from, {
      image: image(config, getMainImage),
      caption,
      contextInfo: context(sender)
    }, { quoted: mek });
  } catch (error) {
    console.error('Alive2 Error:', error);
    await reply('Unable to render the status card right now.');
  }
});
