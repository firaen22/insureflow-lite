
import { PolicyData } from '../types';

const getGeminiUrl = (model: string) => `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent`;

export const validateGeminiKey = async (apiKey: string): Promise<string[]> => {
    try {
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
        if (!response.ok) throw new Error(response.statusText);

        const data = await response.json();
        const models = data.models || [];

        // Filter for models that support generateContent
        return models
            .filter((m: any) => m.supportedGenerationMethods?.includes('generateContent'))
            .map((m: any) => m.name.replace('models/', ''));
    } catch (error) {
        console.error("Validation failed", error);
        throw error;
    }
};

export const analyzePolicyImage = async (file: File, apiKey: string): Promise<Partial<PolicyData>> => {
    const selectedModel = localStorage.getItem('gemini_model_id') || 'gemini-1.5-flash';

    return new Promise(async (resolve, reject) => {
        try {
            const base64Data = await fileToGenerativePart(file);

            const prompt = `
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

        If a field is not found, use null or a reasonable guess based on context. 
        Support Traditional Chinese and English documents.
      `;

            const payload = {
                contents: [{
                    parts: [
                        { text: prompt },
                        { inline_data: { mime_type: file.type, data: base64Data } }
                    ]
                }]
            };

            const response = await fetch(`${getGeminiUrl(selectedModel)}?key=${apiKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (!response.ok) {
                const errorBody = await response.text();
                let errorMessage = response.statusText;
                try {
                    const errorJson = JSON.parse(errorBody);
                    errorMessage = errorJson.error?.message || errorBody;
                } catch {
                    errorMessage = errorBody;
                }
                throw new Error(`Gemini API Error (${response.status}): ${errorMessage}`);
            }

            const result = await response.json();
            const textResponse = result.candidates?.[0]?.content?.parts?.[0]?.text;

            if (!textResponse) {
                throw new Error("No response from AI");
            }

            // Clean cleanup markdown if present (just in case)
            const cleanJson = textResponse.replace(/```json/g, '').replace(/```/g, '').trim();
            const data = JSON.parse(cleanJson);

            resolve(data);

        } catch (error) {
            console.error("Gemini Analysis Failed:", error);
            reject(error);
        }
    });
};

const fileToGenerativePart = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onloadend = () => {
            const result = reader.result as string;
            // Remove data URL prefix (e.g., "data:image/jpeg;base64,")
            const base64 = result.split(',')[1];
            resolve(base64);
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
};
