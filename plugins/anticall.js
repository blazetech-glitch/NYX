const fs = require('fs');
const path = require('path');
const envFile = path.join(__dirname, '../config.env');
const { cmd } = require('../command');
const config = require('../config');

cmd({
    pattern: "anticall",
    alias: ["anti-call"],
    desc: "Enable or disable the anticall feature",
    category: "settings",
    filename: __filename
},
    async (conn, mek, m, { from, args, isCreator, reply }) => {
        try {
            if (!isCreator) return reply("*📛 Only the owner can use this command!*");

            const status = args[0]?.toLowerCase();
            if (!["on", "off"].includes(status)) {
                return reply("*🫟 Example: .anticall on*");
            }

            const newValue = status === "on" ? "true" : "false";
            config.ANTI_CALL = newValue;

            // Update or add ANTI_CALL in config.env
            let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
            if (/ANTI_CALL\s*=.*/.test(envContent)) {
                envContent = envContent.replace(/ANTI_CALL\s*=.*/g, `ANTI_CALL=${newValue}`);
            } else {
                envContent += `\nANTI_CALL=${newValue}`;
            }

            fs.writeFileSync(envFile, envContent.trim() + "\n");

            await reply(`✅ *Anti-call feature has been turned ${status.toUpperCase()}.*`);

        } catch (e) {
            console.error(e);
            await reply("❌ Error updating anti-call setting: " + e.message);
        }
    });
