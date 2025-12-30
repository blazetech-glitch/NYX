const config = require('../config')
const { cmd } = require('../command')
const { getBuffer, getGroupAdmins, getRandom, h2k, isUrl, Json, runtime, sleep } = require('../lib/functions')

cmd({
    pattern: "ginfo",
    react: "🥏",
    alias: ["groupinfo"],
    desc: "Get group information.",
    category: "group",
    use: '.ginfo',
    filename: __filename
},
    async (conn, mek, m, {
        from, quoted, isCmd, isGroup, sender, isBotAdmins,
        isAdmins, isDev, reply, groupMetadata, participants
    }) => {
        try {
            // Requirements
            if (!isGroup) return reply(`❌ This command only works in group chats.`);
            if (!isAdmins && !isDev) return reply(`⛔ Only *Group Admins* or *Bot Dev* can use this.`);
            if (!isBotAdmins) return reply(`❌ I need *admin* rights to fetch group details.`);

            const fallbackPpUrls = [
                'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
                'https://i.ibb.co/KhYC4FY/1221bc0bdd2354b42b293317ff2adbcf-icon.png',
            ];
            let ppUrl;
            try {
                ppUrl = await conn.profilePictureUrl(from, 'image');
            } catch {
                ppUrl = fallbackPpUrls[Math.floor(Math.random() * fallbackPpUrls.length)];
            }

            const metadata = groupMetadata || await conn.groupMetadata(from);
            const participantsList = (metadata && metadata.participants) ? metadata.participants : (participants || []);
            const adminIds = getGroupAdmins(participantsList);
            const listAdmin = adminIds.map((id, i) => `${i + 1}. @${id.split('@')[0]}`).join('\n') || 'No admins';
            const owner = metadata.owner || metadata.subjectOwner || (adminIds[0] || null);
            const participantCount = (participantsList && participantsList.length) || metadata.size || 0;

            const gdata = `*「 Group Information 」*\n
    *Group Name* : ${metadata.subject || 'Unknown'}
    *Group ID* : ${metadata.id || from}
    *Participants* : ${participantCount}
    *Group Creator* : ${owner ? `@${owner.split('@')[0]}` : 'Unknown'}
    *Description* : ${metadata.desc?.toString() || 'No description'}\n
    *Admins (${adminIds.length})*:\n${listAdmin}`

            await conn.sendMessage(from, {
                image: { url: ppUrl },
                caption: gdata,
                mentions: (adminIds || []).concat(owner ? [owner] : [])
            }, { quoted: mek });

        } catch (e) {
            console.error(e);
            await conn.sendMessage(from, { react: { text: '❌', key: mek.key } });
            reply(`❌ An error occurred:\n\n${e}`);
        }
    });
