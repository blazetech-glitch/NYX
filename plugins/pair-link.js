const { cmd, commands } = require('../command');

const pairingURL = "https://blsz-5477761157fc.herokuapp.com/";


/* =================================================
   🔥 UNIVERSAL PREVIEW SENDER (works everywhere)
================================================= */
async function sendPreview(conn, from, mek, title, body) {
    return conn.sendMessage(from, {
        text: `🌐 ${pairingURL}`, // backup clickable text
        contextInfo: {
            externalAdReply: {
                title: title,
                body: body,
                sourceUrl: pairingURL,
                mediaType: 1,
                renderLargerThumbnail: true,
                showAdAttribution: false
            }
        }
    }, { quoted: mek });
}



/* =================================================
   🔗 PAIR LINK COMMAND
================================================= */
cmd({
    pattern: "pairlink",
    alias: ["genlink", "paircode", "devicelink"],
    react: "🔗",
    desc: "Get pairing link for connecting new devices",
    category: "tools",
    use: ".pairlink",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    try {

        const message = `╔══════════════════════════════════╗
║    🔗 PAIRING LINK GENERATOR 🔗   ║
╚══════════════════════════════════╝

📱 Steps:
1. Open the site
2. Enter phone number
3. Copy pairing code
4. WhatsApp → Linked Devices
5. Paste code

⏰ Expires in 15 minutes
🔒 Keep private`;

        await reply(message);

        await sendPreview(
            conn,
            from,
            mek,
            "🔗 VISIT PAIRING SERVICE",
            "Tap to generate your WhatsApp pairing code instantly"
        );

    } catch (e) {
        console.error(e);
        reply(pairingURL);
    }
});



/* =================================================
   📱 QR INFO COMMAND
================================================= */
cmd({
    pattern: "pairqr",
    alias: ["qrcode", "scanqr"],
    react: "📱",
    desc: "QR pairing info",
    category: "tools",
    use: ".pairqr",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    const message = `╔════════════════════════════╗
║       📱 QR CODE INFO       ║
╚════════════════════════════╝

QR appears only in terminal.

If not visible, use pairing website instead.`;

    await reply(message);

    await sendPreview(
        conn,
        from,
        mek,
        "📱 USE PAIRING WEBSITE",
        "Open the site and connect easily without QR"
    );
});



/* =================================================
   ⛓️ LINK DEVICE GUIDE
================================================= */
cmd({
    pattern: "linkdevice",
    alias: ["adddevice", "connectdevice"],
    react: "⛓️",
    desc: "Device linking guide",
    category: "tools",
    use: ".linkdevice",
    filename: __filename
}, async (conn, mek, m, { from, reply }) => {

    const guide = `╔═════════════════════════════════╗
║   ⛓️ DEVICE LINKING GUIDE ⛓️    ║
╚═════════════════════════════════╝

How to connect:

• Open pairing site
• Generate code
• WhatsApp → Linked Devices
• Link with phone number
• Paste code

✅ Done in seconds`;

    await reply(guide);

    await sendPreview(
        conn,
        from,
        mek,
        "⚡ QUICK DEVICE LINK",
        "Tap here to connect your device instantly"
    );
});
