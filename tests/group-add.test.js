const test = require('node:test');
const assert = require('node:assert/strict');
const { resolveBotAdminStatus } = require('../plugins/group-add');

test('resolveBotAdminStatus uses group metadata when the flag is stale', async () => {
  const conn = {
    user: { id: '1234567890@s.whatsapp.net' },
    groupMetadata: async () => ({
      participants: [
        { id: '1234567890@s.whatsapp.net', admin: 'admin' },
      ],
    }),
  };

  const result = await resolveBotAdminStatus(conn, '12025550199-12345@g.us', {
    isBotAdmins: false,
    botNumber2: '1234567890',
  });

  assert.equal(result, true);
});

test('resolveBotAdminStatus returns false when the bot is not an admin', async () => {
  const conn = {
    user: { id: '1234567890@s.whatsapp.net' },
    groupMetadata: async () => ({
      participants: [{ id: '9999999999@s.whatsapp.net', admin: 'admin' }],
    }),
  };

  const result = await resolveBotAdminStatus(conn, '12025550199-12345@g.us', {
    isBotAdmins: false,
    botNumber2: '1234567890',
  });

  assert.equal(result, false);
});
