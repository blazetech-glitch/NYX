const { cmd } = require('../command');
const config = require('../config');
const { sleep } = require('../lib/functions');

cmd({
  pattern: "owner",
  desc: "Get owner number",
  category: "main",
  react: "😇",
  filename: __filename
}, async (sock, m, msg, { from }) => {
  try {
    const number1 = config.OWNER_NUMBER; // primary owner
    const number2 = config.OWNER_NUMBER2 || config.OWNER_NUMBER; // secondary owner (fallback to primary)
    const name = config.OWNER_NAME || "Bot Owner";

    // React with loading emoji
    await sock.sendMessage(from, { react: { text: "📇", key: m.key } });
    await sock.sendPresenceUpdate("composing", from);
    await sleep(1000);

    // Create vcards for both owners
    const vcard1 =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${name}\n` +
      `ORG:${config.BOT_NAME || 'NYX MD'};\n` +
      `TEL;type=CELL;type=VOICE;waid=${number1}:${'+' + number1}\n` +
      'END:VCARD';

    const vcard2 =
      'BEGIN:VCARD\n' +
      'VERSION:3.0\n' +
      `FN:${name}\n` +
      `ORG:${config.BOT_NAME || 'NYX MD'};\n` +
      `TEL;type=CELL;type=VOICE;waid=${number2}:${'+' + number2}\n` +
      'END:VCARD';

    await sock.sendMessage(from, {
      contacts: {
        displayName: name,
        contacts: [{ vcard: vcard1 }, { vcard: vcard2 }]
      }
    });

    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("Error sending contact:", e);
    await sock.sendMessage(from, {
      text: `❌ Couldn't send contact:\n${e.message}`
    });
  }
});
