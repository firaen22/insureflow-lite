
import { Client, PolicyData } from '../types';

// Environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file";

let tokenClient: any;
let gapiInited = false;
let gisInited = false;

export const initGoogleClient = async () => {
    return new Promise<boolean>((resolve) => {
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
                await window.gapi.client.init({
                    apiKey: API_KEY,
                    discoveryDocs: [], // Explicitly load below
                });

                // Explicitly load APIs
                await window.gapi.client.load('sheets', 'v4');
                await window.gapi.client.load('drive', 'v3');

                console.log("GAPI Client loaded", {
                    sheets: !!window.gapi.client.sheets,
                    drive: !!window.gapi.client.drive
                });

                gapiInited = true;
                checkInit();
            });
        };
        document.body.appendChild(gapiScript);

        // Load GIS
        const gisScript = document.createElement('script');
        gisScript.src = "https://accounts.google.com/gsi/client";
        gisScript.async = true;
        gisScript.defer = true;
        gisScript.onload = () => {
            tokenClient = window.google.accounts.oauth2.initTokenClient({
                client_id: CLIENT_ID,
                scope: SCOPES,
                callback: (resp: any) => {
                    if (resp.error !== undefined) {
                        throw (resp);
                    }
                },
            });
            gisInited = true;
            checkInit();
        };
        document.body.appendChild(gisScript);
    });
};

export const signIn = async () => {
    return new Promise<void>((resolve, reject) => {
        if (!tokenClient) {
            reject("Token Client not initialized");
            return;
        }

        // Override callback for this specific request to capture when it's done
        tokenClient.callback = (resp: any) => {
            if (resp.error) {
                reject(resp);
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
        const response = await window.gapi.client.sheets.spreadsheets.create({
            properties: {
                title: title,
            },
            sheets: [
                { properties: { title: 'Clients' } },
                { properties: { title: 'Policies' } }
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

export const saveData = async (spreadsheetId: string, clients: Client[], policies: PolicyData[]) => {
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

        // Clear and Write to Sheets
        // Note: In a real app we might want to be more careful about clearing vs updating
        await window.gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: [
                    { range: 'Clients!A2:Z', values: clientRows },
                    { range: 'Policies!A2:Z', values: policyRows }
                ]
            }
        });

    } catch (error) {
        console.error("Error saving data", error);
        throw error;
    }
};

export const loadData = async (spreadsheetId: string): Promise<{ clients: Client[], policies: PolicyData[] }> => {
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

        return { clients, policies };

    } catch (error) {
        console.error("Error loading data", error);
        throw error;
    }
};
