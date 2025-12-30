const { cmd } = require('../command');

cmd({
    pattern: 'echo',
    react: '🗣️',
    desc: 'Echo back provided text',
    category: 'utility',
    use: '.echo <text>',
    filename: __filename
}, async (conn, mek, m, { args, reply }) => {
    try {
        const text = args.join(' ').trim();
        if (!text) return reply('Usage: .echo <text>');
        await reply(text);
    } catch (e) {
        console.error('Echo command error:', e);
        reply('❌ Error while echoing');
    }
});
