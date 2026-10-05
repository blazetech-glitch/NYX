const config = require('../config');

function normalizeJid(value) {
  if (!value) return '';
  return String(value).trim().toLowerCase().replace(/:\d+(?=@)/, '');
}

function valuesOf(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.flatMap(valuesOf);
  if (typeof value === 'object') {
    return ['id', 'jid', 'lid', 'phoneNumber', 'phone_number', 'pn', 'user'].flatMap(key => valuesOf(value[key]));
  }
  return [String(value)];
}

function sameIdentity(a, b) {
  const left = normalizeJid(a);
  const right = normalizeJid(b);
  if (!left || !right) return false;
  if (left === right) return true;
  const leftType = left.split('@')[1];
  const rightType = right.split('@')[1];
  // Never equate unrelated numeric LIDs with phone numbers.
  const phoneTypes = new Set(['s.whatsapp.net', 'c.us']);
  return phoneTypes.has(leftType) && phoneTypes.has(rightType) && left.split('@')[0] === right.split('@')[0];
}

function participantIsAdmin(participant) {
  return Boolean(participant && (participant.admin === 'admin' || participant.admin === 'superadmin' || participant.admin === true || participant.admin != null));
}

function isSenderAdmin({ message, meta }) {
  if (meta?.isAdmins === true) return true;
  const candidates = valuesOf([
    meta?.sender,
    meta?.senderNumber,
    message?.sender,
    message?.senderAlt,
    message?.key?.participant,
    message?.key?.participantAlt,
    message?.key?.remoteJidAlt
  ]);
  const participants = meta?.groupMetadata?.participants || meta?.participants || [];
  return participants.some(participant => participantIsAdmin(participant) && valuesOf(participant).some(adminId => candidates.some(candidate => sameIdentity(adminId, candidate))));
}

function isBotAdmin({ conn, message, meta }) {
  if (meta?.isBotAdmins === true) return true;
  const botCandidates = valuesOf([
    meta?.botNumber,
    meta?.botNumber2,
    conn?.user?.id,
    conn?.user?.jid
  ]);
  const participants = meta?.groupMetadata?.participants || meta?.participants || [];
  return participants.some(participant => participantIsAdmin(participant) && valuesOf(participant).some(adminId => botCandidates.some(botId => sameIdentity(adminId, botId))));
}

function isOwner({ message, meta }) {
  if (meta?.isOwner === true || meta?.isCreator === true) return true;
  const owners = [config.OWNER_NUMBER, config.OWNER_NUMBER2, config.DEV].filter(Boolean);
  const candidates = valuesOf([meta?.sender, meta?.senderNumber, message?.sender, message?.senderAlt, message?.key?.participant, message?.key?.participantAlt, message?.key?.remoteJidAlt]);
  return owners.some(owner => candidates.some(candidate => sameIdentity(owner, candidate) || normalizeJid(owner).split('@')[0] === normalizeJid(candidate).split('@')[0]));
}

function normalizePermissions(conn, message, meta) {
  if (!meta || !message) return meta;
  const admin = isSenderAdmin({ message, meta });
  const botAdmin = isBotAdmin({ conn, message, meta });
  const owner = isOwner({ message, meta });
  if (admin) meta.isAdmins = true;
  if (botAdmin) meta.isBotAdmins = true;
  if (owner) {
    meta.isOwner = true;
    meta.isCreator = true;
  }
  return meta;
}

module.exports = { normalizeJid, normalizePermissions, isSenderAdmin, isBotAdmin, isOwner };
