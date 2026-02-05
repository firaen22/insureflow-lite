
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { apiKey, baseUrl, body } = req.body;

    if (!apiKey || !body) {
        return res.status(400).json({ error: 'Missing configuration' });
    }

    // Default to OpenAI if no URL provided
    const apiUrl = baseUrl ? `${baseUrl.replace(/\/$/, '')}/chat/completions` : 'https://api.openai.com/v1/chat/completions';

    try {
        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(body)
        });

        if (!response.ok) {
            const errText = await response.text();
            console.error("Upstream API Error:", errText);
            return res.status(response.status).send(errText);
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error: any) {
        console.error("Proxy Error:", error);
        return res.status(500).json({ error: error.message });
    }
}
