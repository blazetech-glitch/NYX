const { cmd } = require('../command');

const STATUS_JID = 'status@broadcast';

function mediaType(quoted) {
  const type = String(quoted?.mtype || '').toLowerCase();
  const mime = String(quoted?.mimetype || '').toLowerCase();
  if (type.includes('video') || mime.startsWith('video/')) return 'video';
  if (type.includes('audio') || mime.startsWith('audio/')) return 'audio';
  if (type.includes('image') || mime.startsWith('image/')) return 'image';
  return null;
}

function normalizeJid(value) {
  if (!value) return null;
  const jid = String(value).trim();
  if (!jid) return null;
  if (jid.includes('@')) return jid;
  return `${jid}@s.whatsapp.net`;
}

function statusRecipients(conn) {
  // WhatsApp requires a non-empty statusJidList for status@broadcast.
  // Allow an explicit list in Render/Sandbox, otherwise include the bot's own JID.
  const configured = String(process.env.STATUS_JID_LIST || '')
    .split(',')
    .map(normalizeJid)
    .filter(Boolean);
  const self = normalizeJid(conn?.user?.id?.split(':')[0]);
  const recipients = new Set(configured);
  if (self) recipients.add(self);
  return [...recipients];
}

cmd({
  pattern: 'status',
  alias: ['poststatus', 'story'],
  react: '📸',
  desc: 'Post replied image, video, audio, or text to WhatsApp Status',
  category: 'owner',
  filename: __filename
}, async (conn, mek, m, { isOwner, reply, q }) => {
  if (!isOwner) return reply('❌ Only the bot owner can post a status.');

  try {
    const quoted = m?.quoted;
    const type = mediaType(quoted);
    if (!quoted || !type) {
      return reply('📸 Reply to an image, video, or audio message, then use .status.');
    }

    const buffer = await quoted.download();
    if (!buffer || !buffer.length) return reply('❌ The replied media could not be downloaded.');

    const caption = quoted.caption || quoted.text || '';
    const payload = {
      [type]: buffer,
      ...(caption ? { caption } : {})
    };
    if (type === 'audio') payload.ptt = false;

    const statusJidList = statusRecipients(conn);
    if (!statusJidList.length) {
      return reply('❌ No status recipient is available. Set STATUS_JID_LIST or reconnect the bot.');
    }

    await conn.sendMessage(STATUS_JID, payload, {
      broadcast: true,
      statusJidList
    });
    return reply('✅ Real WhatsApp Status posted successfully.');
  } catch (error) {
    console.error('Status post error:', error);
    return reply(`❌ Status was not posted: ${error.message || 'unknown error'}`);
  }
});

module.exports = { mediaType, statusRecipients };
