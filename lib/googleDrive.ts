import { google } from 'googleapis';
import { Readable } from 'stream';

// Initialize Google Auth
const SCOPES = ['https://www.googleapis.com/auth/drive'];

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
        console.log('[Drive Auth] ✅ JWT auth client created');
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
        console.log('\n========== [Drive Upload] Starting file upload ==========');
        console.log('[Drive Upload] File:', fileName, 'Size:', fileBuffer.length, 'bytes');
        console.log('[Drive Upload] MIME Type:', mimeType);
        console.log('[Drive Upload] Target folder ID:', folderId);
        
        const authClient = getAuthClient();
        if (!authClient) {
            console.error('[Drive Upload] ❌ Failed to get auth client');
            return null;
        }
        console.log('[Drive Upload] ✅ Auth client ready');

        // Verify token works for upload too
        try {
            console.log('[Drive Upload] 🔐 Verifying access token...');
            const { token } = await authClient.getAccessToken();
            if (!token) {
                console.error('[Drive Upload] ❌ No access token available for upload');
                return null;
            }
            console.log('[Drive Upload] ✅ Access token verified');
        } catch (tokenErr: any) {
            console.error('[Drive Upload] ❌ Token error:', tokenErr.message);
            return null;
        }

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

        console.log('[Drive Upload] 📤 Uploading to Drive...');

        const response = await drive.files.create({
            requestBody: fileMetadata,
            media: media,
            fields: 'id, webViewLink',
            supportsTeamDrives: true,
        });

        console.log('[Drive Upload] Response status:', response.status);
        console.log('[Drive Upload] Response data:', JSON.stringify(response.data, null, 2));

        if (response.data.id) {
            console.log('[Drive Upload] ✅ File uploaded successfully! ID:', response.data.id);
            return {
                id: response.data.id,
                webViewLink: response.data.webViewLink || '',
            };
        } else {
            console.warn('[Drive Upload] ⚠️ Upload completed but no file ID returned');
            return null;
        }
    } catch (error: any) {
        console.error('\n[Drive Upload] ❌ Upload failed!');
        console.error('[Drive Upload] Error message:', error.message);
        if (error.response?.data) {
            console.error('[Drive Upload] API Error:', JSON.stringify(error.response.data, null, 2));
            console.error('[Drive Upload] Status code:', error.response.status);
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

        // Try to get an access token to verify auth works
        let tokenOk = false;
        try {
            console.log('[Drive Folder] 🔐 Attempting to get access token...');
            const { token } = await authClient.getAccessToken();
            if (token) {
                console.log('[Drive Folder] ✅ Access token obtained successfully');
                console.log('[Drive Folder] Token (first 30 chars):', token.substring(0, 30) + '...');
                tokenOk = true;
            } else {
                console.error('[Drive Folder] ❌ No access token in credentials response');
                return null;
            }
        } catch (tokenErr: any) {
            console.error('[Drive Folder] ❌ Failed to get access token:', tokenErr.message);
            console.error('[Drive Folder] Error code:', tokenErr.code);
            console.error('[Drive Folder] Full error:', JSON.stringify({
                message: tokenErr.message,
                code: tokenErr.code,
                statusCode: tokenErr.statusCode,
                status: tokenErr.status,
            }, null, 2));
            return null;
        }

        if (!tokenOk) {
            console.error('[Drive Folder] ❌ Token verification failed');
            return null;
        }
        console.log('[Drive Folder] ✅ Auth verification complete - proceeding with API calls');

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
            supportsTeamDrives: true,
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
            supportsTeamDrives: true,
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
        console.error('[Drive Folder] Full error:', JSON.stringify(error, null, 2));
        return null;
    }
};
