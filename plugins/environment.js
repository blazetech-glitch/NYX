const { cmd } = require('../command');
const config = require('../config');

cmd({
  pattern: 'environment',
  alias: ['env'],
  desc: 'Show basic environment info',
  category: 'settings',
  filename: __filename
}, async (conn, mek, m, { reply }) => {
  try {
    const msg = `*Environment Info*\n\n` +
      `• PREFIX: ${config.PREFIX || 'N/A'}\n` +
      `• MODE: ${config.MODE || 'N/A'}\n` +
      `• SESSION_ID: ${config.SESSION_ID ? 'configured' : 'missing'}\n` +
      `• GROUP_LINK: ${config.GROUP_LINK || 'none'}\n` +
      `• CHANNEL_LINK: ${config.CHANNEL_LINK || 'none'}`;
    return reply(msg);
  } catch (error) {
    console.error('environment plugin error:', error);
    return reply('Error retrieving environment info.');
  }
});
