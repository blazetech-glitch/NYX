const config = require('../config');
const moment = require('moment-timezone');
const { cmd, commands } = require('../command');
const { runtime } = require('../lib/functions');
const os = require('os');
const { getPrefix } = require('../lib/prefix');

// Fonction pour styliser les majuscules comme ʜɪ
function toUpperStylized(str) {
  const stylized = {
    A: 'ᴀ', B: 'ʙ', C: 'ᴄ', D: 'ᴅ', E: 'ᴇ', F: 'ғ', G: 'ɢ', H: 'ʜ',
    I: 'ɪ', J: 'ᴊ', K: 'ᴋ', L: 'ʟ', M: 'ᴍ', N: 'ɴ', O: 'ᴏ', P: 'ᴘ',
    Q: 'ǫ', R: 'ʀ', S: 's', T: 'ᴛ', U: 'ᴜ', V: 'ᴠ', W: 'ᴡ', X: 'x',
    Y: 'ʏ', Z: 'ᴢ'
  };
  return str.split('').map(c => stylized[c.toUpperCase()] || c).join('');
}

// Normalisation des catégories
const normalize = (str) => str.toLowerCase().replace(/\s+menu$/, '').trim();

// Emojis par catégorie normalisée
const emojiByCategory = {
  ai: '🤖', anime: '🍥', audio: '🎧', bible: '📖',
  download: '⬇️', downloader: '📥', fun: '🎮', game: '🕹️',
  group: '👥', img_edit: '🖌️', info: 'ℹ️', information: '🧠',
  logo: '🖼️', main: '🏠', media: '🎞️', menu: '📜',
  misc: '📦', music: '🎵', other: '📁', owner: '👑',
  privacy: '🔒', search: '🔎', settings: '⚙️',
  sticker: '🌟', tools: '🛠️', user: '👤',
  utilities: '🧰', utility: '🧮', wallpapers: '🖼️',
  whatsapp: '📱'
};

cmd({
  pattern: 'menu',
  alias: ['allmenu'],
  desc: 'Show all bot commands',
  category: 'menu',
  react: '👌',
  filename: __filename
}, async (conn, mek, m, { from, sender, reply }) => {
  try {
    const prefix = getPrefix();
    const timezone = config.TIMEZONE || 'Africa/Nairobi';
    const time = moment().tz(timezone).format('HH:mm:ss');
    const date = moment().tz(timezone).format('dddd, DD MMMM YYYY');

    const uptime = () => {
      let sec = process.uptime();
      let h = Math.floor(sec / 3600);
      let m = Math.floor((sec % 3600) / 60);
      let s = Math.floor(sec % 60);
      return `${h}h ${m}m ${s}s`;
    };

    // 🌟 BEAUTIFUL HEADER
    let menu = `
╔═══════════════╗
   ☢️  ${toUpperStylized('NYX MD')}  ☢️
╚═══════════════╝
╭───────────────────⟡
│ 👤 ᴜꜱᴇʀ : @${sender.split("@")[0]}
│ ⏱️ ʀᴜɴᴛɪᴍᴇ : ${uptime()}
│ ⚙️ ᴍᴏᴅᴇ : ${config.MODE}
│ 🔑 ᴘʀᴇғɪx : 「 ${config.PREFIX} 」
│ 👑 ᴏᴡɴᴇʀ : ${config.OWNER_NAME}
│ 🧩 ᴘʟᴜɢɪɴꜱ : ${commands.length}
│ 🛠️ ᴅᴇᴠ : BLAZE TEAM
│ 🚀 ᴠᴇʀꜱɪᴏɴ : 2.0.0
╰───────────────────⟡`;

    // Group commands by category
    const categories = {};
    for (const cmd of commands) {
      if (cmd.category && !cmd.dontAdd && cmd.pattern) {
        const normalizedCategory = normalize(cmd.category);
        categories[normalizedCategory] = categories[normalizedCategory] || [];
        categories[normalizedCategory].push(cmd.pattern.split('|')[0]);
      }
    }

    // 🌈 ROYAL CATEGORY STYLE
    for (const cat of Object.keys(categories).sort()) {
      const emoji = emojiByCategory[cat] || '✨';
      menu += `

╭═══════════════⟡
│ ${emoji}  ${toUpperStylized(cat)}  ${toUpperStylized('Menu')}
╰═══════════════⟡`;
      for (const cmd of categories[cat].sort()) {
        menu += `
│ ✦ ${prefix}${cmd}`;
      }
      menu += `
╰───────────────────⟡`;
    }

    menu += `

✨ ${config.DESCRIPTION || toUpperStylized('Explore the power of NYX MD')} ✨`;

    // Context info
    const imageContextInfo = {
      mentionedJid: [sender],
      forwardingScore: 999,
      isForwarded: true,
      forwardedNewsletterMessageInfo: {
        newsletterJid: config.NEWSLETTER_JID || '120363424512102809@newsletter',
        newsletterName: config.OWNER_NAME || toUpperStylized('NYX MD'),
        serverMessageId: 143
      }
    };

    // Send menu
    await conn.sendMessage(
      from,
      {
        image: { url: config.MENU_IMAGE_URL || 'https://files.catbox.moe/rw0yfd.png' },
        caption: menu,
        contextInfo: imageContextInfo
      },
      { quoted: mek }
    );

    // Optional audio
    if (config.MENU_AUDIO_URL) {
      await new Promise(r => setTimeout(r, 1000));
      await conn.sendMessage(
        from,
        {
          audio: { url: config.MENU_AUDIO_URL },
          mimetype: 'audio/mp4',
          ptt: true,
          contextInfo: imageContextInfo
        },
        { quoted: mek }
      );
    }

  } catch (e) {
    console.error('Menu Error:', e.message);
    await reply(`❌ ${toUpperStylized('Error')}: Menu failed\n${e.message}`);
  }
});
