const config = require('../config');
const { cmd } = require('../command');
const { runtime } = require('../lib/functions');
const { getMainImage } = require('../lib/branding');
const { userTag, context, image, version } = require('../lib/ui');

cmd({
  pattern: 'ping',
  alias: ['speed', 'pong', 'ping2'],
  desc: "Check bot's response time",
  category: 'main',
  react: '⚡',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const caption = `╭━━━〔 *${config.BOT_NAME || 'NYX MD'}* 〕━━━╮
┃        *PONG · ONLINE*
╰━━━━━━━━━━━━━━━━━━━━╯

│ ⏱ *Uptime*   ${runtime(process.uptime())}
│ ◈ *Version*  ${version()}
│ ● *Status*   Ready

_Requested by ${userTag(sender)}_`;

    await conn.sendMessage(from, {
      image: image(config, getMainImage),
      caption,
      contextInfo: context(sender)
    }, { quoted: mek });
  } catch (error) {
    console.error('Ping Error:', error);
    await reply('Ping failed. Please try again.');
  }
});
