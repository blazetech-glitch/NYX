const fs = require('fs');
const path = require('path');
const axios = require('axios');
const { cmd } = require('../command');

const storeFile = path.join(__dirname, '../data/chatbot.json');
let store = {};
try { store = JSON.parse(fs.readFileSync(storeFile, 'utf8') || '{}') } catch (e) { store = {} }
function save() { fs.writeFileSync(storeFile, JSON.stringify(store, null, 2)) }

// Command to toggle chatbot per chat
cmd({ pattern: 'chatbot', desc: 'Enable/disable chatbot in this chat', category: 'ai', filename: __filename }, async (conn, mek, m, { args, isGroup, isAdmins, isCreator, reply }) => {
    try {
        const sub = args[0] && args[0].toLowerCase();
        const jid = mek.key.remoteJid;
        if (!sub) return reply('Usage: .chatbot on|off');

        // allow group admins or owner
        if (isGroup && !isAdmins && !isCreator) return reply('Only group admins or owner can toggle chatbot here.');

        if (sub === 'on') {
            store[jid] = true;
            save();
            return reply('✅ Chatbot enabled for this chat.');
        } else if (sub === 'off') {
            store[jid] = false;
            save();
            return reply('❌ Chatbot disabled for this chat.');
        } else return reply('Usage: .chatbot on|off');
    } catch (e) { console.error(e); reply('Error toggling chatbot'); }
});

// On every message body: if chatbot enabled reply using AI
cmd({ pattern: '', on: 'body', desc: 'Chatbot handler (auto)', filename: __filename }, async (conn, mek, m, { from, isGroup, isOwner, isCreator, reply, body, sender, isCmd }) => {
    try {
        const jid = from;
        if (!store[jid]) return; // not enabled for this chat
        if (!body) return;
        // ignore messages sent by the bot itself to avoid loops
        if (mek && mek.key && mek.key.fromMe) return;
        // avoid commands
        if (isCmd) return;
        // If in group, only respond when bot is mentioned or reply-to-bot
        if (isGroup) {
            const botJid = conn.user && conn.user.id ? conn.user.id.split(':')[0] + '@s.whatsapp.net' : null;
            const mentioned = (mek.message && mek.message.extendedTextMessage && mek.message.extendedTextMessage.contextInfo && mek.message.extendedTextMessage.contextInfo.mentionedJid) || [];
            const isMentioned = mentioned.includes(botJid);
            if (!isMentioned) return;
        }

        // call AI endpoint (reuse existing public GPT proxy)
        // use the sender's text as the query
        const q = body;
        const apiUrl = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`;
        const { data } = await axios.get(apiUrl, { timeout: 20000 }).catch(() => ({}));
        const answer = data && (data.message || data.result || data.answer) ? (data.message || data.result || data.answer) : null;
        if (!answer) return; // silent on failures
        await conn.sendMessage(jid, { text: answer }, { quoted: mek });
    } catch (e) { console.error('Chatbot handler error:', e) }
});
