const { cmd } = require('../command');
const config = require('../config');

// When someone types "free bot" reply with owner contact and suggested message
cmd({ pattern: '', on: 'body', desc: 'Reply owner contact when user asks for free bot', filename: __filename }, async (conn, mek, m, { body, isCmd, reply, from }) => {
    try {
        if (!body) return;
        if (mek && mek.key && mek.key.fromMe) return; // ignore bot's own messages
        if (isCmd) return; // skip commands

        const text = body.toString().toLowerCase().trim();
        if (!/\bfree bot\b/i.test(text)) return;

        // prepare owner contacts
        const owners = [];
        if (config.OWNER_NUMBER) owners.push(config.OWNER_NUMBER.replace(/[^0-9]/g, ''));
        if (config.OWNER_NUMBER2) owners.push(config.OWNER_NUMBER2.replace(/[^0-9]/g, ''));
        if (config.DEV) owners.push(config.DEV.replace(/[^0-9]/g, ''));
        const uniqueOwners = [...new Set(owners)].filter(Boolean);

        let contactList = '';
        if (uniqueOwners.length === 0) {
            contactList = 'Owner contact not configured.';
        } else {
            contactList = uniqueOwners.map(n => `+${n} (https://wa.me/${n})`).join('\n');
        }

        const message = `Hello! To request a free bot please contact the owner:\n${contactList}\n\nWhen you message, send exactly:\n"free bot sir"\n\nThe owner will guide you from there.`;

        await conn.sendMessage(from, { text: message }, { quoted: mek });
    } catch (e) {
        console.error('freebot handler error:', e);
    }
});
