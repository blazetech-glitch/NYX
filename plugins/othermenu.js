const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');
const { getMainImage } = require('../lib/branding');
const { userTag, context, image } = require('../lib/ui');

cmd({
  pattern: 'othermenu',
  alias: ['other'],
  desc: 'Show utility commands',
  category: 'other',
  react: '📁',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const now = moment().tz(config.TIMEZONE || 'Africa/Nairobi');
    const rows = [
      ['Bot information', 'botinfo', 'View bot details'],
      ['Owner information', 'owner', 'View owner details'],
      ['System response', 'ping', 'Measure response time'],
      ['System status', 'alive', 'View health and uptime']
    ].map(([title, command, description]) => ({ title, rowId: `${prefix}${command}`, description }));

    await conn.sendMessage(from, {
      text: `╭━━━〔 *${config.BOT_NAME || 'NYX MD'}* 〕━━━╮\n┃  *UTILITY CENTER*\n╰━━━━━━━━━━━━━━━━━━━━╯\n\nUser  ${userTag(sender)}\nTime  ${now.format('HH:mm')} · ${now.format('DD MMM YYYY')}\n\n_Select a utility below._`,
      footer: `NYX MD  ·  ${config.OWNER_NAME || 'BLAZE TECH'}`,
      buttonText: 'Open utilities',
      sections: [{ title: 'Available utilities', rows }],
      headerType: 1,
      contextInfo: context(sender),
      image: image(config, getMainImage)
    }, { quoted: mek });
  } catch (error) {
    console.error('Other Menu Error:', error);
    await reply('Unable to display the utility menu right now.');
  }
});
