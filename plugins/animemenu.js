const { cmd } = require('../command');
const config = require('../config');
const { getPrefix } = require('../lib/prefix');

cmd({
  pattern: 'animemenu',
  alias: ['anime'],
  desc: 'Show all Anime commands',
  category: 'anime',
  react: '🍥',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix(sender.split('@')[0]) || config.PREFIX || '.';
    const now = new Date().toLocaleString('en-US', { timeZone: config.TIMEZONE || 'UTC', hour12: false });
    const message = `🍥 ANIME MENU\n\n` +
      `• ${prefix}ranime - Random anime image\n` +
      `• ${prefix}waifu - Get waifu picture\n` +
      `• ${prefix}neko - Get neko image\n\n` +
      `User: @${sender.split('@')[0]}\n` +
      `Time: ${now}`;

    await conn.sendMessage(from, { text: message, contextInfo: { mentionedJid: [sender] } }, { quoted: mek });
  } catch (e) {
    console.error('Anime menu error:', e);
    await reply(`❌ Error: ${e?.message || 'Could not open anime menu'}`);
  }
});
