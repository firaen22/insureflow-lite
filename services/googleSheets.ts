
import { gapi } from 'gapi-script';

// Environment variables
const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const API_KEY = import.meta.env.VITE_GOOGLE_API_KEY;
const SCOPES = "https://www.googleapis.com/auth/spreadsheets https://www.googleapis.com/auth/drive.readonly https://www.googleapis.com/auth/drive.file";

export interface SheetData {
    clients: ClientRow[];
}

export interface ClientRow {
    name: string;
    email: string;
    phone: string;
    status: string;
    policy: string;
}

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

export const fetchSheetData = async (spreadsheetId: string): Promise<ClientRow[]> => {
    try {
        // 1. Get the sheet name dynamically (don't assume 'Sheet1')
        const meta = await gapi.client.sheets.spreadsheets.get({
            spreadsheetId: spreadsheetId,
            fields: 'sheets.properties.title'
        });

        const sheetName = meta.result.sheets?.[0]?.properties?.title;
        if (!sheetName) {
            throw new Error("No sheets found in the spreadsheet.");
        }

        // 2. Fetch data from that sheet
        const response = await gapi.client.sheets.spreadsheets.values.get({
            spreadsheetId: spreadsheetId,
            range: `${sheetName}!A2:E`, // Use the actual sheet name
        });

        const rows = response.result.values;
        if (!rows || rows.length === 0) {
            return [];
        }

        return rows.map((row: any) => ({
            name: row[0] || '',
            email: row[1] || '',
            phone: row[2] || '',
            status: row[3] || 'New',
            policy: row[4] || 'Pending',
        }));

    } catch (error) {
        console.error("Error fetching sheet data", error);
        throw error;
    }
}
