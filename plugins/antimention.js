const { cmd } = require('../command');
const pluginSettings = require('../lib/pluginSettings');

cmd({ on: 'body' }, async (conn, m, store, {
    from,
    body,
    isGroup,
    isAdmins,
    isBotAdmins,
    reply,
    sender
}) => {
    try {
        if (!isGroup || !isBotAdmins) return;
        if (isAdmins) return;

        let enabled = false;
        try {
            const override = await pluginSettings.get(from, 'antimention');
            if (override !== undefined) enabled = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
        } catch (e) {
            console.error('antimention: error reading plugin setting', e);
        }
        if (!enabled) return;

        const msg = m.message || {};
        let mentioned = [];
        try {
            if (msg.extendedTextMessage?.contextInfo?.mentionedJid) mentioned = msg.extendedTextMessage.contextInfo.mentionedJid;
            else if (msg.buttonsResponseMessage?.contextInfo?.mentionedJid) mentioned = msg.buttonsResponseMessage.contextInfo.mentionedJid;
            else if (msg.templateButtonReplyMessage?.contextInfo?.mentionedJid) mentioned = msg.templateButtonReplyMessage.contextInfo.mentionedJid;
        } catch (e) {
            mentioned = [];
        }

        const text = (body || '').toString().toLowerCase();
        const isStatusMention = mentioned.includes('status@broadcast') || text.includes('status@broadcast');
        if (!isStatusMention) return;

        try {
            const deleteKey = {
                remoteJid: from,
                fromMe: false,
                id: m.key?.id || m.id || '',
                participant: m.key?.participant || m.participant || undefined
            };
            await conn.sendMessage(from, { delete: deleteKey });
        } catch (e) {
            try { await conn.sendMessage(from, { delete: m.key }); } catch (err) { console.error('antimention: delete failed', err); }
        }

        try {
            await conn.sendMessage(from, { text: `⚠️ @${sender.split('@')[0]} Status mention is illegal in this group.`, mentions: [sender] }, { quoted: m });
        } catch (e) {
            try { reply('⚠️ Status mention is illegal in this group.'); } catch (err) { }
        }
    } catch (err) {
        console.error('antimention handler error:', err);
    }
});

cmd({
    pattern: 'antimention',
    desc: 'Toggle anti-mention for status in this group (admins only)',
    category: 'group',
    filename: __filename
}, async (conn, mek, m, { from, args, isGroup, isAdmins, reply }) => {
    try {
        if (!isGroup) return reply('❌ This command can only be used in groups.');
        if (!isAdmins) return reply('❌ Only group admins can toggle this setting.');
        if (!args || !args.length) return reply('Usage: .antimention on|off|status');

        const val = String(args[0]).toLowerCase();
        if (val === 'status') {
            let current = false;
            try {
                const override = await pluginSettings.get(from, 'antimention');
                if (override !== undefined) current = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
            } catch (e) { }
            return reply(`🔒 Anti-mention status: ${current ? 'ON' : 'OFF'}`);
        }

        const enabled = (val === 'on' || val === 'true');
        await pluginSettings.set(from, 'antimention', enabled);
        return reply(`✅ Anti-mention for this group is now ${enabled ? 'ON' : 'OFF'}.`);
    } catch (e) {
        console.error('antimention command error:', e);
        return reply('⚠️ Failed to update setting.');
    }
});

module.exports = {};
