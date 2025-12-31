const fs = require('fs');
const path = require('path');
const { cmd } = require('../command');
const config = require('../config');

const promptsFile = path.join(__dirname, '../data/prompts.json');
let prompts = { video: "" };
try { prompts = JSON.parse(fs.readFileSync(promptsFile, 'utf8') || '{}') } catch (e) { prompts = { video: "" } }

function save() { fs.writeFileSync(promptsFile, JSON.stringify(prompts, null, 2)) }

// Get prompt: .getprompt [type]
cmd({ pattern: 'getprompt', alias: ['promptget'], desc: 'Get saved prompt (owner only)', category: 'settings', filename: __filename }, async (conn, mek, m, { from, args, isCreator, reply }) => {
    try {
        if (!isCreator) return reply('🚫 Owner only');
        const type = (args[0] || 'video').toLowerCase();
        const val = prompts[type] || '';
        if (!val) return reply(`No prompt saved for type: ${type}`);
        await reply(`Saved prompt for *${type}*:\n${val}`);
    } catch (e) { console.error(e); reply('Error fetching prompt') }
});

// Set prompt: .setprompt <type> <prompt text>
cmd({ pattern: 'setprompt', alias: ['promptset'], desc: 'Set saved prompt (owner only)', category: 'settings', filename: __filename }, async (conn, mek, m, { from, args, isCreator, reply, q }) => {
    try {
        if (!isCreator) return reply('🚫 Owner only');
        const type = (args[0] || '').toLowerCase();
        if (!type) return reply('Usage: .setprompt <type> <prompt text>\nExample: .setprompt video A cinematic scene of...');
        const rest = q.split(' ').slice(1).join(' ').trim();
        if (!rest) return reply('Please provide the prompt text to save.');
        prompts[type] = rest;
        save();
        await reply(`✅ Prompt for *${type}* saved.`);
    } catch (e) { console.error(e); reply('Error saving prompt') }
});
