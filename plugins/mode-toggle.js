const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');

const envFile = path.join(__dirname, '../config.env');

function persistMode(newMode) {
    let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
    if (/^MODE\s*=.*/m.test(envContent)) {
        envContent = envContent.replace(/^MODE\s*=.*/m, `MODE=${newMode}`);
    } else {
        envContent += `\nMODE=${newMode}`;
    }
    fs.writeFileSync(envFile, envContent.trim() + "\n");
}

cmd({
    pattern: 'setmode',
    alias: ['mode'],
    desc: 'Set bot mode: public | private | inbox | groups (owner only)',
    category: 'settings',
    filename: __filename
}, async (conn, mek, m, { args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply('🚫 Only owner can change bot mode');
        const mode = (args[0] || '').toLowerCase();
        if (!['public', 'private', 'inbox', 'groups'].includes(mode)) return reply('Usage: .setmode <public|private|inbox|groups>');
        config.MODE = mode;
        persistMode(mode);
        // also set PUBLIC_MODE flag for visibility
        try {
            let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
            const pub = mode === 'public' ? 'true' : 'false';
            if (/^PUBLIC_MODE\s*=.*/m.test(envContent)) envContent = envContent.replace(/^PUBLIC_MODE\s*=.*/m, `PUBLIC_MODE=${pub}`);
            else envContent += `\nPUBLIC_MODE=${pub}`;
            fs.writeFileSync(envFile, envContent.trim() + "\n");
            config.PUBLIC_MODE = pub;
        } catch (e) { }

        await reply(`✅ Bot mode updated to *${mode.toUpperCase()}*`);
    } catch (e) {
        console.error(e);
        reply('❌ Error setting mode: ' + e.message);
    }
});

// Convenience commands
cmd({ pattern: 'public', desc: 'Set bot to public mode (owner only)', category: 'settings', filename: __filename }, async (conn, mek, m, { isCreator, reply }) => {
    if (!isCreator) return reply('🚫 Only owner can change bot mode');
    config.MODE = 'public';
    persistMode('public');
    try { // update PUBLIC_MODE too
        let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
        if (/^PUBLIC_MODE\s*=.*/m.test(envContent)) envContent = envContent.replace(/^PUBLIC_MODE\s*=.*/m, `PUBLIC_MODE=true`);
        else envContent += `\nPUBLIC_MODE=true`;
        fs.writeFileSync(envFile, envContent.trim() + "\n");
        config.PUBLIC_MODE = 'true';
    } catch (e) { }
    await reply('✅ Bot set to PUBLIC mode — anyone can use commands');
});

cmd({ pattern: 'private', desc: 'Set bot to private mode (owner only)', category: 'settings', filename: __filename }, async (conn, mek, m, { isCreator, reply }) => {
    if (!isCreator) return reply('🚫 Only owner can change bot mode');
    config.MODE = 'private';
    persistMode('private');
    try {
        let envContent = fs.existsSync(envFile) ? fs.readFileSync(envFile, 'utf8') : '';
        if (/^PUBLIC_MODE\s*=.*/m.test(envContent)) envContent = envContent.replace(/^PUBLIC_MODE\s*=.*/m, `PUBLIC_MODE=false`);
        else envContent += `\nPUBLIC_MODE=false`;
        fs.writeFileSync(envFile, envContent.trim() + "\n");
        config.PUBLIC_MODE = 'false';
    } catch (e) { }
    await reply('✅ Bot set to PRIVATE mode — only owner can use commands');
});
