
import { Client, PolicyData, Product } from '../types';

// Environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;

if (!CLIENT_ID || !API_KEY) {
    console.warn("VITE_GOOGLE_CLIENT_ID or VITE_GOOGLE_API_KEY is missing. Google Sheets sync will not work.");
}
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file";

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const getDebugInfo = () => {
    return {
        clientIdPresent: !!CLIENT_ID,
        apiKeyPresent: !!API_KEY,
        clientIdSnippet: CLIENT_ID ? CLIENT_ID.substring(0, 10) + '...' : 'MISSING',
        gapiInited,
        gisInited
    };
}
export const initGoogleClient = async () => {
    return new Promise<boolean>((resolve, reject) => {
        const checkInit = () => {
            if (gapiInited && gisInited) resolve(true);
        }

        // Load GAPI
        const gapiScript = document.createElement('script');
        gapiScript.src = "https://apis.google.com/js/api.js";
        gapiScript.async = true;
        gapiScript.defer = true;
        gapiScript.onload = () => {
            window.gapi.load('client', async () => {
                try {
                    await window.gapi.client.init({
                        apiKey: API_KEY || '',
                        discoveryDocs: [],
                    });

                    try {
                        await window.gapi.client.load('sheets', 'v4');
                        await window.gapi.client.load('drive', 'v3');
                    } catch (loadErr: any) {
                        console.warn("Error loading API specs, but proceeding:", loadErr);
                    }

                    gapiInited = true;
                    checkInit();
                } catch (err: any) {
                    console.error("GAPI Init Error", err);
                    reject(new Error("GAPI Init failed: " + (err.result?.error?.message || err.message || JSON.stringify(err))));
                }
            });
        };
        gapiScript.onerror = () => reject(new Error("Failed to load GAPI script"));
        document.body.appendChild(gapiScript);

        // Load GIS
        const gisScript = document.createElement('script');
        gisScript.src = "https://accounts.google.com/gsi/client";
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
            if (!CLIENT_ID) {
                reject(new Error("Google Client ID is missing"));
                return;
            }
            try {
                tokenClient = window.google.accounts.oauth2.initTokenClient({
                    client_id: CLIENT_ID,
                    scope: SCOPES,
                    callback: (resp: any) => {
                        if (resp.error !== undefined) {
                            console.error("Token Callback Error:", resp);
                        }
                    },
                });
                gisInited = true;
                checkInit();
            } catch (err: any) {
                reject(new Error("GIS Init failed: " + err.message));
            }
        };
        gisScript.onerror = () => reject(new Error("Failed to load GIS script"));
        document.body.appendChild(gisScript);
    });
};

export const signIn = async () => {
    return new Promise<void>((resolve, reject) => {
        if (!tokenClient) {
            reject(new Error("Token Client not initialized. Please refresh the page or check your internet connection."));
            return;
        }

        // Override callback for this specific request to capture when it's done
        tokenClient.callback = (resp: any) => {
            if (resp.error) {
                reject(new Error(JSON.stringify(resp)));
                return;
            }
            // Manually set the token for gapi client
            /* @ts-ignore */
            // Note: gapi.client.setToken implementation might vary in types, preventing TS error with ignore
            if (window.gapi.client) {
                // @ts-ignore
                window.gapi.client.setToken(resp);
            }
            resolve();
        };

        // Request token (triggers popup)
        tokenClient.requestAccessToken({ prompt: 'consent' });
    });
};

export const signOut = async () => {
    const token = window.gapi?.client?.getToken();
    if (token !== null) {
        window.google?.accounts?.oauth2?.revoke(token.access_token, () => { });
        window.gapi?.client?.setToken(null);
    }
};

export const getIsSignedIn = () => {
    // With GIS, we don't have a persistent "signed in" listener like auth2.
    // We check if we have a valid token in gapi client.
    const token = window.gapi?.client?.getToken();
    return !!token && !!token.access_token;
}

