const fs = require('fs');
const path = require('path');
const axios = require('axios');
const FormData = require('form-data');
const { cmd } = require('../command');
const config = require('../config');

const profilesFile = path.join(__dirname, '../data/profiles.json');
let profiles = {};
try { profiles = JSON.parse(fs.readFileSync(profilesFile, 'utf8') || '{}') } catch (e) { profiles = {} }

function saveProfiles() { fs.writeFileSync(profilesFile, JSON.stringify(profiles, null, 2)) }

// translate <text> <lang>
cmd({ pattern: 'translate', alias: ['tr'], desc: 'Translate text to target language (accepts name or code)', category: 'utility', filename: __filename }, async (conn, mek, m, { args, reply, from }) => {
    if (!args || args.length < 2) return reply('Usage: .translate <text> <lang>\nExample: .translate Hello fr OR .translate Hello | french');

    // allow separators like '|' or '=>' to separate text and lang
    const joined = args.join(' ');
    let text, langArg;
    if (joined.includes('|')) {
        [text, langArg] = joined.split('|').map(s => s.trim());
    } else if (joined.includes('=>')) {
        [text, langArg] = joined.split('=>').map(s => s.trim());
    } else if (joined.includes('->')) {
        [text, langArg] = joined.split('->').map(s => s.trim());
    } else {
        langArg = args[args.length - 1];
        text = args.slice(0, -1).join(' ');
    }

    if (!text || !langArg) return reply('Usage: .translate <text> <lang>');

    const langMap = {
        english: 'en', en: 'en', french: 'fr', fr: 'fr', spanish: 'es', es: 'es', german: 'de', de: 'de', portuguese: 'pt', pt: 'pt', italian: 'it', it: 'it', arabic: 'ar', ar: 'ar', hindi: 'hi', hi: 'hi', swahili: 'sw', sw: 'sw', chinese: 'zh', zh: 'zh', 'zh-cn': 'zh', 'zh-tw': 'zh', japanese: 'ja', ja: 'ja', russian: 'ru', ru: 'ru', korean: 'ko', ko: 'ko'
    };

    const targ = langMap[langArg.toLowerCase()] || langArg.toLowerCase();

    try {
        // Try LibreTranslate first
        const res = await axios.post('https://libretranslate.de/translate', {
            q: text,
            source: 'auto',
            target: targ,
            format: 'text'
        }, { headers: { 'accept': 'application/json', 'Content-Type': 'application/json' }, timeout: 15000 });

        if (res && res.data && res.data.translatedText) {
            return reply(`Translated (${targ}):\n${res.data.translatedText}`);
        }
    } catch (err) {
        // ignore and fallback
    }

    // Fallback to MyMemory
    try {
        const res2 = await axios.get('https://api.mymemory.translated.net/get', { params: { q: text, langpair: `auto|${targ}` }, timeout: 15000 });
        const translated = res2.data?.responseData?.translatedText || null;
        if (translated) return reply(`Translated (${targ}):\n${translated}`);
        return reply('No translation result.');
    } catch (e) { reply('Translate error: ' + (e.message || e)) }
});

// serverinfo (for groups show metadata, otherwise process/server info)
cmd({ pattern: 'serverinfo', desc: 'Show server / group info', category: 'system', filename: __filename }, async (conn, mek, m, { from, isGroup, reply }) => {
    try {
        if (isGroup) {
            const meta = await conn.groupMetadata(from).catch(() => ({}));
            const members = meta?.participants?.length || 0;
            const admins = (meta?.participants || []).filter(p => p.admin).map(p => p.id) || [];
            reply(`Group: ${meta.subject || 'unknown'}\nMembers: ${members}\nAdmins: ${admins.length}\nDescription: ${meta.desc || 'N/A'}`);
        } else {
            const uptime = process.uptime();
            const mem = process.memoryUsage();
            reply(`Server Info:\nUptime: ${Math.floor(uptime)}s\nMemory: ${(mem.rss / 1024 / 1024).toFixed(2)} MB\nPlatform: ${process.platform}`);
        }
    } catch (e) { reply('Error: ' + e.message) }
});

// avatar [@user]
cmd({ pattern: 'avatar', desc: "Display a user's avatar", category: 'media', filename: __filename }, async (conn, mek, m, { args, reply, isGroup }) => {
    try {
        let jid = mek.quoted && mek.quoted.sender ? mek.quoted.sender : (args[0] ? (args[0].includes('@') ? args[0] : args[0] + '@s.whatsapp.net') : mek.sender);
        jid = jid.replace(/\s/g, '');
        let url = null;
        try { url = await conn.profilePictureUrl(jid) } catch (e) { url = null }
        if (!url) return reply('No avatar found.');
        await conn.sendMessage(mek.key.remoteJid, { image: { url }, caption: "Avatar" }, { quoted: mek });
    } catch (e) { reply('Avatar error: ' + e.message) }
});

// weather <city>
cmd({ pattern: 'weather', desc: 'Get weather for city', category: 'utility', filename: __filename }, async (conn, mek, m, { args, reply }) => {
    const city = args.join(' ');
    if (!city) return reply('Usage: .weather <city>');
    try {
        const res = await axios.get(`https://wttr.in/${encodeURIComponent(city)}?format=j1`);
        const cur = res.data.current_condition && res.data.current_condition[0];
        if (!cur) return reply('No weather data');
        const out = `Weather for ${city}:\nTemp: ${cur.temp_C}°C (${cur.temp_F}°F)\nFeels Like: ${cur.FeelsLikeC}°C\nHumidity: ${cur.humidity}%\nCondition: ${cur.weatherDesc[0].value}`;
        reply(out);
    } catch (e) { reply('Weather error: ' + (e.message || e)) }
});

