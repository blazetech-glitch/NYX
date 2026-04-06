const { cmd } = require("../command");
const axios = require("axios");

const BASE_API = "https://blaze-dl-api.xibs.space";

function isUrl(input) {
    return typeof input === "string" && /^https?:\/\//i.test(input.trim());
}

function normalizeBlazeTempUrl(tempUrl) {
    if (!tempUrl) return null;
    if (tempUrl.startsWith("http")) return tempUrl;
    if (tempUrl.startsWith("/app/temp/")) {
        return `${BASE_API}/temp/${tempUrl.slice("/app/temp/".length)}`;
    }
    if (tempUrl.startsWith("/temp/")) {
        return `${BASE_API}${tempUrl}`;
    }
    if (tempUrl.startsWith("/")) {
        return `${BASE_API}${tempUrl}`;
    }
    return `${BASE_API}/${tempUrl}`;
}

cmd({
    pattern: "play",
    alias: ["p"],
    react: "🎵",
    desc: "Play song from YouTube search or URL",
    category: "music",
    filename: __filename
}, async (conn, mek, m, { from, q, reply }) => {
    try {
        const input = q ? q.trim() : "";
        if (!input) return reply("❌ Usage: .play <song name or YouTube URL>");

        const query = isUrl(input) ? { url: input } : { q: input };
        const paramName = isUrl(input) ? "URL" : "query";

        await reply(`🔎 Fetching audio for ${paramName}: '${input}'...`);

        const response = await axios.get(`${BASE_API}/api/song`, {
            params: query,
            timeout: 120000
        });

        if (!response?.data) {
            return reply("❌ Error: empty response from Blaze API.");
        }

        const apiResult = response.data;
        if (!apiResult.success) {
            const errorMessage = apiResult.error || "Unknown error from Blaze API.";
            return reply(`❌ Blaze API error: ${errorMessage}`);
        }

        const songData = apiResult.data;
        const tempUrl = songData?.tempDownloadUrl || songData?.tempUrl;
        if (!songData || !tempUrl) {
            return reply("❌ Blaze API did not return an audio file.");
        }

        const audioUrl = normalizeBlazeTempUrl(tempUrl);
        if (!audioUrl) {
            return reply("❌ Unable to build a valid Blaze audio URL.");
        }

        const caption = `🎵 *${songData.title || "Unknown title"}*
👤 *Artist:* ${songData.artist || "Unknown"}
⏱️ *Duration:* ${songData.duration || "Unknown"}`;

        await conn.sendMessage(from, {
            audio: { url: audioUrl },
            mimetype: "audio/mpeg",
            fileName: `${songData.title || "song"}.mp3`
        }, { quoted: mek });

        await reply(caption);
    } catch (error) {
        console.error("Play plugin error:", error);
        const errText = error.response?.data
            ? JSON.stringify(error.response.data, null, 2)
            : error.message;
        await reply(`❌ Play error: ${errText}`);
    }
});