export const getUserProfile = async (): Promise<{ name: string, email: string, picture: string }> => {
    const token = window.gapi?.client?.getToken();
    if (!token) throw new Error("Not signed in");

    try {
        const response = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
            headers: {
                'Authorization': `Bearer ${token.access_token}`
            }
        });
        const data = await response.json();
        return {
            name: data.name,
            email: data.email,
            picture: data.picture
        };
    } catch (error) {
        console.error("Error fetching user profile", error);
        throw error;
    }
};

export const listSpreadsheets = async (): Promise<Array<{ id: string, name: string }>> => {
    try {
        const response = await window.gapi.client.drive.files.list({
            q: "mimeType='application/vnd.google-apps.spreadsheet' and trashed=false",
            fields: 'files(id, name)',
            pageSize: 10
        });
        return response.result.files || [];
    } catch (error) {
        console.error("Error listing spreadsheets", error);
        throw error;
    }
};

export const createSpreadsheet = async (title: string): Promise<string> => {
    try {
        if (!window.gapi.client.sheets) {
            throw new Error("Google Sheets API not loaded. Please refresh the page.");
        }
        const response = await window.gapi.client.sheets.spreadsheets.create({
            properties: {
                title: title,
            },
            sheets: [
                { properties: { title: 'Clients' } },
                { properties: { title: 'Policies' } },
                { properties: { title: 'Products' } }
            ]
        });
        const spreadsheetId = response.result.spreadsheetId;

        // Initialize Headers
        await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: [
                    {
                        range: 'Clients!A1:Z1',
                        values: [['ID', 'Name', 'Email', 'Phone', 'Birthday', 'Total Policies', 'Last Contact', 'Status', 'Tags']]
                    },
                    {
                        range: 'Policies!A1:Z1',
                        values: [['ID', 'Policy Number', 'Plan Name', 'Holder Name', 'Client Birthday', 'Type', 'Anniversary', 'Payment Mode', 'Premium', 'Status', 'Tags', 'Riders JSON', 'Extra Data JSON']]
                    },
                    {
                        range: 'Products!A1:Z1',
                        values: [['Name', 'Provider', 'Type', 'Default Tags']]
                    }
                ]
            }
        });

        return spreadsheetId;
    } catch (error) {
        console.error("Error creating spreadsheet", error);
        throw error;
    }
};

export const saveData = async (spreadsheetId: string, clients: Client[], policies: PolicyData[], products: Product[]) => {
    try {
        // Prepare Clients Data
        const clientRows = clients.map(c => [
            c.id, c.name, c.email, c.phone, c.birthday, c.totalPolicies, c.lastContact, c.status, JSON.stringify(c.tags)
        ]);

        // Prepare Policies Data
        const policyRows = policies.map(p => [
            p.id, p.policyNumber, p.planName, p.holderName, p.clientBirthday, p.type,
            p.policyAnniversaryDate, p.paymentMode, p.premiumAmount, p.status,
            JSON.stringify(p.extractedTags || []),
            JSON.stringify(p.riders || []),
            JSON.stringify({
                medicalPlanType: p.medicalPlanType,
                medicalExcess: p.medicalExcess,
                sumInsured: p.sumInsured,
                isMultipay: p.isMultipay,
                policyEndDate: p.policyEndDate,
                capitalInvested: p.capitalInvested,
                accidentMedicalLimit: p.accidentMedicalLimit,
                accidentSectionLimit: p.accidentSectionLimit,
                accidentPhysioVisits: p.accidentPhysioVisits
            })
        ]);

        // Prepare Products Data
        const productRows = products.map(p => [
            p.name, p.provider, p.type, JSON.stringify(p.defaultTags)
        ]);

        // Clear and Write to Sheets
        await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: [
                    { range: 'Clients!A2:Z', values: clientRows },
                    { range: 'Policies!A2:Z', values: policyRows },
                    { range: 'Products!A2:Z', values: productRows }
                ]
            }
        });

    } catch (error: any) {
        // Auto-fix: Create Products sheet if missing
        const msg = error.result?.error?.message || error.message || JSON.stringify(error);
        if (msg.includes("Products") || msg.includes("Unable to parse range")) {
            console.warn("Likely missing 'Products' sheet. Attempting to create it...");
            try {
                await window.gapi.client.sheets.spreadsheets.batchUpdate({
                    spreadsheetId,
                    resource: {
                        requests: [
                            {
                                addSheet: {
                                    properties: { title: 'Products' }
                                }
                            }
                        ]
                    }
                });

                // Initialize Headers for Products
                await window.gapi.client.sheets.spreadsheets.values.update({
                    spreadsheetId,
                    range: 'Products!A1:Z1',
                    valueInputOption: 'RAW',
                    resource: {
                        values: [['Name', 'Provider', 'Type', 'Default Tags']]
                    }
                });

                // Retry Save
                return saveData(spreadsheetId, clients, policies, products);

            } catch (createError) {
                console.error("Failed to auto-create Products sheet", createError);
                throw error; // Throw original error
            }
        }

        console.error("Error saving data", error);
        throw error;
    }
};

