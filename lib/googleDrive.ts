import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Auth
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const getAuthClient = () => {
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    // Handle escaped newlines in private key if present
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    if (!clientEmail || !privateKey) {
        console.warn('Google Drive credentials missing. Skipping Drive upload.');
        return null;
    }

    return new google.auth.JWT(
        clientEmail,
        undefined,
        privateKey,
        SCOPES
    );
};

export const uploadToGoogleDrive = async (
    fileBuffer: Buffer,
    fileName: string,
    mimeType: string,
    folderId?: string
): Promise<{ id: string; webViewLink: string } | null> => {
    try {
        const authClient = getAuthClient();
        if (!authClient) return null;

        const drive = google.drive({ version: 'v3', auth: authClient });

        const fileMetadata: any = {
            name: fileName,
        };

        if (folderId) {
            fileMetadata.parents = [folderId];
        }

        // Convert buffer to stream
        const media = {
            mimeType,
            body: Readable.from(fileBuffer),
        };

        console.log(`[Drive] Uploading ${fileName} (${fileBuffer.length} bytes) to folder ${folderId}`);

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
        });

        console.log('[Drive] Upload response:', response.status, response.data);

        if (response.data.id) {
            return {
                id: response.data.id,
                webViewLink: response.data.webViewLink || '',
            };
        }

        return null;
    } catch (error: any) {
        console.error('Error uploading to Google Drive:', error);
        if (error.response) {
            console.error('[Drive API Error Data]:', JSON.stringify(error.response.data, null, 2));
        }
        throw error;
    }
};

export const findOrCreateFolder = async (
    folderName: string,
    parentFolderId?: string
): Promise<string | null> => {
    try {
        const authClient = getAuthClient();
        if (!authClient) return null;

        const drive = google.drive({ version: 'v3', auth: authClient });

        // 1. Search for existing folder
        // Query: name = 'folderName' and mimeType = 'application/vnd.google-apps.folder' and 'parentId' in parents and trashed = false
        let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`;
        if (parentFolderId) {
            query += ` and '${parentFolderId}' in parents`;
        }

        const listRes = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        if (listRes.data.files && listRes.data.files.length > 0) {
            // Folder exists
            return listRes.data.files[0].id || null;
        }

        // 2. Create folder if not found
        const fileMetadata: any = {
            name: folderName,
            mimeType: 'application/vnd.google-apps.folder',
        };

        if (parentFolderId) {
            fileMetadata.parents = [parentFolderId];
        }

        const createRes = await drive.files.create({
            requestBody: fileMetadata,
            fields: 'id',
        });

        return createRes.data.id || null;

    } catch (error) {
        console.error('Error finding/creating Drive folder:', error);
        // Fallback: If we can't create the subfolder, maybe return parentId? 
        // Or just throw/return null to skip organization.
        return null;
    }
};
