const config = require('../config');
const cmd = require('../command');
const axios = require('axios');

const getContextInfo = (title = '', userJid = '', thumbnailUrl = '') => ({
    mentionedJid: [userJid],
    forwardingScore: 999,
    isForwarded: true,
    externalAdReply: {
        showAdAttribution: true,
        title: config.BOT_NAME || 'Media Downloader',
        body: title || "Media Downloader",
        thumbnailUrl: thumbnailUrl || config.MENU_IMAGE_URL || '',
        sourceUrl: 'https://whatsapp.com',
        mediaType: 1,
        renderLargerThumbnail: false
    }
});

// Cinemind API endpoints
const CINEMIND_API = {
    BASE: 'https://api.cinemind.name.ng',
    // YouTube endpoints
    YT_INFO: '/api/yt/info',
    YT_AUDIO: '/api/yt/audio',
    YT_VIDEO: '/api/yt/video',
    YT_SEARCH: '/api/yt/search',
    // Download endpoints from the docs
    DOWNLOAD_AUDIO: '/download-audio',
    DOWNLOAD_VIDEO: '/download-video',
    DOWNLOAD_TIKTOK: '/download-tiktok',
    DOWNLOAD_FB: '/download-fb',
    DOWNLOAD_IG: '/download-ig'
};

// Utility: Try multiple APIs with fallback (including Cinemind as primary)
async function tryMultipleAPIs(apis) {
    for (const api of apis) {
        try {
            console.log(`Trying ${api.type} API: ${api.url}`);
            const response = await axios.get(api.url, { 
                timeout: api.timeout || 30000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
                }
            });
            if (api.validate(response.data)) {
                console.log(`${api.type} API succeeded`);
                return { success: true, data: response.data, type: api.type };
            } else {
                console.log(`${api.type} API validation failed`);
            }
        } catch (err) {
            console.error(`${api.type} API failed:`, err.message);
            continue;
        }
    }
    return { success: false };
}

// Extract YouTube video ID from URL
function extractVideoId(url) {
    const patterns = [
        /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/v\/)([^&?\/\s]{11})/i,
        /youtube\.com\/shorts\/([^&?\/\s]{11})/i
    ];
    
    for (const pattern of patterns) {
        const match = url.match(pattern);
        if (match) return match[1];
    }
    return null;
}

