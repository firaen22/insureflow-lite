
import { PolicyData } from '../types';

// Helper to get selected provider from storage
const getProviderConfig = () => {
    return {
        provider: localStorage.getItem('ai_provider') || 'gemini',
        baseUrl: localStorage.getItem('ai_base_url') || '',
        apiKey: localStorage.getItem('gemini_api_key') || '',
        model: localStorage.getItem('gemini_model_id') || 'gemini-1.5-flash'
    };
};

const PROMPT_TEXT = `
You are an expert insurance policy analyzer. 
Analyze the attached image/document and extract the following details into a valid JSON object.
Do NOT wrap the JSON in markdown code blocks (like \`\`\`json). Return ONLY the raw JSON string.

Fields to extract:
- planName (string): The name of the insurance plan.
- policyNumber (string): The policy ID/Number.
- holderName (string): The name of the policyholder.
- premiumAmount (number): Annual premium amount (remove currency symbols).
- policyAnniversaryDate (string): Format DD/MM (e.g., "01/01").
- type (string): One of "Life", "Medical", "Savings", "Critical Illness", "Accident". Infer from content.
- extractedTags (array of strings): Keywords like "High Value", "Term", "VHIS", etc.
- clientBirthday (string): Format YYYY-MM-DD (e.g., "1990-01-01").
- paymentMode (string): "Yearly" or "Monthly".
- riders (array of objects): Extract any rider/supplementary benefits. Each object should have:
    - name (string): Name of the rider.
    - type (string): "Medical", "Accident", "Critical Illness", "Waiver", "Other".
    - premiumAmount (number): Premium for this specific rider (if listed separately).
- cashValue (number): Guaranteed Cash Value from the latest statement.
- accumulatedDividend (number): Accumulated Dividends/Interest/Coupons.
- totalCashValue (number): Total Surrender Value / Cash Value (Sum of guaranteed + non-guaranteed).

If a field is not found, use null or a reasonable guess based on context. 
Support Traditional Chinese and English documents.
`;

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

// --- Gemini Implementation ---

const getGeminiUrl = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

const validateGeminiKey = async (apiKey: string): Promise<string[]> => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        return (data.models || [])
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
    } catch (error) {
        throw error;
    }
};

// --- OpenAI/Kimi Implementation ---

const validateOpenAIKey = async (apiKey: string, baseUrl: string): Promise<string[]> => {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/models` : 'https://api.openai.com/v1/models';
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });
        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        return (data.data || []).map((m: any) => m.id);
    } catch (error) {
        throw error;
    }
}

// --- Main Exports ---

export const validateAIKey = async (provider: string, apiKey: string, baseUrl?: string): Promise<string[]> => {
    if (provider === 'gemini') {
        return validateGeminiKey(apiKey);
    } else {
        // OpenAI, Kimi, NVIDIA all share this interface
        let defaultUrl = 'https://api.openai.com/v1';
        if (provider === 'kimi') defaultUrl = 'https://api.moonshot.cn/v1';
        if (provider === 'nvidia') defaultUrl = 'https://integrate.api.nvidia.com/v1';

        return validateOpenAIKey(apiKey, baseUrl || defaultUrl);
    }
};

export const analyzePolicyImage = async (file: File, apiKey: string): Promise<Partial<PolicyData>> => {
    const config = getProviderConfig();
    const provider = config.provider;
    const model = config.model;

    if (provider === 'gemini') {
        return analyzeWithGemini(file, apiKey, model);
    } else {
        // Kimi, OpenAI, NVIDIA
        let defaultUrl = 'https://api.openai.com/v1';
        if (provider === 'kimi') defaultUrl = 'https://api.moonshot.cn/v1';
        if (provider === 'nvidia') defaultUrl = 'https://integrate.api.nvidia.com/v1';

        return analyzeWithOpenAICompatible(file, apiKey, model, config.baseUrl || defaultUrl);
    }
};

const analyzeWithGemini = async (file: File, apiKey: string, model: string): Promise<Partial<PolicyData>> => {
    const base64Data = await fileToGenerativePart(file);

    const payload = {
        contents: [{
            parts: [
                { text: PROMPT_TEXT },
                { inline_data: { mime_type: file.type, data: base64Data } }
            ]
        }]
    };

    let attempts = 0;
    while (attempts < 3) {
        try {
            const response = await fetch(`${getGeminiUrl(model)}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.status === 429) {
                attempts++;
                await delay(2000 * Math.pow(2, attempts));
                continue;
            }

            if (!response.ok) throw new Error(`Gemini Error: ${response.statusText}`);

            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;
            if (!textResponse) throw new Error("No response from AI");

            return JSON.parse(textResponse.replace(/```json/g, '').replace(/```/g, '').trim());
        } catch (e) {
            if (attempts === 2) throw e;
            attempts++;
        }
    }
    throw new Error("Failed after retries");
};

const analyzeWithOpenAICompatible = async (file: File, apiKey: string, model: string, baseUrl: string): Promise<Partial<PolicyData>> => {
    const base64Data = await fileToGenerativePart(file);
    const dataUrl = `data:${file.type};base64,${base64Data}`;

    // Note: Kimi / Moonshot currently supports file upload via specialized API for long-context, 
    // but standard OpenAI-compatible 'vision' endpoints usually expect image_url.
    // If Kimi doesn't support 'gpt-4-vision' style payloads, this might need specific file upload handling.
    // Assuming standard OpenAI Vision compatibility for simplicity here.

    const payload = {
        model: model,
        messages: [
            {
                role: "user",
                content: [
                    { type: "text", text: PROMPT_TEXT },
                    { type: "image_url", image_url: { url: dataUrl } }
                ]
            }
        ],
        max_tokens: 4096
    };

    const url = `${baseUrl.replace(/\/$/, '')}/chat/completions`;

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${apiKey}`
            },
            body: JSON.stringify(payload)
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`AI Provider Error: ${err}`);
        }

        const result = await response.json();
        const content = result.choices?.[0]?.message?.content;
        if (!content) throw new Error("No content received");

        return JSON.parse(content.replace(/```json/g, '').replace(/```/g, '').trim());
    } catch (e) {
        console.error("OpenAI/Kimi Analysis Failed", e);
        throw e;
    }
}

const fileToGenerativePart = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
