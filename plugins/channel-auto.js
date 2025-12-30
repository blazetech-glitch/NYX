const fs = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '../config.env');
const { cmd } = require('../command');
const config = require('../config');

// Toggle auto react for channel messages
cmd({
    pattern: "channel-react",
    alias: ["channelreact"],
    desc: "Enable or disable auto react for configured channel messages",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("*📛 Only the owner can use this command!*");

        const status = args[0]?.toLowerCase();
        if (!["on", "off"].includes(status)) return reply("*🫟 Example: .channel-react on*");

        const newValue = status === "on" ? "true" : "false";
        config.CHANNEL_AUTO_REACT = newValue;

        let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
        if (/CHANNEL_AUTO_REACT\s*=.*/.test(envContent)) {
            envContent = envContent.replace(/CHANNEL_AUTO_REACT\s*=.*/g, `CHANNEL_AUTO_REACT=${newValue}`);
        } else {
            envContent += `\nCHANNEL_AUTO_REACT=${newValue}`;
        }
        fs.writeFileSync(envFile, envContent.trim() + "\n");

        await reply(`✅ *Channel auto-react has been turned ${status.toUpperCase()}.*`);
    } catch (e) {
        console.error(e);
        await reply("❌ Error updating channel auto-react: " + e.message);
    }
});

// Set channel link to follow/react to
cmd({
    pattern: "setchannel",
    alias: ["set-channel"],
    desc: "Set the channel link to auto-follow/react (whatsapp channel url)",
    category: "settings",
    filename: __filename
}, async (conn, mek, m, { from, args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("*📛 Only the owner can use this command!*");
        const link = args[0];
        if (!link || !link.includes('whatsapp.com/channel')) return reply("❌ Provide a valid WhatsApp channel link.");

        config.CHANNEL_LINK = link;

        let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
        if (/CHANNEL_LINK\s*=.*/.test(envContent)) {
            envContent = envContent.replace(/CHANNEL_LINK\s*=.*/g, `CHANNEL_LINK=${link}`);
        } else {
            envContent += `\nCHANNEL_LINK=${link}`;
        }
        fs.writeFileSync(envFile, envContent.trim() + "\n");

        await reply(`✅ Channel link updated.`);
    } catch (e) {
        console.error(e);
        await reply("❌ Error updating channel link: " + e.message);
    }
});
