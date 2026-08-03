const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

cmd({
    pattern: 'antilink',
    desc: 'View or toggle ANTI_LINK and DELETE_LINKS settings (owner only)',
    category: 'owner',
    filename: __filename
}, async (conn, mek, m, { from, args, reply, isCreator, isOwner }) => {
    try {
        if (!isCreator && !isOwner) return reply('❌ Only the bot owner can change anti-link settings.');

        const sub = (args && args[0]) ? args[0].toLowerCase() : 'status';
        const cfgPath = path.join(process.cwd(), 'config.js');
        const cfg = require('../config');

        if (sub === 'status') {
            return reply(`ANTI_LINK: ${cfg.ANTI_LINK} \nDELETE_LINKS: ${cfg.DELETE_LINKS}`);
        }

        // supported: on/true/enable, off/false/disable, delete on/off
        if (['on', 'true', 'enable'].includes(sub)) {
            cfg.ANTI_LINK = 'on';
            // persist
            try {
                const raw = fs.readFileSync(cfgPath, 'utf8');
                const updated = raw.replace(/ANTI_LINK:\s*process\.env\.ANTI_LINK\s*\|\|\s*["'].*?["']\s*,/i, `ANTI_LINK: process.env.ANTI_LINK || "on",`);
                fs.copyFileSync(cfgPath, cfgPath + '.bak');
                fs.writeFileSync(cfgPath, updated, 'utf8');
            } catch (err) {
                console.error('Failed to write config.js (antilink on):', err);
                return reply('❌ Failed to persist ANTI_LINK change to config.js');
            }

            // Clear per-group overrides so global applies everywhere
            try {
                const pluginSettings = require('../lib/pluginSettings');
                const all = await pluginSettings.readAll();
                Object.keys(all).forEach(chat => { if (all[chat] && all[chat].hasOwnProperty('antilink')) delete all[chat]['antilink']; });
                await pluginSettings.writeAll(all);
            } catch (err) {
                console.error('Failed to clear per-group antilink overrides:', err);
            }

            return reply('✅ ANTI_LINK enabled (global)');
        }

        if (['off', 'false', 'disable'].includes(sub)) {
            cfg.ANTI_LINK = 'off';
            try {
                const raw = fs.readFileSync(cfgPath, 'utf8');
                const updated = raw.replace(/ANTI_LINK:\s*process\.env\.ANTI_LINK\s*\|\|\s*["'].*?["']\s*,/i, `ANTI_LINK: process.env.ANTI_LINK || "off",`);
                fs.copyFileSync(cfgPath, cfgPath + '.bak');
                fs.writeFileSync(cfgPath, updated, 'utf8');
            } catch (err) {
                console.error('Failed to write config.js (antilink off):', err);
                return reply('❌ Failed to persist ANTI_LINK change to config.js');
            }

            // Clear per-group overrides so global off applies everywhere
            try {
                const pluginSettings = require('../lib/pluginSettings');
                const all = await pluginSettings.readAll();
                Object.keys(all).forEach(chat => { if (all[chat] && all[chat].hasOwnProperty('antilink')) delete all[chat]['antilink']; });
                await pluginSettings.writeAll(all);
            } catch (err) {
                console.error('Failed to clear per-group antilink overrides:', err);
            }

            return reply('✅ ANTI_LINK disabled (global)');
        }

        if (sub === 'deleteon' || sub === 'delete-on' || (sub === 'delete' && args[1] === 'on')) {
            cfg.DELETE_LINKS = 'true';
            try {
                const raw = fs.readFileSync(cfgPath, 'utf8');
                const updated = raw.replace(/DELETE_LINKS:\s*process\.env\.DELETE_LINKS\s*\|\|\s*["'].*?["']\s*,/i, `DELETE_LINKS: process.env.DELETE_LINKS || "true",`);
                fs.copyFileSync(cfgPath, cfgPath + '.bak');
                fs.writeFileSync(cfgPath, updated, 'utf8');
            } catch (err) {
                console.error('Failed to write config.js (delete on):', err);
                return reply('❌ Failed to persist DELETE_LINKS change to config.js');
            }
            return reply('✅ DELETE_LINKS enabled (bot will attempt to delete links)');
        }

        if (sub === 'deleteoff' || sub === 'delete-off' || (sub === 'delete' && args[1] === 'off')) {
            cfg.DELETE_LINKS = 'false';
            try {
                const raw = fs.readFileSync(cfgPath, 'utf8');
                const updated = raw.replace(/DELETE_LINKS:\s*process\.env\.DELETE_LINKS\s*\|\|\s*["'].*?["']\s*,/i, `DELETE_LINKS: process.env.DELETE_LINKS || "false",`);
                fs.copyFileSync(cfgPath, cfgPath + '.bak');
                fs.writeFileSync(cfgPath, updated, 'utf8');
            } catch (err) {
                console.error('Failed to write config.js (delete off):', err);
                return reply('❌ Failed to persist DELETE_LINKS change to config.js');
            }
            return reply('✅ DELETE_LINKS disabled');
        }

        return reply('Usage: .antilink status | on | off | deleteon | deleteoff');
    } catch (err) {
        console.error(err);
        return reply('❌ Error processing command');
    }
});
