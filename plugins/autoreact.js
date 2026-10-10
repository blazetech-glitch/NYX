const fs = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '../config.env');
const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "autoreact",
    alias: ["auto-react"],
    desc: "Enable or disable autoreactions for ordinary messages",
    category: "settings",
    filename: __filename
},    
async (conn, mek, m, { from, args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply("*📛 Only the owner can use this command!*");

        const status = args[0]?.toLowerCase();
        if (!["on", "off"].includes(status)) {
            return reply("*🫟 Example: .auto-react on*");
        }

        const newValue = status === "on" ? "true" : "false";
        config.AUTO_REACT = newValue;

        // ✅ Update or add AUTO_REACT in config.env
        let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
        if (/AUTO_REACT\s*=.*/.test(envContent)) {
            envContent = envContent.replace(/AUTO_REACT\s*=.*/g, `AUTO_REACT=${newValue}`);
        } else {
            envContent += `\nAUTO_REACT=${newValue}`;
        }

        fs.writeFileSync(envFile, envContent.trim() + "\n");

        await reply(`✅ *Ordinary message autoreactions: ${status.toUpperCase()}.*\n📢 *Channel reactions remain independent and enabled.*`);

    } catch (e) {
        console.error(e);
        await reply("❌ Error updating auto-react setting: " + e.message);
    }
});
