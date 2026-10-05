const config = require('../config');
const { cmd } = require('../command');

function normalizeJid(value) {
  if (!value) return null;
  const raw = String(value).trim();
  if (raw.includes('@')) return raw;
  const digits = raw.replace(/\D/g, '');
  return digits ? `${digits}@s.whatsapp.net` : null;
}

cmd({
  pattern: 'addmeta',
  alias: ['addmetai', 'metaai'],
  desc: 'Add Meta AI to the current group when the bot is an admin',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, { from, args, reply, isGroup, isBotAdmins, isAdmins, isOwner }) => {
  if (!isGroup) return reply('❌ This command can only be used in a group.');
  if (!isAdmins && !isOwner) return reply('❌ Only a group admin or the bot owner can use this command.');
  if (!isBotAdmins) {
    return reply('❌ WhatsApp only allows group admins to add members. Promote the bot to admin first, then run this command again.');
  }

  const target = normalizeJid(args?.[0] || process.env.META_AI_JID || config.META_AI_JID);

  try {
    await conn.groupParticipantsUpdate(from, [target], 'add');
    return reply(`✅ Add request sent for Meta AI: ${target}`);
  } catch (error) {
    console.error('Meta AI group add error:', error);
    return reply(`❌ WhatsApp rejected the add request: ${error.message || 'permission or account restriction'}`);
  }
});
