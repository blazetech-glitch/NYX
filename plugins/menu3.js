const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const config = require('../config');
const moment = require('moment-timezone');
const { runtime } = require('../lib/functions');
const { getMainImage } = require('../lib/branding');
const { userTag, context, image, version, cyberText } = require('../lib/ui');

cmd({
  pattern: 'menu3',
  alias: ['hmenu'],
  desc: 'Show compact menu',
  category: 'menu',
  react: '📋',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const now = moment().tz(config.TIMEZONE || 'Africa/Nairobi');
    const text = `╭━━━〔 *${config.BOT_NAME || 'NYX MD'}* 〕━━━╮
┃  *QUICK ACCESS*
╰━━━━━━━━━━━━━━━━━━━━╯

┌─〔 MENUS 〕
│ ${cyberText('menu')}       \`${prefix}menu\`       All commands
│ ${cyberText('menu2')}      \`${prefix}menu2\`      Menu panel
│ ${cyberText('groupmenu')}  \`${prefix}groupmenu\`  Group tools
│ ${cyberText('aimenu')}     \`${prefix}aimenu\`     AI features
│ ${cyberText('searchmenu')} \`${prefix}searchmenu\` Search tools
│ ${cyberText('funmenu')}    \`${prefix}funmenu\`    Fun commands
│ ${cyberText('owner')}      \`${prefix}owner\`      Owner panel
│ ${cyberText('othermenu')}  \`${prefix}othermenu\`  Other tools
└──────────────

User    ${userTag(sender)}
Uptime  ${runtime(process.uptime())}
Time    ${now.format('HH:mm')} · ${now.format('DD MMM YYYY')}
Version ${version()}

_Type ${prefix} before a command_`;

    await conn.sendMessage(from, {
      image: image(config, getMainImage),
      caption: text,
      contextInfo: context(sender)
    }, { quoted: mek });
  } catch (error) {
    console.error('Menu3 Error:', error);
    await reply('Unable to display the quick menu right now.');
  }
});
