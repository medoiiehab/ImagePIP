# Google Drive Integration Debugging Guide

## Issue Summary
Photos are not being created in the shared Google Drive folder after approval.

## Root Causes to Check

### 1. **Service Account Permission** ⚠️ MOST LIKELY
The service account `imagepip@imagepip.iam.gserviceaccount.com` needs explicit share permissions on your root folder.

**How to Fix:**
1. Open your root Drive folder: https://drive.google.com/drive/folders/0ACyE3mJwQ1bWUk9PVA
2. Click the **Share** button (top right)
3. Add user/collaborator: `imagepip@imagepip.iam.gserviceaccount.com`
4. Set role to **Editor** (not Viewer or Commenter)
5. Click **Share**

⚠️ **CRITICAL**: Without explicit share permissions, the service account cannot:
- View the folder
- Create subfolders
- Upload files to it

### 2. **Verify Folder ID is Correct**
Check that `GOOGLE_DRIVE_FOLDER_ID` in `.env.local` matches your actual folder:
```
GOOGLE_DRIVE_FOLDER_ID=0ACyE3mJwQ1bWUk9PVA
```

To find correct ID:
- Open the folder in Google Drive
- Copy from URL: `https://drive.google.com/drive/folders/[ID_HERE]`

### 3. **Check Service Account Credentials**
Verify in `.env.local`:
```dotenv
GOOGLE_SERVICE_ACCOUNT_EMAIL=imagepip@imagepip.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY=-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n
```

The private key must:
- Start and end with `-----BEGIN/END PRIVATE KEY-----`
- Have proper newline escaping (`\n`)
- Be valid for the service account

### 4. **Check API Scope**
Current scope in `lib/googleDrive.ts`:
```typescript
const SCOPES = ['https://www.googleapis.com/auth/drive.file'];
```

This scope allows:
- ✅ Upload files to shared folders (if permissions granted)
- ✅ Create subfolders (if permissions granted)
- ❌ Access files NOT shared with the service account

If you get permission errors, you may need to upgrade to:
```typescript
const SCOPES = ['https://www.googleapis.com/auth/drive'];
```

**Note**: `drive` scope is more permissive but requires more careful permission management.

---

## Debugging Steps

### Step 1: Enable Detailed Logging
Enhanced logging has been added to track the approval flow:

1. Go to admin panel → Photo Management
2. Try to approve a photo
3. Check your server logs for messages like:
   ```
   [Drive Auth] Initializing JWT with service account: imagepip@imagepip.iam.gserviceaccount.com
   [Approve] Root Folder ID from env: 0ACyE3mJwQ1bWUk9PVA
   [Approve] Creating/finding school subfolder: [SchoolName] in parent: 0ACyE3mJwQ1bWUk9PVA
   [Approve] Uploading file to Drive...
   [Drive] Upload response: 200
   ```

### Step 2: Check Response Details
The API response now includes detailed error information:
```json
{
  "driveStatus": "failed",
  "driveError": "Error message from API",
  "message": "Photo approved but Drive upload failed: ..."
}
```

Check browser console (F12) → Network tab → approval request response for detailed errors.

### Step 3: Common Error Messages & Fixes

| Error | Cause | Fix |
|-------|-------|-----|
| `permission denied` | Service account not shared | Add to folder share (Step 1 above) |
| `notFound` | Folder ID doesn't exist | Verify correct folder ID |
| `invalid_grant` | Private key is invalid | Check .env.local private key format |
| `dailyLimitExceeded` | API quota hit | Check Google Cloud quotas |
| `insufficientFilePermissions` | Shared with wrong role | Change share to **Editor** |

### Step 4: Verify Folder Access with Google API
Use this test to verify the service account can access your folder:

1. Go to Google Cloud Console
2. Open "Cloud Shell" (terminal icon, top right)
3. Run:
```bash
gcloud auth activate-service-account --key-file=YOUR_SERVICE_KEY.json
gcloud drive files list --q "trashed=false" --limit=1
```

If you get results, service account has API access.

---

## Configuration Checklist

- [ ] Service account email shared in folder (Editor role)
- [ ] `GOOGLE_DRIVE_FOLDER_ID` set correctly in `.env.local`
- [ ] `GOOGLE_SERVICE_ACCOUNT_EMAIL` matches the shared email
- [ ] `GOOGLE_PRIVATE_KEY` is properly formatted with escaped newlines
- [ ] Private key corresponds to the service account email
- [ ] Google Drive API is enabled in Google Cloud Project
- [ ] Check server logs during approval process
- [ ] Folder exists (not deleted and is accessible)

---

## Testing Flow

1. **Admin Login** → Navigate to Photo Management
2. **Approve a Photo** → Check response in Network tab (F12)
3. **Check Server Logs** → Look for Drive-related messages
4. **Check Google Drive** → Folder should contain newly created folders/files:
   ```
   0ACyE3mJwQ1bWUk9PVA (root)
   └── SchoolName (subfolder created)
       └── photo_filename.jpg (uploaded file)
   ```

---

## If Issue Persists

1. **Verify in Google Drive directly**:
   - Can you open the folder?
   - Can you manually upload files to it?
   - Do you see the service account in Share settings?

2. **Check Google Cloud Project**:
   - Go to Cloud Console → Drive API
   - Ensure it's "Enabled"
   - Check quotas and usage

3. **Review Error Response**:
   - The enhanced error messages now show exact API error
   - Include this error when seeking support

4. **Fallback**: If Drive integration fails, photos still get approved in the database.
   The `migrated_to_google_drive` flag will be `false` if upload fails.

---

## Environment Variables Reference

```dotenv
# Required for Drive uploads
GOOGLE_SERVICE_ACCOUNT_EMAIL=imagepip@imagepip.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----\n"
GOOGLE_DRIVE_FOLDER_ID=0ACyE3mJwQ1bWUk9PVA

# Optional (not used for service account auth)
GOOGLE_DRIVE_API_KEY=...
NEXT_PUBLIC_GOOGLE_CLIENT_ID=...
```

