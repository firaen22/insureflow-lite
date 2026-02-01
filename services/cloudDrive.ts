import { gapi } from 'gapi-script';

export const DB_FILENAME = 'insureflow.sqlite'; // The file we look for

// Search for the specific database file
export const findDatabaseFile = async (): Promise<string | null> => {
    try {
        const response = await gapi.client.drive.files.list({
            q: `name = '${DB_FILENAME}' and trashed = false`,
            fields: 'files(id, name, createdTime, modifiedTime)',
            spaces: 'drive'
        });
        const files = response.result.files;
        if (files && files.length > 0) {
            return files[0].id; // Return the first one found
        }
        return null;
    } catch (error) {
        console.error("Error finding database file", error);
        throw error;
    }
};

// Download the file content as Uint8Array (binary)
export const downloadDatabaseFile = async (fileId: string): Promise<Uint8Array> => {
    try {
        // Need to use raw fetch for binary download because gapi doesn't handle binary seamlessly in all versions
        const accessToken = gapi.auth.getToken().access_token;
        const response = await fetch(`https://www.googleapis.com/drive/v3/files/${fileId}?alt=media`, {
            headers: {
                'Authorization': `Bearer ${accessToken}`
            }
        });

        if (!response.ok) throw new Error(`Download failed: ${response.statusText}`);

        const arrayBuffer = await response.arrayBuffer();
        return new Uint8Array(arrayBuffer);
    } catch (error) {
        console.error("Error downloading database file", error);
        throw error;
    }
};

// Upload the file (Create or Update)
// We use multipart upload to send metadata + binary content
export const saveDatabaseFile = async (data: Uint8Array, existingFileId?: string): Promise<string> => {
    try {
        const accessToken = gapi.auth.getToken().access_token;

        const metadata = {
            name: DB_FILENAME,
            mimeType: 'application/x-sqlite3',
            description: 'InsureFlow Private Database File'
        };

        const form = new FormData();
        form.append('metadata', new Blob([JSON.stringify(metadata)], { type: 'application/json' }));
        form.append('file', new Blob([data], { type: 'application/x-sqlite3' }));

        let url = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
        let method = 'POST';

        if (existingFileId) {
            // Update existing file
            url = `https://www.googleapis.com/upload/drive/v3/files/${existingFileId}?uploadType=multipart`;
            method = 'PATCH';
        }

        const response = await fetch(url, {
            method: method,
            headers: {
                'Authorization': `Bearer ${accessToken}`
            },
            body: form
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(`Upload failed: ${err}`);
        }

        const result = await response.json();
        return result.id;
    } catch (error) {
        console.error("Error saving database file", error);
        throw error;
    }
};
