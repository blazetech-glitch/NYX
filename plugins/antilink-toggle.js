const { cmd } = require('../command');
const pluginSettings = require('../lib/pluginSettings');

const enabled = value => ['true', 'on', 'enable', 'enabled', '1'].includes(String(value ?? '').toLowerCase());
const isOn = value => ['on', 'true', 'enable', 'enabled', '1'].includes(String(value ?? '').toLowerCase());

cmd({
  pattern: 'antilink',
  desc: 'Enable or disable anti-link for this group',
  category: 'admin',
  filename: __filename
}, async (conn, mek, m, { from, args, reply, isGroup, isAdmins, isCreator, isOwner }) => {
  try {
    const sub = String(args?.[0] || 'status').toLowerCase();

    if (!isGroup) return reply('❌ Use .antilink on/off inside the group you want to configure.');

    const groupValue = await pluginSettings.get(from, 'antilink');
    if (sub === 'status') {
      return reply(`🛡️ *Anti-link status*\n• This group: ${groupValue === undefined ? 'OFF by default' : enabled(groupValue) ? 'ON' : 'OFF'}\n\nUse .antilink on/off to change it.`);
    }

    if (!isAdmins && !isCreator && !isOwner) return reply('❌ Only a group admin or bot owner can change this group setting.');
    if (!['on', 'off', 'true', 'false'].includes(sub)) return reply('Usage: .antilink on | off | status');

    const value = isOn(sub);
    await pluginSettings.set(from, 'antilink', value);
    return reply(value
      ? '✅ Anti-link enabled for this group. Links will be removed and warned according to the group action setting.'
      : '✅ Anti-link disabled for this group. Links will not be moderated here.');
  } catch (error) {
    console.error('Anti-link toggle error:', error);
    return reply('❌ Could not update the anti-link setting.');
  }
});
