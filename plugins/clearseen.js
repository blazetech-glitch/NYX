const { cmd } = require('../command');

cmd({
  pattern: 'clearseen',
  alias: ['read', 'markseen'],
  desc: 'Mark the current or replied message as read',
  category: 'tools',
  filename: __filename
}, async (conn, mek, m, { from, reply }) => {
  try {
    const targetKey = m?.quoted?.key || mek?.key;
    if (!targetKey) return reply('❌ No message key was available.');
    await conn.readMessages([targetKey]);
    return reply('✅ Message marked as seen. WhatsApp cannot remove a read receipt after it has been sent.');
  } catch (error) {
    console.error('Clear seen error:', error);
    return reply(`❌ Could not mark the message as seen: ${error.message || 'unknown error'}`);
  }
});
