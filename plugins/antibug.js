const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');

const envFile = path.join(__dirname, '../config.env');

function persistFlag(key, value) {
    let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
    const re = new RegExp(`^${key}\\s*=.*`, 'm');
    if (re.test(envContent)) envContent = envContent.replace(re, `${key}=${value}`);
    else envContent += `\n${key}=${value}`;
    fs.writeFileSync(envFile, envContent.trim() + "\n");
}

// Toggle command: .antibug on|off
cmd({ pattern: 'antibug', desc: 'Enable/disable antibug detection', category: 'security', filename: __filename }, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply('🚫 Only the owner can toggle antibug.');
        const sub = (args[0] || '').toLowerCase();
        if (!['on', 'off'].includes(sub)) return reply('Usage: .antibug on|off');
        const newVal = sub === 'on' ? 'true' : 'false';
        config.ANTI_BUG = newVal;
        persistFlag('ANTI_BUG', newVal);
        await reply(`✅ Antibug detection turned *${sub.toUpperCase()}*`);
    } catch (e) { console.error(e); reply('Error toggling antibug: ' + e.message) }
});

// Automatic detection handler (on every body)
cmd({ pattern: '', on: 'body', desc: 'Antibug auto detector', filename: __filename }, async (conn, mek, m, { from, reply, body, isCmd, sender }) => {
    try {
        if (config.ANTI_BUG !== 'true') return;
        if (!body) return;
        if (mek && mek.key && mek.key.fromMe) return; // ignore bot

        // owner numbers exempt
        const senderNum = (sender || mek.key.participant || mek.key.remoteJid || '').split('@')[0];
        const owners = [config.OWNER_NUMBER, config.OWNER_NUMBER2, config.DEV].map(x => (x || '').toString());
        if (owners.includes(senderNum)) return;

        const suspicious = [
            /\bbug\b/i,
            /\bexploit\b/i,
            /<script\b/i,
            /eval\s*\(/i,
            /process\.exit/i,
            /rm\s+-rf/i,
            /child_process/i,
            /require\s*\(/i,
            /\bexec\s*\(/i,
            /curl\s+https?:\/\//i,
            /wget\s+https?:\/\//i,
            /base64_decode/i,
            /system\s*\(/i,
            /popen\s*\(/i,
            /\bnc\s+-l\b/i
        ];

        const hasSuspicious = suspicious.some(r => r.test(body));
        const longWeird = body.length > 2000 && /[^\w\s\.,:;(){}\[\]<>"'`~!@#\$%\^&\*-+=\/\\|?]/.test(body);

        if (hasSuspicious || longWeird) {
            // polite warning
            const warn = `⚠️ Security Notice:\nYour message appears to contain potentially harmful content or exploit code. For safety, this account blocks such content automatically. If you believe this is a mistake, contact the owner.`;
            try { await conn.sendMessage(from, { text: warn }, { quoted: mek }) } catch (e) { }

            // attempt to block the sender
            try {
                const target = sender || mek.key.participant || mek.key.remoteJid;
                if (typeof conn.updateBlockStatus === 'function') await conn.updateBlockStatus(target, 'block');
                else if (typeof conn.blockUser === 'function') await conn.blockUser(target);
            } catch (e) { console.error('Failed to block suspected user:', e) }

            // optionally log to console
            console.log(`Antibug: blocked ${senderNum} for suspicious message.`);
        }
    } catch (e) { console.error('Antibug handler error:', e) }
});
