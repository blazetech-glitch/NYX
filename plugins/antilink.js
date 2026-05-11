const { cmd } = require('../command');
const config = require("../config");
const pluginSettings = require('../lib/pluginSettings');
const fs = require('fs').promises;
const path = require('path');

// ╔═══════════════════════════════════════════════════════════════════════╗
// ║                    ANTI-LINK PROTECTION SYSTEM                        ║
// ║         Detects, deletes, and warns users posting links               ║
// ╚═══════════════════════════════════════════════════════════════════════╝

// Comprehensive link detection patterns
const linkPatterns = [
  /(?:https?:\/\/|www\.)\S+/i,
  /https?:\/\/(?:chat\.whatsapp\.com|wa\.me)\/\S+/i,
  /https?:\/\/(?:t\.me|telegram\.me)\/\S+/i,
  /https?:\/\/(?:www\.)?youtube\.com\/\S+/i,
  /https?:\/\/youtu\.be\/\S+/i,
  /https?:\/\/(?:www\.)?facebook\.com\/\S+/i,
  /https?:\/\/fb\.me\/\S+/i,
  /https?:\/\/(?:www\.)?instagram\.com\/\S+/i,
  /https?:\/\/(?:www\.)?twitter\.com\/\S+/i,
  /https?:\/\/(?:www\.)?tiktok\.com\/\S+/i,
  /https?:\/\/(?:www\.)?linkedin\.com\/\S+/i,
  /https?:\/\/(?:www\.)?snapchat\.com\/\S+/i,
  /https?:\/\/(?:www\.)?pinterest\.com\/\S+/i,
  /https?:\/\/(?:www\.)?reddit\.com\/\S+/i,
  /https?:\/\/ngl\.link\/\S+/i,
  /https?:\/\/(?:www\.)?discord\.com\/\S+/i,
  /https?:\/\/(?:www\.)?twitch\.tv\/\S+/i,
  /https?:\/\/(?:www\.)?vimeo\.com\/\S+/i,
  /https?:\/\/(?:www\.)?dailymotion\.com\/\S+/i,
  /https?:\/\/(?:www\.)?medium\.com\/\S+/i,
  /https?:\/\/bit\.ly\/\S+/i,
  /https?:\/\/tinyurl\.com\/\S+/i
];

// Fun warning messages
const funMessages = [
  "Stop trying to be a marketer! 😂",
  "No spamming links, buddy! 🚫",
  "Links? In MY group? Absolutely not! 🙅",
  "That link has been *yeeted* into oblivion! 🚀",
  "I'm allergic to links, sorry! 🤧",
  "Somebody stop this madlad! 😤",
  "Links detected... OBLITERATED! 💥",
  "Your link privileges have expired! 📵",
  "Not on my watch! 👮"
];

const kickMessages = [
  "You've been permanently banned from link posting. Goodbye! 👋",
  "Too many warnings! Time to go! 🚪❌",
  "That's all folks! See you later! 👋",
  "You're out! No more link parties for you! 🎉❌",
  "Time to take a little break from this group! 🌴"
];

// Extract warns file location
const warnsFile = path.join(process.cwd(), 'store', 'antilink_warns.json');

// Helper: Read warns
const readWarns = async () => {
  try {
    const data = await fs.readFile(warnsFile, 'utf8');
    return JSON.parse(data || '{}');
  } catch (e) {
    return {};
  }
};

// Helper: Write warns
const writeWarns = async (obj) => {
  try {
    await fs.mkdir(path.dirname(warnsFile), { recursive: true });
    await fs.writeFile(warnsFile, JSON.stringify(obj, null, 2), 'utf8');
  } catch (e) {
    console.error('Error writing warns file:', e);
  }
};

