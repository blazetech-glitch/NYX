const { cmd } = require('../command');

cmd({
    pattern: 'quote',
    react: '💬',
    desc: 'Send a random quote',
    category: 'fun',
    filename: __filename
}, async (conn, mek, m, { reply }) => {
    try {
        const quotes = [
            "Be yourself; everyone else is already taken. — Oscar Wilde",
            "The only way to do great work is to love what you do. — Steve Jobs",
            "Life is what happens when you're busy making other plans. — John Lennon",
            "Do not take life too seriously. You will never get out of it alive. — Elbert Hubbard"
        ];
        const q = quotes[Math.floor(Math.random() * quotes.length)];
        await reply(q);
    } catch (e) {
        console.error('Quote command error:', e);
        reply('❌ Error fetching quote');
    }
});
