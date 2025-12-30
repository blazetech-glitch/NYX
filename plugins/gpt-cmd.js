const { cmd } = require('../command');
const axios = require('axios');

cmd({ pattern: 'gpt', desc: 'Ask GPT (search-like)', category: 'ai', react: '🧠', filename: __filename },
    async (conn, mek, m, { q, reply, react }) => {
        try {
            if (!q) return reply('Usage: .gpt <query>');
            // prefer the OpenAI proxy if available
            const api1 = `https://vapis.my.id/api/openai?q=${encodeURIComponent(q)}`;
            const api2 = `https://lance-frank-asta.onrender.com/api/gpt?q=${encodeURIComponent(q)}`;
            let data = null;
            try { data = (await axios.get(api1, { timeout: 15000 })).data } catch (e) { }
            if (!data || !data.result) {
                try { data = (await axios.get(api2, { timeout: 15000 })).data } catch (e) { }
            }

            const res = data && (data.result || data.message || data.answer) ? (data.result || data.message || data.answer) : null;
            if (!res) { await react('❌'); return reply('GPT did not return a response.'); }
            await reply(`🧠 GPT Response:\n${res}`);
            await react('✅');
        } catch (e) { console.error('GPT cmd error', e); await react('❌'); reply('Error contacting GPT'); }
    });
