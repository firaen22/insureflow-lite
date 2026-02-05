
import type { VercelRequest, VercelResponse } from '@vercel/node';

export default async function handler(req: VercelRequest, res: VercelResponse) {
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { apiKey, baseUrl } = req.body;

    if (!apiKey) {
        return res.status(400).json({ error: 'Missing API Key' });
    }

    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/models` : 'https://api.openai.com/v1/models';

    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const text = await response.text();
                try {
                    const errorData = JSON.parse(text);
                    errorMsg = errorData.error?.message || errorData.message || text;
                } catch {
                    errorMsg = text || response.statusText;
                }
            } catch (e) {
                // Ignore
            }
            return res.status(response.status).json({ error: errorMsg });
        }

        const data = await response.json();
        return res.status(200).json(data);

    } catch (error: any) {
        return res.status(500).json({ error: error.message });
    }
}
