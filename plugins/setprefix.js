const { cmd } = require('../command');
const { getPrefix, setPrefix, resetUserPrefix } = require('../lib/prefix');
const config = require('../config');

cmd({
    pattern: 'setprefix',
    alias: ['prefix', 'myprefix'],
    desc: 'Set your personal bot prefix',
    category: 'user',
    react: '🔧',
    filename: __filename
}, async (conn, mek, m, { from, sender, reply, args, isOwner }) => {
    try {
        const userId = sender.split('@')[0];

        if (!args[0]) {
            const currentUserPrefix = getPrefix(userId);
            const defaultPrefix = config.PREFIX;

            const message = `╭─❒ *PREFIX SETTINGS* ❒─╮
│
├─ 👤 *User:* @${userId}
├─ 🔧 *Your Prefix:* \`${currentUserPrefix}\`
├─ ⚙️ *Default Prefix:* \`${defaultPrefix}\`
│
├─ 📝 *Usage:*
│  \`${currentUserPrefix}setprefix <new_prefix>\`
│  \`${currentUserPrefix}setprefix reset\` (reset to default)
│
╰─❒ *${config.OWNER_NAME}* ❒─╯

> *Choose a prefix that doesn't conflict with other bots* ✨`;

            await conn.sendMessage(from, {
                image: require('../lib/branding').getMainImage() || { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kbbm5e.jpg' },
                caption: message,
                contextInfo: { mentionedJid: [sender] }
            }, { quoted: mek });
            return;
        }

        const newPrefix = args[0];

        if (newPrefix === 'reset') {
            const reset = resetUserPrefix(userId);
            if (reset) {
                await reply(`✅ *Prefix reset to default:* \`${config.PREFIX}\``);
            } else {
                await reply(`ℹ️ *You don't have a custom prefix set*`);
            }
            return;
        }

        // Validate prefix
        if (newPrefix.length > 5) {
            return reply('❌ *Prefix too long!* Maximum 5 characters allowed.');
        }

        if (newPrefix.includes(' ')) {
            return reply('❌ *Prefix cannot contain spaces!*');
        }

        if (newPrefix === config.PREFIX) {
            return reply('ℹ️ *This is already the default prefix*');
        }

        // Set the new prefix
        setPrefix(newPrefix, userId);

        const confirmMessage = `╭─❒ *PREFIX UPDATED* ❒─╮
│
├─ 👤 *User:* @${userId}
├─ ✅ *New Prefix:* \`${newPrefix}\`
├─ 🔄 *Old Prefix:* \`${getPrefix(userId) === newPrefix ? config.PREFIX : getPrefix(userId)}\`
│
├─ 📝 *Test it:*
│  \`${newPrefix}menu\` - Try this command
│
╰─❒ *${config.OWNER_NAME}* ❒─╯

> *Your personal prefix is now active!* ✨`;

        await conn.sendMessage(from, {
            image: require('../lib/branding').getMainImage() || { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/kbbm5e.jpg' },
            caption: confirmMessage,
            contextInfo: { mentionedJid: [sender] }
        }, { quoted: mek });

    } catch (error) {
        console.error('SetPrefix Error:', error);
        reply('❌ *Error setting prefix:* ' + error.message);
    }
});