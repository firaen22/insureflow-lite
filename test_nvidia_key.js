
const validateOpenAIKey = async (apiKey, baseUrl) => {
    const url = baseUrl ? `${baseUrl.replace(/\/$/, '')}/models` : 'https://api.openai.com/v1/models';
    console.log(`Testing URL: ${url}`);
    try {
        const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${apiKey}` }
        });

        if (!response.ok) {
            let errorMsg = response.statusText;
            try {
                const text = await response.text();
                // Try parsing as JSON first
                try {
                    const errorData = JSON.parse(text);
                    errorMsg = errorData.error?.message || errorData.message || text;
                } catch {
                    // If not JSON, use the raw text
                    errorMsg = text || response.statusText;
                }
            } catch (e) {
                // Ignore
            }
            throw new Error(errorMsg || `HTTP Error ${response.status}`);
        }

        const data = await response.json();
        const models = (data.data || []).map((m) => m.id);
        console.log("Success! Models found:", models.length);
        console.log("Sample models:", models.slice(0, 5));
        return models;
    } catch (error) {
        console.error("Validation Error:", error.message);
    }
}

// User provided key
const apiKey = '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';
const baseUrl = 'https://integrate.api.nvidia.com/v1';

console.log("Starting NVIDIA Key Verification...");
validateOpenAIKey(apiKey, baseUrl);
