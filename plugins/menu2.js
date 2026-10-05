const config = require('../config');
const moment = require('moment-timezone');
const { cmd } = require('../command');
const { getPrefix } = require('../lib/prefix');
const { getMainImage } = require('../lib/branding');
const { userTag, context, image, version, cyberText } = require('../lib/ui');

cmd({
  pattern: 'menu2',
  alias: ['panel', 'menus'],
  desc: 'Show button navigation panel',
  category: 'menu',
  react: '👌',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const now = moment().tz(config.TIMEZONE || 'Africa/Nairobi');
    const buttons = [
      ['⌂  Main menu', 'menu', 'All commands'],
      ['↓  Downloads', 'dlmenu', 'Download tools'],
      ['♧  Group tools', 'groupmenu', 'Group management'],
      ['◎  AI tools', 'aimenu', 'Artificial intelligence'],
      ['⌕  Search', 'searchmenu', 'Search and discovery'],
      ['◇  Fun', 'funmenu', 'Games and entertainment'],
      ['♛  Owner', 'owner', 'Owner controls'],
      ['▣  Other', 'othermenu', 'Utilities and information']
    ].map(([display, command, description], index) => ({
      buttonId: `${prefix}${command}`,
      buttonText: { displayText: `${cyberText(display)}\n${description}` },
      type: 1,
      index
    }));

    const caption = `╭━━━〔 *${config.BOT_NAME || 'NYX MD'}* 〕━━━╮
┃       *NAVIGATION PANEL*
╰━━━━━━━━━━━━━━━━━━━━╯

★ *USER*    : ${userTag(sender)}
★ *TIME*    : ${now.format('HH:mm · DD MMM YYYY')}
★ *VERSION* : ${version()}

_Select a button to open a section._`;

    await conn.sendMessage(from, {
      image: image(config, getMainImage),
      caption,
      footer: `NYX MD · ${config.OWNER_NAME || 'BLAZE TECH'}`,
      buttons,
      headerType: 4,
      contextInfo: context(sender)
    }, { quoted: mek });
  } catch (error) {
    console.error('Menu2 Error:', error);
    await reply('Unable to display the button panel right now. Use .menu3 instead.');
  }
});
