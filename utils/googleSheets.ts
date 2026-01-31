import { PolicyData, Client } from '../types';

// Declare globals for Google Scripts
declare global {
  interface Window {
    google: any;
    gapi: any;
  }
}

// Configuration - REPLACE THESE WITH YOUR ACTUAL VALUES
// OR ENTER THEM WHEN PROMPTED IN THE APP
export const GOOGLE_CONFIG = {
  CLIENT_ID: '', // e.g., "123456789-abc...apps.googleusercontent.com"
  API_KEY: '',   // e.g., "AIzaSy..."
  SPREADSHEET_ID: '', // From your Google Sheet URL
  SCOPES: 'https://www.googleapis.com/auth/spreadsheets',
  DISCOVERY_DOCS: ['https://sheets.googleapis.com/$discovery/rest?version=v4'],
};

let tokenClient: any;

export const initGoogleClient = async (
  clientId: string, 
  apiKey: string, 
  spreadsheetId: string
): Promise<boolean> => {
  return new Promise((resolve, reject) => {
    // Save to config memory
    GOOGLE_CONFIG.CLIENT_ID = clientId;
    GOOGLE_CONFIG.API_KEY = apiKey;
    GOOGLE_CONFIG.SPREADSHEET_ID = spreadsheetId;

    if (!window.gapi || !window.google) {
      reject('Google Scripts not loaded');
      return;
    }

    window.gapi.load('client', async () => {
      try {
        await window.gapi.client.init({
          apiKey: apiKey,
          discoveryDocs: GOOGLE_CONFIG.DISCOVERY_DOCS,
        });

        tokenClient = window.google.accounts.oauth2.initTokenClient({
          client_id: clientId,
          scope: GOOGLE_CONFIG.SCOPES,
          callback: '', // defined at request time
        });

        resolve(true);
      } catch (err) {
        reject(err);
      }
    });
  });
};

export const signInToGoogle = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    if (!tokenClient) return reject('Token Client not initialized');

    tokenClient.callback = async (resp: any) => {
      if (resp.error !== undefined) {
        reject(resp);
      }
      resolve();
    };

    if (window.gapi.client.getToken() === null) {
      // Prompt the user to select a Google Account and ask for consent to share their data
      // when establishing a new session.
      tokenClient.requestAccessToken({prompt: 'consent'});
    } else {
      // Skip display of account chooser and consent dialog for an existing session.
      tokenClient.requestAccessToken({prompt: ''});
    }
  });
};

// --- DATA MAPPING ---

// Maps a PolicyData object to a Row Array for Google Sheets
const mapPolicyToRow = (p: PolicyData): (string | number)[] => {
  // Order must match the Sheet Columns:
  // ID, PolicyNo, Holder, Plan, Type, Status, Premium, Mode, Anniversary, Birthday, Tags(JSON), Specifics(JSON)
  return [
    p.id,
    p.policyNumber,
    p.holderName,
    p.planName,
    p.type,
    p.status,
    p.premiumAmount,
    p.paymentMode,
    p.policyAnniversaryDate,
    p.clientBirthday || '',
    JSON.stringify(p.extractedTags || []),
    // JSON stringify complex/optional fields to store in one column
    JSON.stringify({
      riders: p.riders,
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
  ];
};

// Maps a Row Array back to PolicyData
const mapRowToPolicy = (row: any[]): PolicyData => {
  // Defensive check for missing columns
  const specifics = row[11] ? JSON.parse(row[11]) : {};
  const tags = row[10] ? JSON.parse(row[10]) : [];

  return {
    id: row[0],
    policyNumber: row[1],
    holderName: row[2],
    planName: row[3],
    type: row[4] as any,
    status: row[5] as any,
    premiumAmount: Number(row[6]),
    paymentMode: row[7] as any,
    policyAnniversaryDate: row[8],
    clientBirthday: row[9],
    extractedTags: tags,
    ...specifics // Spread specific fields and riders back into object
  };
};

// --- API CALLS ---

export const ensureSheetStructure = async (): Promise<void> => {
  if (!GOOGLE_CONFIG.SPREADSHEET_ID) throw new Error("No Spreadsheet ID");

  try {
    // 1. Get Spreadsheet Metadata to check sheets
    const meta = await window.gapi.client.sheets.spreadsheets.get({
      spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID
    });

    const sheets = meta.result.sheets;
    const policySheet = sheets.find((s: any) => s.properties.title === 'Policies');

    if (!policySheet) {
      // 2. Create 'Policies' sheet if missing
      await window.gapi.client.sheets.spreadsheets.batchUpdate({
        spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID,
        resource: {
          requests: [
            { addSheet: { properties: { title: 'Policies' } } }
          ]
        }
      });
      
      // 3. Add Headers
      const headers = ['ID', 'Policy No', 'Holder', 'Plan', 'Type', 'Status', 'Premium', 'Mode', 'Anniversary', 'Birthday', 'Tags', 'Specifics'];
      await window.gapi.client.sheets.spreadsheets.values.update({
        spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID,
        range: 'Policies!A1',
        valueInputOption: 'USER_ENTERED',
        resource: { values: [headers] }
      });
      
      console.log("Created 'Policies' sheet structure.");
    }
  } catch (error) {
    console.error("Error ensuring sheet structure:", error);
    throw error;
  }
};

export const fetchPoliciesFromSheet = async (): Promise<PolicyData[]> => {
  if (!GOOGLE_CONFIG.SPREADSHEET_ID) throw new Error("No Spreadsheet ID");

  try {
    const response = await window.gapi.client.sheets.spreadsheets.values.get({
      spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID,
      range: 'Policies!A2:L', // Assuming headers are in Row 1, Columns A to L
    });

    const rows = response.result.values;
    if (!rows || rows.length === 0) return [];

    return rows.map(mapRowToPolicy);
  } catch (e: any) {
    // If the sheet doesn't exist yet, return empty so we can initialize it later or handle gracefully
    if (e.result?.error?.code === 400 && e.result?.error?.message?.includes('Unable to parse range')) {
        return []; 
    }
    throw e;
  }
};

export const savePolicyToSheet = async (policy: PolicyData): Promise<void> => {
  if (!GOOGLE_CONFIG.SPREADSHEET_ID) throw new Error("No Spreadsheet ID");

  const row = mapPolicyToRow(policy);

  await window.gapi.client.sheets.spreadsheets.values.append({
    spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID,
    range: 'Policies!A:L',
    valueInputOption: 'USER_ENTERED',
    resource: {
      values: [row],
    },
  });
};

export const syncAllPoliciesToSheet = async (policies: PolicyData[]) => {
   // This is a "Resync" - clears sheet and writes all. 
   // CAUTION: In a real app, you'd want to be smarter (update changed rows only).
   if (!GOOGLE_CONFIG.SPREADSHEET_ID) throw new Error("No Spreadsheet ID");

   // 1. Clear Data
   await window.gapi.client.sheets.spreadsheets.values.clear({
      spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID,
      range: 'Policies!A2:L'
   });

   // 2. Write All
   const rows = policies.map(mapPolicyToRow);
   
   if (rows.length > 0) {
     await window.gapi.client.sheets.spreadsheets.values.update({
      spreadsheetId: GOOGLE_CONFIG.SPREADSHEET_ID,
      range: 'Policies!A2',
      valueInputOption: 'USER_ENTERED',
      resource: {
        values: rows,
      },
    });
   }
}
