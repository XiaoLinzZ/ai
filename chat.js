module.exports = async (req, res) => {
    if (req.method !== 'POST') {
        return res.status(405).json({ reply: 'Method Not Allowed' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ reply: "消息内容不能为空" });
    }

    try {
        const apiKey = process.env.DEEPSEEK_API_KEY;
        if (!apiKey) {
            return res.status(500).json({ reply: "服务器未配置 DeepSeek API Key" });
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
            console.error('DeepSeek Error:', response.status, errorText);
            return res.status(response.status).json({ reply: `DeepSeek 接口返回错误: ${response.status}` });
        }

        const data = await response.json();
        const reply = data.choices?.[0]?.message?.content || "抱歉，我暂时无法回复。";

        res.status(200).json({ reply });
    } catch (error) {
        console.error('API Error:', error);
        res.status(500).json({ reply: "调用 DeepSeek 接口时出错，请稍后再试。" });
    }
};
