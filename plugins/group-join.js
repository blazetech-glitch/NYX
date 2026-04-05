const config = require('../config')
const { cmd, commands } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep, fetchJson } = require('../lib/functions')

cmd({
    pattern: "join",
    react: "📬",
    alias: ["joinme", "f_join"],
    desc: "To Join a Group from Invite link",
    category: "group",
    use: '.join < Group Link >',
    filename: __filename
}, async (conn, mek, m, { from, l, quoted, body, isCmd, command, args, q, isGroup, sender, senderNumber, botNumber2, botNumber, pushname, isMe, isOwner, groupMetadata, groupName, participants, groupAdmins, isBotAdmins, isCreator, isDev, isAdmins, reply }) => {
    try {
        const msr = {
            own_cmd: "❌ Only group admins or owner can use this command."
        };

        // Allow everyone if it's DM, only allow admins/owner in groups
        if (isGroup && !isAdmins && !isCreator) return reply(msr.own_cmd);

        // If there's no input, check if the message is a reply with a link
        if (!q && !quoted) return reply("*Please write the Group Link*️ 🖇️\n\n*Example:*\n.join https://chat.whatsapp.com/xxxxxxxxxxxx");

        let groupLink;

        // If the message is a reply to a group invite link
        if (quoted && quoted.type === 'conversation' && quoted.text && isUrl(quoted.text)) {
            groupLink = quoted.text.split('https://chat.whatsapp.com/')[1];
        } else if (q && isUrl(q)) {
            // If the user provided the link in the command
            groupLink = q.split('https://chat.whatsapp.com/')[1];
        }

        if (!groupLink) return reply("❌ *Invalid Group Link* 🖇️\n\n*Expected format:* https://chat.whatsapp.com/xxxxxxxxxxxx");

        // Show loading reaction
        await conn.sendMessage(from, {
            react: { text: '⏳', key: mek.key }
        });

        // Accept the group invite
        try {
            await conn.groupAcceptInvite(groupLink);

            // Success message
            await conn.sendMessage(from, {
                text: `✅ *Successfully Joined*\n\n🎉 You have been added to the group!\n\n🔗 Invite: https://chat.whatsapp.com/${groupLink}`
            }, { quoted: mek });

            // Send success reaction
            await conn.sendMessage(from, {
                react: { text: '✅', key: mek.key }
            });

        } catch (joinError) {
            console.error("Join error:", joinError);

            // Provide specific error messages
            let errorMsg = "❌ *Failed to join group*\n\n";

            if (joinError.message.includes('not found') || joinError.message.includes('404')) {
                errorMsg += "The invite link is invalid or expired.";
            } else if (joinError.message.includes('already')) {
                errorMsg += "You are already a member of this group.";
            } else if (joinError.message.includes('suspended')) {
                errorMsg += "This group has been suspended.";
            } else if (joinError.message.includes('closed')) {
                errorMsg += "You cannot join this group (closed group).";
            } else {
                errorMsg += joinError.message || "Unknown error occurred. Please try again.";
            }

            await conn.sendMessage(from, { text: errorMsg }, { quoted: mek });

            await conn.sendMessage(from, {
                react: { text: '❌', key: mek.key }
            });
        }

    } catch (e) {
        console.error("Join command error:", e);
        await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
        reply(`❌ *Error:* ${e.message || "An unexpected error occurred"}`);
    }
});
