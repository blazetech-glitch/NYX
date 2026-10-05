const config = require('../config');
const { cmd } = require('../command');
const { getMainImage } = require('../lib/branding');

// Track recent mentions to prevent duplicates
const recentMentions = new Set();

cmd({
  on: "body"
}, async (conn, m, { isGroup, isBot }) => {
  try {
    // Skip if not enabled or not a group
    if (config.MENTION_REPLY !== 'true' || !isGroup) return;

    // SKIP BOT'S OWN MESSAGES
    if (isBot || m.fromMe) return;

    const mentioned = m.mentionedJid || [];
    const botNumber = conn.user.id.split(":")[0] + '@s.whatsapp.net';

    // Check if bot is mentioned
    if (!mentioned.includes(botNumber)) return;

    // Prevent duplicate mentions within 2 seconds
    const mentionKey = `${m.chat}_${m.sender}`;
    if (recentMentions.has(mentionKey)) {
      return;
    }

    // Add to recent mentions
    recentMentions.add(mentionKey);
    setTimeout(() => recentMentions.delete(mentionKey), 2000);

    // Beautiful formatted message
    const mentionText = `╔════════════════════════════════╗
║        👋 *MENTION RECEIVED* 👋        ║
╚════════════════════════════════╝

✨ **${config.BOT_NAME || 'NYX MD'}** is here! 

🎯 I'm listening and ready to help you.

╭─────────────────────────────────╮
│ 💬 How can I assist you today?
│ ⚡ Use .menu for commands
│ 🔗 ${config.GROUP_LINK ? config.GROUP_LINK : 'Join our community'}
╰─────────────────────────────────╯

*Made with ❤️ by ${config.OWNER_NAME || 'BLAZE TEAM'}*`;

    try {
      const mainImage = getMainImage();
      // Send image with caption
      await conn.sendMessage(m.chat, {
        image: mainImage || { url: config.MENU_IMAGE_URL || "https://files.catbox.moe/kbbm5e.jpg" },
        caption: mentionText,
        contextInfo: {
          mentionedJid: [m.sender],
          forwardingScore: 999,
          isForwarded: true,
          externalAdReply: {
            showAdAttribution: true,
            title: config.BOT_NAME || 'NYX MD',
            body: '🤖 Your AI Assistant',
            thumbnailUrl: config.MENU_IMAGE_URL || "https://files.catbox.moe/kbbm5e.jpg",
            sourceUrl: config.CHANNEL_LINK || '',
            mediaType: 1,
            renderLargerThumbnail: false
          }
        }
      }, { quoted: m });

      // Send audio file
      await conn.sendMessage(m.chat, {
        audio: { url: "https://files.catbox.moe/lu3f94.mp3" },
        mimetype: 'audio/mpeg',
        ptt: false,
        fileName: `${config.BOT_NAME || 'NYX'}-notification.mp3`
      }, { quoted: m });

    } catch (sendError) {
      console.error('Error sending mention reply:', sendError.message);
      // Fallback: send text only
      await conn.sendMessage(m.chat, {
        text: `👋 *${config.BOT_NAME || 'NYX MD'} is here!*\n\n🎯 I'm listening and ready to help.\nUse *.menu* for commands!`
      }, { quoted: m });
    }

  } catch (e) {
    console.error('Mention reply error:', e.message);
  }
});

cmd({
  pattern: "me",
  alias: ["mention", "broken", "x", "xd"],
  desc: "Send a random voice clip",
  category: "fun",
  react: "⚡",
  filename: __filename
}, async (conn, m) => {
  try {
    const voiceClips = [
      "https://cdn.ironman.my.id/i/7p5plg.mp4",
      "https://cdn.ironman.my.id/i/l4dyvg.mp4",
      "https://cdn.ironman.my.id/i/4z93dg.mp4",
      "https://cdn.ironman.my.id/i/m9gwk0.mp4",
      "https://cdn.ironman.my.id/i/gr1jjc.mp4",
      "https://cdn.ironman.my.id/i/lbr8of.mp4",
      "https://cdn.ironman.my.id/i/0z95mz.mp4",
      "https://cdn.ironman.my.id/i/rldpwy.mp4",
      "https://cdn.ironman.my.id/i/lz2z87.mp4",
      "https://cdn.ironman.my.id/i/gg5jct.mp4"
    ];

    const randomClip = voiceClips[Math.floor(Math.random() * voiceClips.length)];

    await conn.sendMessage(m.chat, {
      audio: { url: randomClip },
      mimetype: 'audio/mp4',
      ptt: true
    }, { quoted: m });
  } catch (e) {
    console.error(e);
    await conn.sendMessage(m.chat, { text: "❌ Failed to send random clip." }, { quoted: m });
  }
});
