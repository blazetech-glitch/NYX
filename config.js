const fs = require('fs');
if (fs.existsSync('config.env')) require('dotenv').config({ path: './config.env' });

function convertToBool(text, fault = 'true') {
    return text === fault ? true : false;
}
module.exports = {
    SESSION_ID: process.env.SESSION_ID || "BLAZE~PYEDCCpK#bW17UmXpYbHUcfAzJL9dUcfkP4LVVO8WekRXbfBv2eM",
    // add your Session Id
    AUTO_STATUS_SEEN: process.env.AUTO_STATUS_SEEN || "true",
    // make true or false status auto seen
    AUTO_STATUS_REPLY: process.env.AUTO_STATUS_REPLY || "false",
    // make true if you want auto reply on status
    AUTO_BIO: process.env.AUTO_BIO || "true", // ture to get auto bio
    AUTO_STATUS_REACT: process.env.AUTO_STATUS_REACT || "true",
    // make true if you want auto reply on status
    AUTO_STATUS_MSG: process.env.AUTO_STATUS_MSG || ".𝗦𝗘𝗘𝗡 𝗬𝗢𝗨𝗥 𝗦𝗧𝗔𝗧𝗨𝗦 𝗕𝗬 𝗣𝗢𝗣𝗞𝗜𝗗 𝗫𝗧𝗥🔄",
    // set the auto reply massage on status reply
    ANTI_LINK: process.env.ANTI_LINK || "on",
    // make anti link true,false for groups
    MENTION_REPLY: process.env.MENTION_REPLY || "true",
    // make true if want auto voice reply if someone menetion you
    MENU_IMAGE_URL: process.env.MENU_IMAGE_URL || "https://files.catbox.moe/kbbm5e.jpg",
    // add custom menu and mention reply image url
    PREFIX: process.env.PREFIX || ".",
    // add your prifix for bot
    BOT_NAME: process.env.BOT_NAME || "NYX MD",
    // add bot namw here for menu
    STICKER_NAME: process.env.STICKER_NAME || "NYX-MD",
    // type sticker pack name
    CUSTOM_REACT: process.env.CUSTOM_REACT || "false",
    // make this true for custum emoji react
    CUSTOM_REACT_EMOJIS: process.env.CUSTOM_REACT_EMOJIS || "💝,💖,💗,❤️‍🩹,❤️,🧡,💛,💚,💙,💜,🤎,🖤,🤍",
    // chose custom react emojis by yourself
    DELETE_LINKS: process.env.DELETE_LINKS || "true",
    // automatic delete links without removing member
    ANTI_LINK_ACTION: process.env.ANTI_LINK_ACTION || "delete_warn",
    // actions for anti-link: delete_warn (default), delete_only, delete_kick
    OWNER_NUMBER: process.env.OWNER_NUMBER || "255627417402",
    // add your bot owner number
    // add your bot owner number
    OWNER_NAME: process.env.OWNER_NAME || "BLAZE TEAM",
    // add bot owner name
    DESCRIPTION: process.env.DESCRIPTION || "© NYX MD bot",
    // add bot owner name
    ALIVE_IMG: process.env.ALIVE_IMG || "https://files.catbox.moe/kbbm5e.jpg",
    // add img for alive msg
    LIVE_MSG: process.env.LIVE_MSG || ">NYX MD IS ALIVE😍",
    // add alive msg here
    // Newsletter and links
    NEWSLETTER_JID: process.env.NEWSLETTER_JID || '120363421014261315@newsletter',
    CHANNEL_LINK: process.env.CHANNEL_LINK || 'https://whatsapp.com/channel/0029VbC49Bb2P59togOaEF2E',
    CHANNEL_JID: process.env.CHANNEL_JID || '120363421014261315@newsletter',
    GROUP_LINK: process.env.GROUP_LINK || 'https://chat.whatsapp.com/IrmNcI7Wn0C4bdLC70xVPJ',
    DEFAULT_GROUP_JID: process.env.DEFAULT_GROUP_JID || '120363406591837257@g.us',
    // secondary owner (used by .owner and internal checks)
    OWNER_NUMBER2: process.env.OWNER_NUMBER2 || "255754206718",
    READ_MESSAGE: process.env.READ_MESSAGE || "false",
    // Turn true or false for automatic read msgs
    AUTO_REACT: process.env.AUTO_REACT || "false",
    // make this true or false for auto react on all msgs
    ANTI_BAD: process.env.ANTI_BAD || "true",
    // false or true for anti bad words
    MODE: process.env.MODE || "public",
    // make bot public-private-inbox-group
    ANTI_LINK_KICK: process.env.ANTI_LINK_KICK || "false",
    // make anti link true,false for groups
    AUTO_VOICE: process.env.AUTO_VOICE || "true",
    // make true for send automatic voices
    AUTO_STICKER: process.env.AUTO_STICKER || "false",
    // make true for automatic stickers
    AUTO_REPLY: process.env.AUTO_REPLY || "true",
    // make true or false automatic text reply
    ALWAYS_ONLINE: process.env.ALWAYS_ONLINE || "false",
    // maks true for always online
    PUBLIC_MODE: process.env.PUBLIC_MODE || "true",
    // make false if want private mod
    AUTO_TYPING: process.env.AUTO_TYPING || "true",
    // true for automatic show typing
    READ_CMD: process.env.READ_CMD || "false",
    // true if want mark commands as read
    DEV: process.env.DEV || "255627417402",
    //replace with your whatsapp number
    ANTI_VV: process.env.ANTI_VV || "true",
    // true for anti once view
    ANTI_DEL_PATH: process.env.ANTI_DEL_PATH || "log",
    // change it to 'same' if you want to resend deleted message in same chat
    AUTO_RECORDING: process.env.AUTO_RECORDING || "true",
    // make it true for auto recoding
    WELCOME: process.env.WELCOME || "true",
    // make true for welcome messages on group member add
    GOODBYE: process.env.GOODBYE || "true",
    // make true for goodbye messages on group member remove
    HEROKU_API_KEY: process.env.HEROKU_API_KEY || "",
    // Your Heroku API key for automatic redeploy
    HEROKU_APP_NAME: process.env.HEROKU_APP_NAME || "",
    // Your Heroku app name for automatic redeploy
    BAILEYS: process.env.BAILEYS || "@whiskeysockets/baileys",
    // Baileys library reference
    SPOTIFY_CLIENT_ID: process.env.SPOTIFY_CLIENT_ID || "",
    // Spotify API Client ID for search
    SPOTIFY_CLIENT_SECRET: process.env.SPOTIFY_CLIENT_SECRET || "",
    // Spotify API Client Secret for search
};