// YouTube Audio Download with Cinemind API
cmd({
    pattern: "play",
    alias: ["song", "audio", "mp3", "ytmp3", "yta"],
    desc: "Download Audio from YouTube",
    category: "download",
    react: "🎵",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("🎵 *Usage:* .play <song name or YouTube URL>\n\nExample: .play Imagine Dragons Believer");
        }

        const query = arg.join(" ");
        let videoUrl, videoTitle, videoThumbnail, videoId;

        // Extract YouTube URL if provided
        if (query.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = query;
            videoId = extractVideoId(videoUrl);
            if (!videoId) {
                return reply("❌ Invalid YouTube URL provided.");
            }
            videoTitle = "YouTube Audio";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            // Search for video using Cinemind API
            await conn.sendMessage(from, {
                text: "🔍 *Searching YouTube...* Please wait",
                contextInfo: getContextInfo("Searching", sender)
            }, { quoted: m });

            try {
                // Primary: Cinemind Search API
                const searchResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: query },
                    timeout: 15000
                });

                if (searchResponse.data && searchResponse.data.status && searchResponse.data.data && searchResponse.data.data.length > 0) {
                    const firstVideo = searchResponse.data.data[0];
                    videoUrl = firstVideo.url;
                    videoTitle = firstVideo.title;
                    videoThumbnail = firstVideo.thumbnail;
                    videoId = extractVideoId(videoUrl);
                } else {
                    // Fallback to Keith API if Cinemind fails
                    const fallbackResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`, {
                        timeout: 15000
                    });
                    
                    if (fallbackResponse.data?.result && fallbackResponse.data.result.length > 0) {
                        const firstVideo = fallbackResponse.data.result[0];
                        videoUrl = firstVideo.url || firstVideo.link;
                        videoTitle = firstVideo.title;
                        videoThumbnail = firstVideo.thumbnail || firstVideo.image;
                        videoId = extractVideoId(videoUrl);
                    } else {
                        return reply("❌ No videos found. Please try a direct YouTube URL.");
                    }
                }
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("❌ Failed to search YouTube. Try providing a direct URL instead.");
            }
        }

        // Download audio using Cinemind API
        await conn.sendMessage(from, {
            text: "⬇️ *Downloading audio...* This may take a moment",
            contextInfo: getContextInfo("Downloading", sender, videoThumbnail)
        }, { quoted: m });

        try {
            // Primary: Cinemind Audio Download API
            const downloadAPIs = [
                {
                    type: 'cinemind',
                    url: `${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_AUDIO}`,
                    params: { url: videoUrl },
                    timeout: 30000,
                    validate: (data) => data && (data.downloadUrl || data.result || data.url)
                },
                {
                    type: 'keith',
                    url: `https://apiskeith.vercel.app/download/audio?url=${encodeURIComponent(videoUrl)}`,
                    timeout: 30000,
                    validate: (data) => data?.result && typeof data.result === 'string'
                },
                {
                    type: 'rest-lily',
                    url: `https://rest-lily.vercel.app/api/download/yta?url=${encodeURIComponent(videoUrl)}`,
                    timeout: 30000,
                    validate: (data) => data?.result && typeof data.result === 'string'
                }
            ];

            let downloadUrl = null;
            
            // Try Cinemind first with POST/GET
            try {
                const cinemindResponse = await axios.get(downloadAPIs[0].url, {
                    params: { url: videoUrl },
                    timeout: 30000
                });
                
                if (cinemindResponse.data) {
                    downloadUrl = cinemindResponse.data.downloadUrl || 
                                cinemindResponse.data.result || 
                                cinemindResponse.data.url;
                }
            } catch (cinemindError) {
                console.log('Cinemind audio download failed, trying fallbacks...');
            }
            
            // If Cinemind failed, try fallback APIs
            if (!downloadUrl) {
                for (let i = 1; i < downloadAPIs.length; i++) {
                    try {
                        const response = await axios.get(downloadAPIs[i].url, { timeout: downloadAPIs[i].timeout });
                        if (downloadAPIs[i].validate(response.data)) {
                            downloadUrl = response.data.result;
                            break;
                        }
                    } catch (err) {
                        console.error(`${downloadAPIs[i].type} failed:`, err.message);
                        continue;
                    }
                }
            }
            
            if (!downloadUrl) {
                return reply("❌ Download failed. The video may be unavailable or too long. Try another video.");
            }

            const fileName = `${videoTitle.replace(/[^\w\s.-]/gi, '')}.mp3`.slice(0, 50);
            const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

            // Send audio
            await conn.sendMessage(from, {
                audio: { url: downloadUrl },
                mimetype: "audio/mpeg",
                fileName: fileName,
                contextInfo: contextInfo
            }, { quoted: m });

        } catch (downloadError) {
            console.error('Download error:', downloadError);
            return reply(`❌ Download failed: ${downloadError.message}`);
        }

    } catch (error) {
        console.error('Audio download error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});

// YouTube Video Download with Cinemind API
cmd({
    pattern: "video",
    alias: ["videodoc", "film", "mp4", "ytmp4", "ytv"],
    desc: "Download Video from YouTube",
    category: "download",
    react: "🎥",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("🎥 *Usage:* .video <video name or YouTube URL>\n\nExample: .video Taylor Swift Anti-Hero");
        }

        const query = arg.join(" ");
        let videoUrl, videoTitle, videoThumbnail, videoId;

        // Extract YouTube URL if provided
        if (query.match(/(youtube\.com|youtu\.be)/i)) {
            videoUrl = query;
            videoId = extractVideoId(videoUrl);
            if (!videoId) {
                return reply("❌ Invalid YouTube URL provided.");
            }
            videoTitle = "YouTube Video";
            videoThumbnail = `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
        } else {
            // Search for video
            await conn.sendMessage(from, {
                text: "🔍 *Searching YouTube...* Please wait",
                contextInfo: getContextInfo("Searching", sender)
            }, { quoted: m });

            try {
                // Primary: Cinemind Search API
                const searchResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                    params: { q: query },
                    timeout: 15000
                });

                if (searchResponse.data && searchResponse.data.status && searchResponse.data.data && searchResponse.data.data.length > 0) {
                    const firstVideo = searchResponse.data.data[0];
                    videoUrl = firstVideo.url;
                    videoTitle = firstVideo.title;
                    videoThumbnail = firstVideo.thumbnail;
                    videoId = extractVideoId(videoUrl);
                } else {
                    // Fallback to Keith API
                    const fallbackResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`, {
                        timeout: 15000
                    });
                    
                    if (fallbackResponse.data?.result && fallbackResponse.data.result.length > 0) {
                        const firstVideo = fallbackResponse.data.result[0];
                        videoUrl = firstVideo.url || firstVideo.link;
                        videoTitle = firstVideo.title;
                        videoThumbnail = firstVideo.thumbnail || firstVideo.image;
                        videoId = extractVideoId(videoUrl);
                    } else {
                        return reply("❌ No videos found. Please try a direct YouTube URL.");
                    }
                }
            } catch (searchError) {
                console.error('YouTube search error:', searchError);
                return reply("❌ Failed to search YouTube.");
            }
        }

        // Download video using Cinemind API
        await conn.sendMessage(from, {
            text: "⬇️ *Downloading video...* This may take a moment",
            contextInfo: getContextInfo("Downloading", sender, videoThumbnail)
        }, { quoted: m });

        try {
            let downloadUrl = null;
            
            // Try Cinemind Video Download API
            try {
                const cinemindResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_VIDEO}`, {
                    params: { url: videoUrl },
                    timeout: 30000
                });
                
                if (cinemindResponse.data) {
                    downloadUrl = cinemindResponse.data.downloadUrl || 
                                cinemindResponse.data.result || 
                                cinemindResponse.data.url;
                }
            } catch (cinemindError) {
                console.log('Cinemind video download failed, trying fallback...');
            }
            
            // Fallback to Keith API if Cinemind fails
            if (!downloadUrl) {
                const fallbackResponse = await axios.get(`https://apiskeith.vercel.app/download/video?url=${encodeURIComponent(videoUrl)}`, {
                    timeout: 30000
                });
                
                if (fallbackResponse.data?.result) {
                    downloadUrl = fallbackResponse.data.result;
                }
            }
            
            if (!downloadUrl) {
                return reply("❌ Download failed. The video may be unavailable. Try another video.");
            }

            const fileName = `${videoTitle.replace(/[^\w\s.-]/gi, '')}.mp4`.slice(0, 50);
            const contextInfo = getContextInfo(videoTitle, sender, videoThumbnail);

            // Send video
            await conn.sendMessage(from, {
                video: { url: downloadUrl },
                mimetype: "video/mp4",
                caption: `🎥 *${videoTitle}*`,
                contextInfo: contextInfo
            }, { quoted: m });

        } catch (downloadError) {
            console.error('Download error:', downloadError);
            return reply(`❌ Download failed: ${downloadError.message}`);
        }

    } catch (error) {
        console.error('Video download error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});

// YouTube Search Command with Cinemind API
cmd({
    pattern: "ytsearch",
    alias: ["youtube", "yt", "yts"],
    desc: "Search YouTube Videos",
    category: "download",
    react: "🔍",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("🔍 *Usage:* .ytsearch <search query>\n\nExample: .ytsearch Imagine Dragons");
        }

        const query = arg.join(" ");

        await conn.sendMessage(from, {
            text: "🔍 *Searching YouTube...*",
            contextInfo: getContextInfo("Searching", sender)
        }, { quoted: m });

        try {
            // Primary: Cinemind Search API
            const searchResponse = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.YT_SEARCH}`, {
                params: { q: query },
                timeout: 15000
            });

            let videos = [];
            
            if (searchResponse.data && searchResponse.data.status && searchResponse.data.data && searchResponse.data.data.length > 0) {
                videos = searchResponse.data.data.slice(0, 5);
            } else {
                // Fallback to Keith API
                const fallbackResponse = await axios.get(`https://apiskeith.vercel.app/search/yts?query=${encodeURIComponent(query)}`, {
                    timeout: 15000
                });
                
                if (fallbackResponse.data?.result && fallbackResponse.data.result.length > 0) {
                    videos = fallbackResponse.data.result.slice(0, 5);
                } else {
                    return reply("❌ No videos found for that search.");
                }
            }

            let message = `🔍 *YouTube Search Results*\n*Query:* ${query}\n\n`;

            videos.forEach((video, index) => {
                message += `${index + 1}. *${video.title || 'Unknown'}*\n`;
                message += `📺 ${video.channel || video.uploader || 'Unknown Channel'}\n`;
                message += `⏱️ ${video.duration || 'N/A'}\n`;
                message += `🔗 ${video.url || video.link}\n\n`;
            });

            message += `\n_Use .play or .video to download_`;

            const thumbnail = videos[0].thumbnail || videos[0].image;
            
            if (thumbnail) {
                await conn.sendMessage(from, {
                    image: { url: thumbnail },
                    caption: message,
                    contextInfo: getContextInfo(`Search: ${query}`, sender, thumbnail)
                }, { quoted: m });
            } else {
                await conn.sendMessage(from, {
                    text: message,
                    contextInfo: getContextInfo(`Search: ${query}`, sender)
                }, { quoted: m });
            }

        } catch (searchError) {
            console.error('YouTube search error:', searchError);
            return reply("❌ Failed to search YouTube.");
        }

    } catch (error) {
        console.error('Search error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});

// TikTok Downloader with Cinemind API
cmd({
    pattern: "tiktok",
    alias: ["tt", "ttdl"],
    desc: "Download TikTok Video",
    category: "download",
    react: "📱",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("📱 *Usage:* .tiktok <TikTok URL>\n\nExample: .tiktok https://www.tiktok.com/@user/video/123456789");
        }

        const url = arg[0];
        
        if (!url.includes('tiktok.com')) {
            return reply("❌ Please provide a valid TikTok URL.");
        }

        await conn.sendMessage(from, {
            text: "⬇️ *Downloading TikTok video...*",
            contextInfo: getContextInfo("Downloading TikTok", sender)
        }, { quoted: m });

        try {
            const response = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_TIKTOK}`, {
                params: { url: url },
                timeout: 30000
            });

            if (response.data && (response.data.downloadUrl || response.data.result)) {
                const downloadUrl = response.data.downloadUrl || response.data.result;
                
                await conn.sendMessage(from, {
                    video: { url: downloadUrl },
                    mimetype: "video/mp4",
                    caption: "📱 *TikTok Video*",
                    contextInfo: getContextInfo("TikTok Download", sender)
                }, { quoted: m });
            } else {
                return reply("❌ Failed to download TikTok video. Please check the URL and try again.");
            }
        } catch (error) {
            console.error('TikTok download error:', error);
            return reply(`❌ Download failed: ${error.message}`);
        }
    } catch (error) {
        console.error('TikTok error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});

// Facebook Downloader with Cinemind API
cmd({
    pattern: "fb",
    alias: ["facebook", "fbdl"],
    desc: "Download Facebook Video",
    category: "download",
    react: "📘",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("📘 *Usage:* .fb <Facebook Video URL>\n\nExample: .fb https://www.facebook.com/watch?v=123456789");
        }

        const url = arg[0];
        
        if (!url.includes('facebook.com') && !url.includes('fb.watch')) {
            return reply("❌ Please provide a valid Facebook video URL.");
        }

        await conn.sendMessage(from, {
            text: "⬇️ *Downloading Facebook video...*",
            contextInfo: getContextInfo("Downloading Facebook", sender)
        }, { quoted: m });

        try {
            const response = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_FB}`, {
                params: { url: url },
                timeout: 30000
            });

            if (response.data && (response.data.downloadUrl || response.data.result)) {
                const downloadUrl = response.data.downloadUrl || response.data.result;
                
                await conn.sendMessage(from, {
                    video: { url: downloadUrl },
                    mimetype: "video/mp4",
                    caption: "📘 *Facebook Video*",
                    contextInfo: getContextInfo("Facebook Download", sender)
                }, { quoted: m });
            } else {
                return reply("❌ Failed to download Facebook video. Please check the URL and try again.");
            }
        } catch (error) {
            console.error('Facebook download error:', error);
            return reply(`❌ Download failed: ${error.message}`);
        }
    } catch (error) {
        console.error('Facebook error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});

// Instagram Downloader with Cinemind API
cmd({
    pattern: "ig",
    alias: ["instagram", "igdl", "insta"],
    desc: "Download Instagram Reel/Video/Image",
    category: "download",
    react: "📸",
    filename: __filename
}, async (conn, m, { from, sender, reply, arg }) => {
    try {
        if (!arg[0]) {
            return reply("📸 *Usage:* .ig <Instagram URL>\n\nExample: .ig https://www.instagram.com/reel/xyz123");
        }

        const url = arg[0];
        
        if (!url.includes('instagram.com')) {
            return reply("❌ Please provide a valid Instagram URL.");
        }

        await conn.sendMessage(from, {
            text: "⬇️ *Downloading Instagram media...*",
            contextInfo: getContextInfo("Downloading Instagram", sender)
        }, { quoted: m });

        try {
            const response = await axios.get(`${CINEMIND_API.BASE}${CINEMIND_API.DOWNLOAD_IG}`, {
                params: { url: url },
                timeout: 30000
            });

            if (response.data && response.data.data) {
                const media = response.data.data;
                
                if (media.type === 'video' && media.url) {
                    await conn.sendMessage(from, {
                        video: { url: media.url },
                        mimetype: "video/mp4",
                        caption: "📸 *Instagram Video*",
                        contextInfo: getContextInfo("Instagram Download", sender)
                    }, { quoted: m });
                } else if (media.type === 'image' && media.url) {
                    await conn.sendMessage(from, {
                        image: { url: media.url },
                        caption: "📸 *Instagram Image*",
                        contextInfo: getContextInfo("Instagram Download", sender)
                    }, { quoted: m });
                } else {
                    return reply("❌ Failed to download Instagram media.");
                }
            } else {
                return reply("❌ Failed to download Instagram media. Please check the URL and try again.");
            }
        } catch (error) {
            console.error('Instagram download error:', error);
            return reply(`❌ Download failed: ${error.message}`);
        }
    } catch (error) {
        console.error('Instagram error:', error);
        reply(`❌ Error: ${error.message}`);
    }
});