// remind <time> <message> (supports 10s, 5m, 2h, 1d)
const reminders = {};
function parseDuration(s) {
    const m = s.match(/^(\d+)(s|m|h|d)$/);
    if (!m) return null;
    const n = Number(m[1]);
    const unit = m[2];
    const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[unit];
    return n * mult;
}
cmd({ pattern: 'remind', desc: 'Set a reminder: .remind 10m Take a break', category: 'utility', filename: __filename }, async (conn, mek, m, { args, reply }) => {
    const t = args[0];
    const msg = args.slice(1).join(' ');
    if (!t || !msg) return reply('Usage: .remind <time> <message> (e.g., 10m)');
    const ms = parseDuration(t);
    if (!ms) return reply('Invalid time. Use 10s, 5m, 2h, 1d');
    const id = Date.now() + '-' + Math.random().toString(36).slice(2, 8);
    reminders[id] = setTimeout(async () => {
        try { await conn.sendMessage(mek.key.remoteJid, { text: `⏰ Reminder: ${msg}` }) } catch (e) { }
        delete reminders[id];
    }, ms);
    reply(`Reminder set for ${t}`);
});

// timer <time>
cmd({ pattern: 'timer', desc: 'Set a countdown timer like 10s, 5m', category: 'utility', filename: __filename }, async (conn, mek, m, { args, reply }) => {
    const t = args[0];
    if (!t) return reply('Usage: .timer 10s');
    const ms = parseDuration(t);
    if (!ms) return reply('Invalid time');
    reply(`Timer started for ${t}`);
    setTimeout(() => conn.sendMessage(mek.key.remoteJid, { text: `⏱ Timer ${t} finished!` }), ms);
});

// calc <expression>
cmd({ pattern: 'calc', desc: 'Evaluate math expression', category: 'math', filename: __filename }, async (conn, mek, m, { args, reply }) => {
    const expr = args.join(' ');
    if (!expr) return reply('Usage: .calc 2+2*3');
    if (!/^[0-9+\-*/().% ^\s]+$/.test(expr)) return reply('Invalid characters in expression');
    try {
        const safe = expr.replace(/\^/g, '**');
        const res = Function(`return (${safe})`)();
        reply(`Result: ${res}`);
    } catch (e) { reply('Calc error: ' + e.message) }
});

// ocr (image must be quoted)
cmd({ pattern: 'ocr', desc: 'Extract text from quoted image', category: 'utility', filename: __filename }, async (conn, mek, m, { reply }) => {
    try {
        const q = mek.quoted && mek.quoted.message ? mek.quoted : null;
        if (!q || !q.message.imageMessage) return reply('Reply to an image with .ocr');
        const file = await conn.downloadAndSaveMediaMessage(q.message.imageMessage, path.join(__dirname, '../temp/ocr'));
        const form = new FormData();
        form.append('apikey', 'helloworld');
        form.append('file', fs.createReadStream(file));
        const res = await axios.post('https://api.ocr.space/parse/image', form, { headers: form.getHeaders() });
        const parsed = res.data.ParsedResults && res.data.ParsedResults[0] && res.data.ParsedResults[0].ParsedText;
        reply(parsed ? `OCR result:\n${parsed}` : 'No text found');
        try { fs.unlinkSync(file) } catch (e) { }
    } catch (e) { reply('OCR error: ' + (e.message || e)) }
});

// profile, setbio (simple local profiles)
cmd({ pattern: 'profile', desc: 'Show user profile', category: 'profile', filename: __filename }, async (conn, mek, m, { args, reply }) => {
    const jid = args[0] ? (args[0].includes('@') ? args[0] : args[0] + '@s.whatsapp.net') : mek.sender;
    const p = profiles[jid] || {};
    reply(`Profile for ${jid.split('@')[0]}:\nBio: ${p.bio || 'N/A'}\nXP: ${p.xp || 0}\nLevel: ${p.level || 0}`);
});

cmd({ pattern: 'setbio', desc: 'Set your bio in profile', category: 'profile', filename: __filename }, async (conn, mek, m, { args, reply }) => {
    const bio = args.join(' ');
    if (!bio) return reply('Usage: .setbio <text>');
    const jid = mek.sender;
    profiles[jid] = profiles[jid] || {};
    profiles[jid].bio = bio;
    saveProfiles();
    reply('Bio updated.');
});

// lightweight stubs for many other commands the user listed
const stub = (name, desc) => cmd({ pattern: name, desc, category: 'fun', filename: __filename }, async (conn, mek, m, { reply }) => reply(`${name} is not implemented in this build yet.`));
['voiceai', 'deepfake', 'faceblur', 'cartoonize', 'animefy', 'pixelate', 'colorize', 'removebg', 'stickerify', 'memeify', 'caption', 'watermark', 'resize', 'fakeban', 'fakekick', 'fakemessage', 'ghosttext', 'glitchtext', 'zalgo', 'ascii', 'emojify', 'reverse', 'spoiler', 'predict', 'luck', 'iqtest', 'personality', 'compatibility', 'future', 'ship', 'mood', 'truthmeter', 'namegenerator', 'avatar', 'timer'].forEach(n => stub(n, `Stub for ${n}`));
