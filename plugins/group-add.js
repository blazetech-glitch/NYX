const { cmd } = require('../command');

async function resolveBotAdminStatus(conn, from, { isBotAdmins, botNumber2, botNumber, groupMetadata }) {
  if (isBotAdmins) return true;

  try {
    const metadataSource = typeof groupMetadata === 'function'
      ? groupMetadata
      : (typeof conn?.groupMetadata === 'function' ? conn.groupMetadata : null);

    const metadata = metadataSource
      ? await metadataSource(from)
      : (groupMetadata && typeof groupMetadata === 'object' ? groupMetadata : null);

    if (metadata && Array.isArray(metadata.participants)) {
      const botJid = botNumber2 || botNumber || (conn?.user?.id ? conn.user.id.split(':')[0] : null);
      const adminList = metadata.participants
        .filter((p) => p && p.admin)
        .map((p) => p.id);

      if (!botJid) return false;

      return adminList.some((adminJid) => {
        if (!adminJid) return false;
        const normalizedAdmin = String(adminJid).split(':')[0];
        const normalizedBot = String(botJid).split(':')[0];
        return normalizedAdmin === normalizedBot || normalizedAdmin.includes(normalizedBot?.split('@')[0]);
      });
    }
  } catch (err) {
    console.error('Error resolving bot admin status:', err);
  }

  return false;
}

cmd({
  pattern: 'add',
  alias: ['invite', 'addmember', 'summon'],
  desc: 'Add member(s) to the group by number, mention, or reply',
  category: 'group',
  filename: __filename
}, async (conn, mek, m, { from, args, reply, isGroup, isBotAdmins, isAdmins, sender, botNumber2, botNumber, groupMetadata }) => {
  try {
    if (!isGroup) return reply('❌ This command can only be used in groups.');
    if (!isAdmins && !sender.includes(require('../config').OWNER_NUMBER)) return reply('❌ Only group admins can add members.');

    const botIsAdmin = await resolveBotAdminStatus(conn, from, { isBotAdmins, botNumber2, botNumber, groupMetadata });
    if (!botIsAdmin) return reply('❌ I need to be group admin to add members.');

    let targets = [];

    // Extract from mentions in the command
    if (m.mentionedJid && m.mentionedJid.length > 0) {
      targets = m.mentionedJid;
    }
    // Extract from replied message
    else if (m.quoted && m.quoted.sender) {
      targets = [m.quoted.sender];
    }
    // Extract from args (phone number)
    else if (args && args.length > 0) {
      const numbers = args.join(' ').split(/[,\s]+/).filter(Boolean);
      for (const num of numbers) {
        const clean = String(num).replace(/[^0-9]/g, '');
        if (clean.length > 0) {
          targets.push(clean + '@s.whatsapp.net');
        }
      }
    }

    if (!targets.length) {
      return reply('❌ Usage: .add <@mention or number>\nExample: .add 255712345678');
    }

    // Remove duplicates
    targets = [...new Set(targets)];

    // Attempt to add
    try {
      await conn.groupParticipantsUpdate(from, targets, 'add');
      const mentions = targets.map(t => t.split('@')[0]).join(', ');
      return reply(`✅ Added ${mentions} to the group!`, { mentions: targets });
    } catch (err) {
      console.error('Add members error:', err);
      return reply(`❌ Failed to add members. Error: ${err.message || err}`);
    }
  } catch (e) {
    console.error('Error in .add command:', e);
    reply('⚠️ An error occurred.');
  }
});

module.exports = {
  resolveBotAdminStatus,
};
