const { cmd } = require('../command');
const fs = require('fs');
const path = require('path');

const DATA_DIR = path.join(__dirname, '..', 'data');
const PIN_FILE = path.join(DATA_DIR, 'pinned.json');

function ensureDataDir() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(PIN_FILE)) fs.writeFileSync(PIN_FILE, JSON.stringify({}), 'utf8');
}

function readPins() {
    ensureDataDir();
    try { return JSON.parse(fs.readFileSync(PIN_FILE, 'utf8') || '{}'); } catch (e) { return {}; }
}

function writePins(obj) {
    ensureDataDir();
    fs.writeFileSync(PIN_FILE, JSON.stringify(obj, null, 2), 'utf8');
}

cmd({
    pattern: 'pin',
    alias: ['pinmsg'],
    desc: 'Pin a replied message (stores locally)',
    category: 'group',
    react: '📌',
    filename: __filename
}, async (conn, mek, m, { from, quoted, reply, sender }) => {
    try {
        if (!quoted) return reply('Reply to a message to pin it.');
        const pins = readPins();
        const chatId = from;
        const pinned = {
            id: quoted.key && quoted.key.id ? quoted.key.id : (quoted.messageID || Date.now().toString()),
            sender: quoted.key && quoted.key.participant ? quoted.key.participant : (quoted.sender || 'unknown'),
            text: (quoted.message && (quoted.message.conversation || quoted.message.extendedTextMessage && quoted.message.extendedTextMessage.text)) || '[media message] ',
            time: Date.now()
        };
        pins[chatId] = pinned;
        writePins(pins);
        await reply('📌 Message pinned locally. Use .pinned to view or .unpin to remove.');
    } catch (e) {
        console.error('Pin Error:', e);
        reply('Failed to pin message.');
    }
});

cmd({
    pattern: 'unpin',
    desc: 'Remove pinned message for this chat',
    category: 'group',
    react: '🗑️',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const pins = readPins();
        if (!pins[from]) return reply('No pinned message in this chat.');
        delete pins[from];
        writePins(pins);
        await reply('🗑️ Pinned message removed.');
    } catch (e) {
        console.error('Unpin Error:', e);
        reply('Failed to remove pinned message.');
    }
});

cmd({
    pattern: 'pinned',
    alias: ['pinnedmsg'],
    desc: 'Show pinned message for this chat',
    category: 'group',
    react: '📍',
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {
    try {
        const pins = readPins();
        const pinned = pins[from];
        if (!pinned) return reply('No pinned message in this chat.');
        let time = new Date(pinned.time).toLocaleString();
        const text = `📌 Pinned Message:\n\n${pinned.text}\n\n• pinned by: ${pinned.sender}\n• at: ${time}`;
        await reply(text);
    } catch (e) {
        console.error('Pinned Show Error:', e);
        reply('Failed to fetch pinned message.');
    }
});
