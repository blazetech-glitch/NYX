const { cmd } = require('../command');
const config = require('../config');

const linkPatterns = [
  /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/gi,
  /^https?:\/\/(www\.)?whatsapp\.com\/channel\/([a-zA-Z0-9_-]+)$/,
  /wa\.me\/\S+/gi,
  /https?:\/\/(?:t\.me|telegram\.me)\/\S+/gi,
  /https?:\/\/(?:www\.)?youtube\.com\/\S+/gi,
  /https?:\/\/youtu\.be\/\S+/gi,
  /https?:\/\/(?:www\.)?facebook\.com\/\S+/gi,
  /https?:\/\/fb\.me\/\S+/gi,
  /https?:\/\/(?:www\.)?instagram\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitter\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?tiktok\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?linkedin\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?snapchat\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?pinterest\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?reddit\.com\/\S+/gi,
  /https?:\/\/ngl\/\S+/gi,
  /https?:\/\/(?:www\.)?discord\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?twitch\.tv\/\S+/gi,
  /https?:\/\/(?:www\.)?vimeo\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/gi,
  /https?:\/\/(?:www\.)?medium\.com\/\S+/gi
];

cmd({
  on: 'body'
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins
}) => {
  try {
    // Skip if not a group or bot is not admin
    if (!isGroup || !isBotAdmins) {
      return;
    }

    // Check per-group override for delete_links
    let deleteLinksEnabled = config.DELETE_LINKS === 'true';
    try {
      const override = await (require('../lib/pluginSettings')).get(from, 'delete_links');
      if (override !== undefined) deleteLinksEnabled = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
    } catch (err) {
      console.error('Error reading plugin setting (delete_links):', err);
    }

    // Allow admins to send links without deletion
    if (isAdmins) {
      return;
    }

    const containsLink = linkPatterns.some(pattern => pattern.test(body));

    if (containsLink && deleteLinksEnabled) {
      try {
        const delKey = {
          remoteJid: from,
          fromMe: false,
          id: m.key && m.key.id ? m.key.id : (m.id || ''),
          participant: m.key && m.key.participant ? m.key.participant : (m.participant || undefined)
        };
        await conn.sendMessage(from, { delete: delKey }, { quoted: m });
      } catch (err) {
        try {
          await conn.sendMessage(from, { delete: m.key }, { quoted: m });
        } catch (e) {
          console.error('Failed to delete link message (delete-links):', e && e.message ? e.message : e);
        }
      }
    }
  } catch (error) {
    console.error(error);
  }
});