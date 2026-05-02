require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const port = 8000;

// 中间件
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// 路由
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'vote.html'));
});

app.post('/api/chat', async (req, res) => {
    const { message } = req.body;
    console.log('Received message:', message);

    if (!message) {
        return res.status(400).json({ reply: "消息内容不能为空" });
    }

    try {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        console.log('Using DeepSeek API Key (prefix):', apiKey ? apiKey.substring(0, 8) + '...' : 'MISSING');
        if (!apiKey) {
            return res.status(500).json({ reply: "服务器未配置 DeepSeek API Key，请在 .env 文件中设置 DEEPSEEK_API_KEY" });
        }

        const response = await fetch("https://api.deepseek.com/chat/completions", {
            method: "POST",
            headers: {
                "Authorization": `Bearer ${apiKey}`,
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                model: "deepseek-chat",
                messages: [
                    { role: "system", content: "你是一个贴心的虚拟伴侣。" },
                    { role: "user", content: message }
                ],
                stream: false
            })
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('DeepSeek Error Status:', response.status);
            console.error('DeepSeek Error Body:', errorText);
            return res.status(response.status).json({ reply: `DeepSeek 接口返回错误: ${response.status}` });
        }

        const data = await response.json();
        console.log('DeepSeek Response:', JSON.stringify(data));
        const reply = data.choices?.[0]?.message?.content || "抱歉，我暂时无法回复。";

        res.status(200).json({ reply });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ reply: "调用 DeepSeek 接口时出错，请稍后再试。" });
    }
});

app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/`);
});
