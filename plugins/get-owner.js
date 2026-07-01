const { cmd } = require('../command');
const config = require('../config');
const { sleep } = require('../lib/functions');
const fs = require('fs');
const path = require('path');

cmd({
  pattern: "owner",
  alias: ['dev', '0wnercontact'],
  desc: "Get owner number",
  category: "main",
  react: "😇",
  filename: __filename
}, async (sock, m, msg, { from }) => {
  try {
    // React with loading emoji
    await sock.sendMessage(from, { react: { text: "📇", key: m.key } });

    // Send beautiful owner info message
    const ownerText = `╔════════════════════════════╗
║     👑 *OWNER CONTACT* 👑    ║
╚════════════════════════════╝

╭─────────────────────────────╮
│ 📱 Getting owner contacts...
╰─────────────────────────────╯`;

    await sock.sendMessage(from, { text: ownerText, contextInfo: { mentionedJid: [from] } });
    await sock.sendPresenceUpdate("composing", from);
    await sleep(1000);

    // Try to read `assets/sudo.json` for owner JIDs; fallback to config numbers
    let contactsList = [];
    try {
      const sudoPath = path.join(__dirname, '..', 'assets', 'sudo.json');
      if (fs.existsSync(sudoPath)) {
        const raw = fs.readFileSync(sudoPath, 'utf8');
        const arr = JSON.parse(raw);
        if (Array.isArray(arr) && arr.length) contactsList = arr;
      }
    } catch (e) {
      console.error('Failed to read assets/sudo.json:', e);
    }

    // Fallback to config values if sudo.json is empty
    if (!contactsList || contactsList.length === 0) {
      const n1 = config.OWNER_NUMBER;
      const n2 = config.OWNER_NUMBER2 || config.OWNER_NUMBER;
      contactsList = [`${n1}@s.whatsapp.net`, `${n2}@s.whatsapp.net`];
    }

    const displayName = config.OWNER_NAME || '👑 Bot Owner';
    const contactsPayload = contactsList.map((jid, idx) => {
      const num = (typeof jid === 'string') ? jid.split('@')[0] : String(jid);
      const vcard = [
        'BEGIN:VCARD',
        'VERSION:3.0',
        `FN:${displayName} #${idx + 1}`,
        `ORG:${config.BOT_NAME || 'SUPËR-MD'};`,
        `TEL;type=CELL;type=VOICE;waid=${num}:${'+' + num}`,
        'END:VCARD'
      ].join('\n');
      return { vcard };
    });

    await sock.sendMessage(from, {
      contacts: {
        displayName: `👑 ${displayName}`,
        contacts: contactsPayload
      }
    });

    // Send success message with info
    const successMsg = `╔════════════════════════════╗
║      ✅ *SENT SUCCESS* ✅    ║
╚════════════════════════════╝

📞 Owner Contact Details:
${contactsList.map((jid, i) => {
      const num = (typeof jid === 'string') ? jid.split('@')[0] : String(jid);
      return `  ${i + 1}. 📱 +${num}`;
    }).join('\n')}

💬 Feel free to contact the owner!`;

    await sock.sendMessage(from, { text: successMsg });
    await sock.sendMessage(from, { react: { text: "✅", key: m.key } });

  } catch (e) {
    console.error("Error sending contact:", e);
    await sock.sendMessage(from, {
      text: `❌ Couldn't send contact:\n${e.message}`
    });
  }
});
