const packageInfo = require('../package.json');

function userTag(sender) {
  return sender ? `@${String(sender).split('@')[0]}` : 'User';
}

function version() {
  return packageInfo.version || '3.0.0';
}

function context(sender) {
  return sender ? { mentionedJid: [sender] } : {};
}

function image(config, getMainImage) {
  return getMainImage() || { url: config.MENU_IMAGE_URL || config.ALIVE_IMG };
}

function divider(char = '─', length = 30) {
  return char.repeat(length);
}

const cyberMap = {
  a: '𝙖', b: '𝙗', c: '𝙘', d: '𝙙', e: '𝙚', f: '𝙛', g: '𝙜', h: '𝙝', i: '𝙞',
  j: '𝙟', k: '𝙠', l: '𝙡', m: '𝙢', n: '𝙣', o: '𝙤', p: '𝙥', q: '𝙦', r: '𝙧',
  s: '𝙨', t: '𝙩', u: '𝙪', v: '𝙫', w: '𝙬', x: '𝙭', y: '𝙮', z: '𝙯'
};

function cyberText(value) {
  return String(value).split('').map(char => cyberMap[char.toLowerCase()] || char).join('');
}

module.exports = { userTag, version, context, image, divider, cyberText };
