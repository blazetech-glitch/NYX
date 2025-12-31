const fs = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '../config.env');
const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: 'setprefix',
    alias: ['prefix'],
    desc: 'Set the bot command prefix (owner only)',
    category: 'settings',
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply('*📛 Only the owner can use this command!*');

        const newPrefix = args[0];
        if (!newPrefix) return reply('*🫟 Usage: .setprefix <prefix>  — e.g. .setprefix !  or .setprefix .  or .setprefix / *');

        // simple validation: no whitespace
        if (/\s/.test(newPrefix)) return reply('*❌ Prefix cannot contain spaces.*');

        // update runtime config
        config.PREFIX = newPrefix;

        // persist to config.env (create or replace PREFIX entry)
        let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
        if (/^PREFIX\s*=.*/m.test(envContent)) {
            envContent = envContent.replace(/^PREFIX\s*=.*/m, `PREFIX=${newPrefix}`);
        } else {
            envContent += `\nPREFIX=${newPrefix}`;
        }
        fs.writeFileSync(envFile, envContent.trim() + "\n");

        await reply(`✅ Prefix updated to *${newPrefix}*`);
    } catch (e) {
        console.error(e);
        await reply('❌ Error updating prefix: ' + e.message);
    }
});
