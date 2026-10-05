const { cmd } = require('../command');

function mediaType(quoted) {
  const type = String(quoted?.mtype || '').toLowerCase();
  const mime = String(quoted?.mimetype || '').toLowerCase();
  if (type.includes('video') || mime.startsWith('video/')) return 'video';
  if (type.includes('audio') || mime.startsWith('audio/')) return 'audio';
  if (type.includes('image') || mime.startsWith('image/')) return 'image';
  return null;
}

cmd({
  pattern: 'status',
  alias: ['poststatus', 'story'],
  react: '📸',
  desc: 'Post replied image, video, audio, or text to WhatsApp Status',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { isOwner, reply }) => {
  if (!isOwner) return reply('❌ Only the bot owner can post a status.');

  try {
    const quoted = m?.quoted;
    const type = mediaType(quoted);
    if (!quoted || !type) {
      return reply('📸 Reply to an image, video, or audio message, then use .status.');
    }

    const buffer = await quoted.download();
    if (!buffer || !buffer.length) return reply('❌ The replied media could not be downloaded.');

    const payload = {
      [type]: buffer,
      ...(quoted.text ? { caption: quoted.text } : {})
    };
    if (type === 'audio') payload.ptt = false;

    await conn.sendMessage('status@broadcast', payload);
    return reply('✅ Real WhatsApp Status posted successfully.');
  } catch (error) {
    console.error('Status post error:', error);
    return reply(`❌ Status was not posted: ${error.message || 'unknown error'}`);
  }
});
