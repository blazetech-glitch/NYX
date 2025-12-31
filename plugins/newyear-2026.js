const { cmd } = require('../command');
const config = require('../config');

const quotes = [
    "Cheers to a new year and another chance for us to get it right. — Oprah Winfrey",
    "May the New Year bring you courage to break your resolutions early! My own plan is to swear off every kind of virtue, so that I triumph instantly. — Aleister Crowley",
    "Write it on your heart that every day is the best day in the year. — Ralph Waldo Emerson",
    "The magic in new beginnings is truly the most powerful of them all. — Josiyah Martin",
    "New year — a new chapter, new verse, or just the same old story? Ultimately we write it. — Alex Morritt",
    "May you have a year of blessings and beyond. Happy New Year 2026!",
    "Let the past be a lesson and the future be a hopeful dream. Happy 2026!",
    "This is a new year. A new beginning. And things will change. — Taylor Swift",
    "Celebrate endings — for they precede new beginnings. — Jonathan Lockwood Huie",
    "New Year’s most glorious light is sweet hope! — Mehmet Murat ildan",
    "May the coming year bring more happiness to you than last year. May you have an amazing year. — Unknown",
    "As the sun sets on another year, may it rise again and shine light on new opportunities. — Unknown"
];

function pickRandom(arr) { return arr[Math.floor(Math.random() * arr.length)]; }

// Happy New Year greeting
cmd({ pattern: 'happy2026', alias: ['happynewyear', 'nye2026', 'nye'], desc: 'Send Happy New Year 2026 greeting', category: 'fun', filename: __filename }, async (conn, mek, m, { reply }) => {
    const header = `🎉🎆 𝗛𝗔𝗣𝗣𝗬 𝗡𝗘𝗪 𝗬𝗘𝗔𝗥 2026 🎆🎉\n\n`;
    const body = `Wishing you a bright and prosperous 2026!\nMay your year be filled with success, joy and unforgettable moments.\n\n*${config.BOT_NAME}* wishes you the best — let’s make 2026 amazing!`;
    const foot = `\n✨ Tip: send .menu2026 for a special 2026 menu and .nyequotes to receive uplifting New Year quotes.`;
    await reply(header + body + foot);
});

// Stylish 2026 menu
cmd({ pattern: 'menu2026', alias: ['menu26', '2026menu', 'stylish2026'], desc: 'Stylish New Year 2026 menu', category: 'main', filename: __filename }, async (conn, mek, m, { reply }) => {
    const lines = [];
    lines.push('╔═━┈•◦❁◦•┈━═╗');
    lines.push('        ✨ 𝗦𝗧𝗬𝗟𝗜𝗦𝗛 𝗠𝗘𝗡𝗨 — 𝟮𝟬𝟮𝟲 ✨');
    lines.push('╚═━┈•◦❁◦•┈━═╝');
    lines.push('');
    lines.push('🎊 Highlights:');
    lines.push(' - Greetings: .happy2026, .nye2026');
    lines.push(' - New Year Quotes: .nyequotes, .nyequote');
    lines.push(' - AI & Creativity: .gpt, .chatbot, .fluxai, .stablediffusion');
    lines.push(' - Utility: .setprefix, .setmode, .antibug, .antibad');
    lines.push(' - Media: .imagine, .sticker, .tomp3, .tomp4');
    lines.push('');
    lines.push('✨ Wishes:');
    lines.push('May your 2026 be full of bright ideas, bold moves and kind people.');
    lines.push('');
    lines.push('📌 Quick Commands:');
    lines.push(' • .happy2026 — Send a festive greeting');
    lines.push(' • .nyequotes — Get an inspiring New Year quote');
    lines.push(' • .menu2026 — Show this menu again');
    lines.push('');
    lines.push('╭─❏ 𝗛𝗔𝗩𝗘 𝗔 𝗕𝗥𝗜𝗚𝗛𝗧 𝗬𝗘𝗔𝗥 ❏─');
    lines.push(`╰─❏ From ${config.BOT_NAME} ─`);

    await reply(lines.join('\n'));
});

// New Year quotes
cmd({ pattern: 'nyequotes', alias: ['nyequote', 'nyeq'], desc: 'Send a random Happy New Year quote', category: 'fun', filename: __filename }, async (conn, mek, m, { reply }) => {
    const q = pickRandom(quotes);
    await reply(`💫 Happy New Year Quote:\n\n"${q}"\n\n🎆 — From ${config.BOT_NAME} — 2026`);
});

module.exports = {};