// Helper: Extract text from various message types
const extractMessageText = (body, message) => {
  let text = (body || '').toString();
  const msg = message || {};
  
  if (!text || text.trim().length === 0) {
    if (msg.conversation) text = msg.conversation;
    else if (msg.extendedTextMessage?.text) text = msg.extendedTextMessage.text;
    else if (msg.imageMessage?.caption) text = msg.imageMessage.caption;
    else if (msg.videoMessage?.caption) text = msg.videoMessage.caption;
    else if (msg.documentMessage?.caption) text = msg.documentMessage.caption;
    else if (msg.buttonsResponseMessage?.selectedButtonId) text = msg.buttonsResponseMessage.selectedButtonId;
    else if (msg.templateButtonReplyMessage?.selectedId) text = msg.templateButtonReplyMessage.selectedId;
    else text = '';
  }
  
  return text;
};

// Helper: Check if text contains link
const containsLink = (text) => {
  return linkPatterns.some(pattern => pattern.test(text || ''));
};

// Helper: Get random fun message
const getRandomMessage = (arr) => arr[Math.floor(Math.random() * arr.length)];

// Main Anti-Link Handler
cmd({
  'on': "body"
}, async (conn, m, store, {
  from,
  body,
  sender,
  isGroup,
  isAdmins,
  isBotAdmins,
  reply,
  mentions,
  groupMetadata,
  botNumber2,
  botNumber
}) => {
  try {
    // Skip if not a group
    if (!isGroup) return;
    
    // Check if bot is admin - use both isBotAdmins and manual verification
    let botIsAdmin = isBotAdmins;
    
    // Manual verification if isBotAdmins is unreliable
    if (!botIsAdmin && groupMetadata && groupMetadata.participants) {
      const botJid = botNumber2 || botNumber || (m.key && m.key.participant);
      const adminList = groupMetadata.participants
        .filter(p => p.admin)
        .map(p => p.id);
      botIsAdmin = adminList.some(adminJid => 
        adminJid === botJid || 
        adminJid.includes(botJid?.split('@')[0])
      );
    }
    
    if (!botIsAdmin) {
      console.log('⚠️ Bot is not admin in this group - antilink check skipped');
      return;
    }

    // Check global setting and per-group override for anti-link
    let antiLinkEnabled = config.ANTI_LINK === 'true';
    try {
      const override = await pluginSettings.get(from, 'antilink');
      if (override !== undefined) {
        antiLinkEnabled = (override === true || String(override) === 'true' || String(override).toLowerCase() === 'on');
      }
    } catch (err) {
      console.error('Error reading antilink plugin setting:', err);
    }

    if (!antiLinkEnabled) return;

    // Allow admins to post links without restriction
    if (isAdmins) {
      console.log(`Admin ${sender} can post links freely`);
      return;
    }

    // Extract and check message text
    const messageText = extractMessageText(body, m.message);
    
    if (!containsLink(messageText)) {
      return; // No link detected, continue
    }

    console.log(`🚫 Link detected from non-admin ${sender} in ${from}`);

    // Determine action mode
    const defaultAction = config.DELETE_LINKS === 'true' ? 'delete_warn' : 'warn';
    let antilinkAction = (config.ANTI_LINK_ACTION || defaultAction).toString().toLowerCase();
    
    try {
      const actionOverride = await pluginSettings.get(from, 'antilink_action');
      if (actionOverride) antilinkAction = String(actionOverride).toLowerCase();
    } catch (err) {
      console.error('Error reading antilink_action setting:', err);
    }

    const shouldDelete = antilinkAction.startsWith('delete');
    const shouldWarn = antilinkAction.includes('warn');
    const shouldKick = antilinkAction.includes('kick') || String(config.ANTI_LINK_KICK) === 'true';

    // ╔══════════════════════════════════════════════════════════════╗
    // ║                      DELETE MESSAGE                          ║
    // ╚══════════════════════════════════════════════════════════════╝
    if (shouldDelete) {
      try {
        // Force delete using the exact message key
        await conn.sendMessage(from, { delete: m.key });
        console.log(`✅ Link message DELETED from ${sender}`);
        
        // Send deletion notification with fun message
        try {
          await conn.sendMessage(from, {
            text: `🔴 *LINK DETECTED & DELETED* 🔴\n\n${getRandomMessage(funMessages)}\n\n@${sender.split('@')[0]} - Links are not allowed here!`,
            mentions: [sender]
          });
        } catch (err) {
          console.error('Error sending deletion notification:', err.message);
        }
      } catch (err) {
        console.error('Failed to delete message:', err.message);
        try {
          await conn.sendMessage(from, {
            text: `⚠️ Link detected from @${sender.split('@')[0]} but couldn't be deleted. Bot needs admin rights!`,
            mentions: [sender]
          });
        } catch (e) {
          console.error('Error sending fallback deletion message:', e);
        }
      }
    }

    // ╔══════════════════════════════════════════════════════════════╗
    // ║                    IMMEDIATE KICK ACTION                     ║
    // ╚══════════════════════════════════════════════════════════════╝
    if (shouldKick) {
      try {
        const kickMsg = getRandomMessage(kickMessages);
        await conn.sendMessage(from, {
          text: `🚫 @${sender.split('@')[0]}\n\n${kickMsg}`,
          mentions: [sender]
        });
        
        // Remove user
        await conn.groupParticipantsUpdate(from, [sender], 'remove');
        console.log(`❌ User ${sender} kicked for posting link`);
      } catch (err) {
        console.error('Failed to kick user:', err.message);
      }
      return;
    }

    // ╔══════════════════════════════════════════════════════════════╗
    // ║                      WARNING SYSTEM                          ║
    // ╚══════════════════════════════════════════════════════════════╝
    
    // Only proceed with warning system if enabled
    if (shouldWarn) {
      const warns = await readWarns();
      
      // Initialize group warns if needed
      if (!warns[from]) warns[from] = {};
      
      // Get current warns for user
      const currentWarns = warns[from][sender] ? Number(warns[from][sender]) : 0;
      const newWarns = currentWarns + 1;
      
      // Update warns
      warns[from][sender] = newWarns;
      await writeWarns(warns);

      const maxWarns = 5;
      
      // ╔══════════════════════════════════════════════════════════════╗
      // ║                   MAX WARNS REACHED - KICK                   ║
      // ╚══════════════════════════════════════════════════════════════╝
      if (newWarns >= maxWarns) {
        delete warns[from][sender];
        await writeWarns(warns);

        try {
          const kickMsg = getRandomMessage(kickMessages);
          await conn.sendMessage(from, {
            text: `🚫 @${sender.split('@')[0]}\n\n⚠️ ${maxWarns} WARNINGS REACHED!\n${kickMsg}\n\n👋 Goodbye!`,
            mentions: [sender]
          });
          
          // Remove the user
          await conn.groupParticipantsUpdate(from, [sender], 'remove');
          console.log(`❌ User ${sender} removed after ${maxWarns} link warnings`);
        } catch (err) {
          console.error('Failed to remove user after max warns:', err.message);
        }
        return;
      }

      // ╔══════════════════════════════════════════════════════════════╗
      // ║                    SEND WARNING MESSAGE                      ║
      // ╚══════════════════════════════════════════════════════════════╝
      try {
        let warningText = `⚠️ *WARNING* ⚠️\n\n`;
        warningText += `🚫 @${sender.split('@')[0]}\n\n`;
        warningText += `📊 *WARN COUNT: ${newWarns}/${maxWarns}*\n\n`;
        warningText += `❌ Links are NOT allowed in this group!\n`;
        warningText += `✂️ Your link message was deleted\n\n`;
        
        if (newWarns >= 3) {
          warningText += `🔴 *DANGER!* You're close to removal!\n`;
        }
        
        warningText += `⏰ ${maxWarns - newWarns} more warnings until you're removed!`;

        await conn.sendMessage(from, {
          text: warningText,
          mentions: [sender]
        });
        
        console.log(`⚠️ Warning ${newWarns}/${maxWarns} sent to ${sender}`);
      } catch (err) {
        console.error('Error sending warning:', err);
        try {
          // Fallback message
          reply(`⚠️ @${sender.split('@')[0]} WARNING ${newWarns}/${maxWarns}`);
        } catch (e) {
          console.error('Fallback message also failed');
        }
      }
    }

  } catch (error) {
    console.error('Anti-link handler error:', error);
    reply("⚠️ An error occurred in the anti-link system.");
  }
});