export const loadData = async (spreadsheetId: string): Promise<{ clients: Client[], policies: PolicyData[], products: Product[] }> => {
    try {
        const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
            spreadsheetId: spreadsheetId,
            ranges: ['Clients!A2:Z', 'Policies!A2:Z', 'Products!A2:Z']
        });

        const clientRows = response.result.valueRanges?.[0].values || [];
        const policyRows = response.result.valueRanges?.[1].values || [];
        const productRows = response.result.valueRanges?.[2].values || [];

        const clients: Client[] = clientRows.map((row: any) => ({
            id: row[0],
            name: row[1],
            email: row[2],
            phone: row[3],
            birthday: row[4],
            totalPolicies: Number(row[5]),
            lastContact: row[6],
            status: row[7],
            tags: JSON.parse(row[8] || '[]')
        }));

        const policies: PolicyData[] = policyRows.map((row: any) => {
            const extraData = JSON.parse(row[12] || '{}');
            return {
                id: row[0],
                policyNumber: row[1],
                planName: row[2],
                holderName: row[3],
                clientBirthday: row[4],
                type: row[5],
                policyAnniversaryDate: row[6],
                paymentMode: row[7],
                premiumAmount: Number(row[8]),
                status: row[9],
                extractedTags: JSON.parse(row[10] || '[]'),
                riders: JSON.parse(row[11] || '[]'),
                ...extraData
            };
        });

        const products: Product[] = productRows.map((row: any) => ({
            name: row[0],
            provider: row[1],
            type: row[2],
            defaultTags: JSON.parse(row[3] || '[]')
        }));

        return { clients, policies, products };

    } catch (error: any) {
        // Fallback: If "Products" sheet is missing, try loading just Clients and Policies
        const msg = error.result?.error?.message || error.message || JSON.stringify(error);
        if (msg.includes("Products")) {
            console.warn("Products sheet missing, falling back to legacy load.");
            try {
                const response = await window.gapi.client.sheets.spreadsheets.values.batchGet({
                    spreadsheetId: spreadsheetId,
                    ranges: ['Clients!A2:Z', 'Policies!A2:Z']
                });

                const clientRows = response.result.valueRanges?.[0].values || [];
                const policyRows = response.result.valueRanges?.[1].values || [];

                const clients: Client[] = clientRows.map((row: any) => ({
                    id: row[0],
                    name: row[1],
                    email: row[2],
                    phone: row[3],
                    birthday: row[4],
                    totalPolicies: Number(row[5]),
                    lastContact: row[6],
                    status: row[7],
                    tags: JSON.parse(row[8] || '[]')
                }));

                const policies: PolicyData[] = policyRows.map((row: any) => {
                    const extraData = JSON.parse(row[12] || '{}');
                    return {
                        id: row[0],
                        policyNumber: row[1],
                        planName: row[2],
                        holderName: row[3],
                        clientBirthday: row[4],
                        type: row[5],
                        policyAnniversaryDate: row[6],
                        paymentMode: row[7],
                        premiumAmount: Number(row[8]),
                        status: row[9],
                        extractedTags: JSON.parse(row[10] || '[]'),
                        riders: JSON.parse(row[11] || '[]'),
                        ...extraData
                    };
                });

                return { clients, policies, products: [] };
            } catch (retryError) {
                console.error("Retry load failed", retryError);
                throw retryError;
            }
        }

        console.error("Error loading data", error);
        throw error;
    }
};
