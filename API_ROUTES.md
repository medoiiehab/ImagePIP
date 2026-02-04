# Required API Implementations

This document outlines all the APIs that need to be implemented in your backend to support the Image Pipeline system.

## Authentication APIs

### POST /api/auth/login
**Purpose:** Authenticate users (admin, client, or viewer)

**Request Body:**
```json
{
  "type": "admin|client|viewer",
  "email": "string",              // For admin login
  "password": "string",           // For admin/client login
  "teamUuid": "string",           // For client login (4-digit)
  "userUuid": "string",           // For client login (4-digit)
  "shareLink": "string"           // For viewer login
}
```

**Response:**
```json
{
  "success": boolean,
  "token": "string (JWT)",
  "user": {
    "id": "string",
    "email": "string|null",
    "role": "admin|client|viewer",
    "teamUuid": "string|null",
    "userUuid": "string|null"
  }
}
```

---

### POST /api/auth/logout
**Purpose:** Logout user and invalidate token

**Request:** Authorization header with Bearer token

**Response:**
```json
{
  "success": boolean,
  "message": "string"
}
```

---

### GET /api/auth/verify
**Purpose:** Verify if token is still valid

**Request:** Authorization header with Bearer token

**Response:**
```json
{
  "valid": boolean,
  "user": { ... } // User object if valid
}
```

---

### GET /api/auth/me
**Purpose:** Get current authenticated user details

**Request:** Authorization header with Bearer token

**Response:**
```json
{
  "id": "string",
  "email": "string|null",
  "role": "admin|client|viewer",
  "teamUuid": "string|null",
  "userUuid": "string|null"
}
```

---

## Photo APIs

### GET /api/photos
**Purpose:** List photos with optional filtering (requires auth)

**Query Parameters:**
- `teamId` (optional): Filter by team
- `approved` (optional): "true" | "false"
- `migrated` (optional): "true" | "false"
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 50)

**Response:**
```json
{
  "photos": [
    {
      "id": "string",
      "teamId": "string",
      "userId": "string",
      "fileName": "string",
      "filePath": "string",
      "uploadedAt": "ISO8601 datetime",
      "approved": boolean,
      "approvedAt": "ISO8601 datetime|null",
      "approvedBy": "string|null",
      "migratedToGoogleDrive": boolean,
      "googleDriveId": "string|null",
      "metadata": {
        "size": "number",
        "mimeType": "string",
        "width": "number|null",
        "height": "number|null"
      }
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

---

### POST /api/photos
**Purpose:** Upload a new photo (client only)

**Request:** multipart/form-data
- `file`: Photo file
- `teamId`: Team identifier
- `userId`: User identifier
- `metadata` (optional): JSON string with additional metadata

**Response:**
```json
{
  "success": boolean,
  "photo": { ... }, // Photo object
  "message": "string"
}
```

---

### POST /api/photos/[id]/approve
**Purpose:** Approve a photo for migration (admin only)

**Request:** Authorization header with Bearer token

**Response:**
```json
{
  "success": boolean,
  "photo": { ... }, // Updated photo object
  "message": "string"
}
```

---

### DELETE /api/photos/[id]
**Purpose:** Delete a photo (admin only)

**Request:** Authorization header with Bearer token

**Response:**
```json
{
  "success": boolean,
  "message": "string"
}
```

---

### POST /api/photos/[id]/migrate
**Purpose:** Migrate approved photo to Google Drive (admin/automated)

**Request:** Authorization header with Bearer token

**Response:**
```json
{
  "success": boolean,
  "photo": { ... },
  "googleDriveId": "string",
  "message": "string"
}
```

---

## Teams APIs

### GET /api/teams
**Purpose:** List all teams (admin only)

**Response:**
```json
{
  "teams": [
    {
      "id": "string",
      "uuid": "string (4-digit)",
      "name": "string",
      "schoolId": "string|null",
      "createdBy": "string",
      "memberCount": "number",
      "photoCount": "number",
      "createdAt": "ISO8601 datetime",
      "updatedAt": "ISO8601 datetime"
    }
  ],
  "total": "number"
}
```

---

### POST /api/teams
**Purpose:** Create a new team (admin only)

**Request Body:**
```json
{
  "name": "string",
  "schoolId": "string|null"
}
```

**Response:**
```json
{
  "success": boolean,
  "team": { ... }, // Team object
  "message": "string"
}
```

---

### PUT /api/teams/[id]
**Purpose:** Update team details (admin only)

**Request Body:**
```json
{
  "name": "string|null",
  "schoolId": "string|null"
}
```

**Response:**
```json
{
  "success": boolean,
  "team": { ... },
  "message": "string"
}
```

---

### DELETE /api/teams/[id]
**Purpose:** Delete a team (admin only)

**Response:**
```json
{
  "success": boolean,
  "message": "string"
}
```

---

## Users APIs

### GET /api/users
**Purpose:** List users with optional filtering (admin only)

**Query Parameters:**
- `teamId` (optional): Filter by team
- `role` (optional): Filter by role
- `page` (optional): Page number
- `limit` (optional): Results per page

**Response:**
```json
{
  "users": [
    {
      "id": "string",
      "email": "string",
      "role": "admin|client|viewer",
      "teamUuid": "string|null",
      "userUuid": "string|null",
      "teamId": "string|null",
      "createdAt": "ISO8601 datetime",
      "lastLogin": "ISO8601 datetime|null"
    }
  ],
  "total": "number",
  "page": "number",
  "pageSize": "number"
}
```

---

### POST /api/users
**Purpose:** Create a new user (admin only)

**Request Body:**
```json
{
  "email": "string",
  "role": "admin|client|viewer",
  "teamId": "string|null",
  "password": "string"
}
```

**Response:**
```json
{
  "success": boolean,
  "user": {
    "id": "string",
    "email": "string",
    "role": "string",
    "teamUuid": "string|null",
    "userUuid": "string|null"
  },
  "message": "string"
}
```

---

### PUT /api/users/[id]
**Purpose:** Update user (admin only)

**Request Body:**
```json
{
  "email": "string|null",
  "role": "admin|client|viewer|null",
  "password": "string|null"
}
```

**Response:**
```json
{
  "success": boolean,
  "user": { ... },
  "message": "string"
}
```

---

### DELETE /api/users/[id]
**Purpose:** Delete a user (admin only)

**Response:**
```json
{
  "success": boolean,
  "message": "string"
}
```

---

## Error Handling

All APIs should return error responses in this format:

```json
{
  "error": "string",
  "code": "string",
  "details": "object|null"
}
```

HTTP Status Codes:
- `200`: Success
- `201`: Created
- `400`: Bad Request
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict
- `500`: Internal Server Error

---

## Authentication

All endpoints except `POST /api/auth/login` require authentication:

```
Authorization: Bearer <JWT_TOKEN>
```

Token should contain:
- `id`: User ID
- `role`: User role
- `email`: User email (optional)
- `teamId`: Team ID (optional)
- `teamUuid`: Team UUID 4-digit (optional)
- `userUuid`: User UUID 4-digit (optional)
- `iat`: Issued at timestamp
- `exp`: Expiration timestamp (24 hours)

---

## Demo Credentials

**Admin:**
- Email: `admin@example.com`
- Password: `password123`

**Client:**
- Team UUID: `1001`
- User UUID: `2001`
- Password: `clientpass`
