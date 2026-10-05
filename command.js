var commands = [];
const config = require('./config');
const { getPrefix } = require('./lib/prefix');
const { normalizePermissions } = require('./lib/permissions');

function _normalizeJid(num) {
    if (!num) return num;
    if (num.includes('@')) return num;
    return `${num}@s.whatsapp.net`;
}

function _isOwnerJid(jid) {
    if (!jid) return false;
    const owners = [config.OWNER_NUMBER, config.OWNER_NUMBER2, config.DEV].filter(Boolean).map(_normalizeJid);
    return owners.includes(jid);
}

function cmd(info, func) {
    var data = info;
    // wrap provided function to enforce MODE / PUBLIC_MODE restrictions
    const original = func;
    data.function = async function () {
        try {
            const args = Array.from(arguments);
            const meta = args[3] || {};
            normalizePermissions(args[0], args[2], meta);
            const sender = meta.sender || meta.from || (args[2] && args[2].sender) || null;
            const isPrivateMode = (config.MODE === 'private' || String(config.PUBLIC_MODE) === 'false');
            if (isPrivateMode && sender && !_isOwnerJid(sender)) {
                const reply = meta.reply;
                if (typeof reply === 'function') return reply('❌ Bot is in private mode — only the owner may use commands.');
                return;
            }
        } catch (e) {
            console.error('Error in command wrapper:', e);
        }
        return original.apply(this, arguments);
    };
    if (!data.dontAddCommandList) data.dontAddCommandList = false;
    if (!info.desc) info.desc = '';
    if (!data.fromMe) data.fromMe = false;
    if (!info.category) data.category = 'misc';
    if (!info.filename) data.filename = "Not Provided";
    commands.push(data);
    return data;
}

// Function to check if message starts with any valid prefix for the user
function checkPrefix(body, sender) {
    if (!body || !sender) return { hasPrefix: false, command: '', prefix: '' };

    const userId = sender.split('@')[0];
    const userPrefix = getPrefix(userId);
    const defaultPrefix = config.PREFIX;

    // Check user-specific prefix first
    if (body.startsWith(userPrefix)) {
        return {
            hasPrefix: true,
            command: body.slice(userPrefix.length).trim(),
            prefix: userPrefix
        };
    }

    // Check default prefix
    if (body.startsWith(defaultPrefix)) {
        return {
            hasPrefix: true,
            command: body.slice(defaultPrefix.length).trim(),
            prefix: defaultPrefix
        };
    }

    return { hasPrefix: false, command: '', prefix: '' };
}

module.exports = {
    cmd,
    AddCommand: cmd,
    Function: cmd,
    Module: cmd,
    commands,
    checkPrefix
};
