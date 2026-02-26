import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Auth
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];

const getAuthClient = () => {
    console.log('\n========== [Drive Auth] Starting initialization ==========');
    const clientEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
    const privateKey = process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n');

    console.log('[Drive Auth] Email configured:', !!clientEmail, clientEmail ? '✓' : '✗');
    console.log('[Drive Auth] Private key configured:', !!privateKey, privateKey ? '✓' : '✗');
    
    if (!clientEmail || !privateKey) {
        console.error('[Drive Auth] ❌ Missing credentials!');
        if (!clientEmail) console.error('  - GOOGLE_SERVICE_ACCOUNT_EMAIL is missing');
        if (!privateKey) console.error('  - GOOGLE_PRIVATE_KEY is missing');
        return null;
    }

    try {
        console.log('[Drive Auth] Creating JWT auth client for:', clientEmail);
        const authClient = new google.auth.JWT(
            clientEmail,
            undefined,
            privateKey,
            SCOPES
        );
        console.log('[Drive Auth] ✅ JWT auth client created successfully\n');
        return authClient;
    } catch (err: any) {
        console.error('[Drive Auth] ❌ Failed to create JWT:', err.message);
        return null;
    }
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
            console.error('[Drive API Error Status]:', error.response.status);
        }
        if (error.message) {
            console.error('[Drive Error Message]:', error.message);
        }
        throw error;
    }
};

export const findOrCreateFolder = async (
    folderName: string,
    parentFolderId?: string
): Promise<string | null> => {
    console.log('\n========== [Drive Folder] Starting folder operation ==========');
    console.log('[Drive Folder] Folder name:', folderName);
    console.log('[Drive Folder] Parent folder ID:', parentFolderId);
    
    try {
        const authClient = getAuthClient();
        if (!authClient) {
            console.error('[Drive Folder] ❌ No auth client available');
            return null;
        }
        console.log('[Drive Folder] Auth client ready');

        const drive = google.drive({ version: 'v3', auth: authClient });

        // 1. Search for existing folder
        let query = `mimeType='application/vnd.google-apps.folder' and name='${folderName.replace(/'/g, "\\'")}' and trashed=false`;
        if (parentFolderId) {
            query += ` and '${parentFolderId}' in parents`;
        }

        console.log('[Drive Folder] 🔍 Searching for existing folder...');
        const listRes = await drive.files.list({
            q: query,
            fields: 'files(id, name)',
            spaces: 'drive',
        });

        console.log('[Drive Folder] Search result: ', listRes.data.files?.length || 0, 'folders found');

        if (listRes.data.files && listRes.data.files.length > 0) {
            console.log('[Drive Folder] ✅ Folder already exists! ID:', listRes.data.files[0].id);
            return listRes.data.files[0].id || null;
        }

        // 2. Create folder if not found
        console.log('[Drive Folder] 📁 Creating new folder:', folderName);
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

        if (createRes.data.id) {
            console.log('[Drive Folder] ✅ Folder created! ID:', createRes.data.id);
            return createRes.data.id;
        } else {
            console.warn('[Drive Folder] ⚠️ Folder created but no ID returned');
            return null;
        }

    } catch (error: any) {
        console.error('[Drive Folder] ❌ Error:', error.message);
        if (error.response?.data) {
            console.error('[Drive Folder] API Error Details:', JSON.stringify(error.response.data, null, 2));
        }
        return null;
    }
};
