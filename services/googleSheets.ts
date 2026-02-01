
import { gapi } from 'gapi-script';
import { Client, PolicyData } from '../types';

// Environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file";

export const initGoogleClient = async () => {
    try {
        await new Promise<void>((resolve, reject) => {
            gapi.load('client:auth2', () => {
                gapi.client.init({
                    apiKey: API_KEY,
                    clientId: CLIENT_ID,
                    discoveryDocs: [
                        "https://sheets.googleapis.com/$discovery/rest?version=v4",
                        "https://www.googleapis.com/discovery/v1/apis/drive/v3/rest"
                    ],
                    scope: SCOPES,
                }).then(() => {
                    resolve();
                }).catch((error: any) => {
                    reject(error);
                });
            });
        });
        return true;
    } catch (error) {
        console.error("Error initializing Google Client", error);
        return false;
    }
};

export const signIn = async () => {
    try {
        const authInstance = gapi.auth2.getAuthInstance();
        if (!authInstance.isSignedIn.get()) {
            await authInstance.signIn();
        }
        return authInstance.currentUser.get().getBasicProfile();
    } catch (error) {
        console.error("Error signing in", error);
        throw error;
    }
};

export const signOut = async () => {
    const authInstance = gapi.auth2.getAuthInstance();
    await authInstance.signOut();
};

export const getIsSignedIn = () => {
    const authInstance = gapi.auth2.getAuthInstance();
    return authInstance ? authInstance.isSignedIn.get() : false;
}

export const listSpreadsheets = async (): Promise<Array<{ id: string, name: string }>> => {
    try {
        const response = await gapi.client.drive.files.list({
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
        const response = await gapi.client.sheets.spreadsheets.create({
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
        await gapi.client.sheets.spreadsheets.values.batchUpdate({
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

        // Write to Sheets
        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: [
                    { range: 'Clients!A2:Z', values: clientRows },
                    { range: 'Policies!A2:Z', values: policyRows }
                ]
            }
        });

        // Clear potential leftover rows is hard without knowing length, 
        // but for now we assume overwrite. 
        // A better approach in production is to clear the sheet content first or track length.
        // For 'lite' version, overwriting starting A2 is okay as long as new data >= old data.
        // To be safe, let's clear data first? BatchClear is supported.
        await gapi.client.sheets.spreadsheets.values.batchClear({
            spreadsheetId: spreadsheetId,
            resource: {
                ranges: ['Clients!A2:Z10000', 'Policies!A2:Z10000']
            }
        });

        // Re-write
        await gapi.client.sheets.spreadsheets.values.batchUpdate({
            spreadsheetId: spreadsheetId,
            resource: {
                valueInputOption: 'RAW',
                data: [
                    { range: 'Clients!A2', values: clientRows },
                    { range: 'Policies!A2', values: policyRows }
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
        const response = await gapi.client.sheets.spreadsheets.values.batchGet({
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
