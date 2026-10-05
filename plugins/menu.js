const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const { getPrefix } = require('../lib/prefix');
const { getMainImage } = require('../lib/branding');
const { userTag, version, context, image, cyberText } = require('../lib/ui');

const normalize = (value) => String(value).toLowerCase().replace(/\s+menu$/, '').trim();
const categoryIcons = {
  ai: '◈', anime: '✦', audio: '♫', bible: '✧', download: '↓', downloader: '↓',
  fun: '♢', game: '♢', group: '♧', img_edit: '✎', info: 'ⓘ', information: 'ⓘ',
  logo: '▣', main: '⌂', media: '▶', menu: '☰', misc: '◇', music: '♫', other: '•',
  owner: '♛', privacy: '⌾', search: '⌕', settings: '⚙', sticker: '✿', tools: '⚒',
  user: '♙', utilities: '⌘', utility: '⌘', wallpapers: '▧', whatsapp: '◉'
};

cmd({
  pattern: 'menu',
  alias: ['allmenu'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '👌',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const now = moment().tz(config.TIMEZONE || 'Africa/Nairobi');
    const categories = {};

    // Build a deterministic, de-duplicated catalogue from the registered plugins.
    for (const item of commands) {
      if (!item.category || item.dontAdd || !item.pattern) continue;
      const category = normalize(item.category);
      categories[category] ??= new Set();
      categories[category].add(item.pattern.split('|')[0].trim());
    }

    let menu = `╭━━━〔 *${config.BOT_NAME || 'NYX MD'}* 〕━━━╮
┃       *COMMAND DIRECTORY*
╰━━━━━━━━━━━━━━━━━━━━╯

*╭─〔 ★ BOT OVERVIEW 〕*
│ ★ *USER*    : ${userTag(sender)}
│ ★ *STATUS*  : ONLINE
│ ★ *UPTIME*  : ${runtime(process.uptime())}
│ ★ *PREFIX*  : \`${prefix}\`
│ ★ *VERSION* : ${version()}
*╰──────────────────╯*

*✦━━━━━━━━━━━━━━━━━━━━✦*
*★ READ MORE FOR COMMANDS ★*
*✦━━━━━━━━━━━━━━━━━━━━✦*

`;

    for (const category of Object.keys(categories).sort()) {
      const list = [...categories[category]].sort();
      const icon = categoryIcons[category] || '•';
      menu += `*╭─〔 ${icon} ${category.toUpperCase()} 〕*\n`;
      for (const command of list) {
        menu += `│ • ${cyberText(command)}  \`${prefix}${command}\`\n`;
      }
      menu += '*╰──────────────────╯*\n\n';
    }

    menu += `_${prefix}menu2 for navigation  ·  ${prefix}menu3 for quick access_\n_${now.format('DD MMM YYYY · HH:mm')}_`;

    await conn.sendMessage(from, {
      image: image(config, getMainImage),
      caption: menu,
      contextInfo: context(sender)
    }, { quoted: mek });
  } catch (error) {
    console.error('Menu Error:', error);
    await reply('Unable to display the menu right now. Please try again.');
  }
});
