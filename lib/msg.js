const { proto, downloadContentFromMessage, getContentType } = require('@whiskeysockets/baileys')
const fs = require('fs')

/* =================================================
   DOWNLOAD MEDIA (UNCHANGED – FULL SUPPORT)
================================================= */
const downloadMediaMessage = async (m, filename) => {
  if (m.type === 'viewOnceMessage') {
    m.type = m.msg.type
  }

  const stream = await downloadContentFromMessage(m.msg, m.type.replace('Message', ''))

  let buffer = Buffer.from([])
  for await (const chunk of stream) {
    buffer = Buffer.concat([buffer, chunk])
  }

  const ext =
    m.type === 'imageMessage' ? 'jpg' :
      m.type === 'videoMessage' ? 'mp4' :
        m.type === 'audioMessage' ? 'mp3' :
          m.type === 'stickerMessage' ? 'webp' :
            'bin'

  const name = filename ? `${filename}.${ext}` : `file.${ext}`

  fs.writeFileSync(name, buffer)
  return fs.readFileSync(name)
}


/* =================================================
   ⭐ FULL MESSAGE SERIALIZER (FIXED VERSION)
================================================= */
const sms = (conn, m, store) => {
  if (!m) return m

  let M = proto.WebMessageInfo

  /* ========= BASIC INFO ========= */
  if (m.key) {
    m.id = m.key.id
    m.chat = m.key.remoteJid
    m.fromMe = m.key.fromMe
    m.isGroup = m.chat.endsWith('@g.us')

    m.sender = m.fromMe
      ? conn.user.id.split(':')[0] + '@s.whatsapp.net'
      : (m.key.participant || m.chat)
    m.senderAlt = m.key.participantAlt || m.key.remoteJidAlt || null
  }

  /* ========= MESSAGE ========= */
  if (m.message) {
    m.mtype = getContentType(m.message)

    m.msg =
      m.mtype === 'viewOnceMessage'
        ? m.message[m.mtype].message[getContentType(m.message[m.mtype].message)]
        : m.message[m.mtype]

    /* =====================================================
       ⭐⭐⭐ THE REAL FIX IS HERE ⭐⭐⭐
       This collects text from ALL message types
    ===================================================== */
    try {
      m.body =
        m.message.conversation ||
        m.msg.caption ||
        m.msg.text ||
        m.msg.selectedDisplayText ||
        m.msg.singleSelectReply?.selectedRowId ||
        m.msg.selectedButtonId ||
        ''
    } catch {
      m.body = ''
    }

    /* =====================================================
       ⭐ FINAL — COMMAND HANDLER READS THIS
    ===================================================== */
    m.text = m.body
  }

  /* ========= HELPERS (UNCHANGED) ========= */

  m.reply = (text, options = {}) =>
    conn.sendMessage(m.chat, { text, ...options }, { quoted: m })

  m.replyimg = (img, caption) =>
    conn.sendMessage(m.chat, { image: img, caption }, { quoted: m })

  m.imgurl = (url, caption) =>
    conn.sendMessage(m.chat, { image: { url }, caption }, { quoted: m })

  m.react = (emoji) =>
    conn.sendMessage(m.chat, { react: { text: emoji, key: m.key } })

  m.copy = () =>
    exports.sms(conn, M.fromObject(M.toObject(m)))

  m.copyNForward = (jid = m.chat, force = false, options = {}) =>
    conn.copyNForward(jid, m, force, options)

  if (m.msg?.url) {
    m.download = () => conn.downloadMediaMessage(m.msg)
  }

  return m
}

module.exports = { sms, downloadMediaMessage }
