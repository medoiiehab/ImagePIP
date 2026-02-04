# Login System Documentation

## Overview

The Image Pipeline system uses a role-based authentication system with three user types:
1. **Admin** - Full system control
2. **Client** (Team Member) - Photo capture and upload
3. **Viewer** - Read-only access to approved photos

## Login Flow Architecture

### Main Login Page (`/login`)
Central hub for role selection with three options:
- Admin Login
- Team Member Login
- Viewer Access

### Admin Login (`/login/admin`)
**Authentication Method:** Email + Password

**Fields:**
- Email address
- Password

**Success:** Redirects to `/admin/dashboard`

**Features:**
- Email validation
- Password strength checking (min 8 characters)
- Error messages for invalid credentials
- Form validation on client-side
- Server-side validation required

### Client Login (`/login/client`)
**Authentication Method:** 3-Field Login (Unique ID System)

**Fields:**
- **School/Team UUID**: Organizational unit identifier
- **User UUID**: Individual user identifier
- **Password**: User password

**Success:** Redirects to `/client/capture`

**Features:**
- UUID format validation
- Password strength checking
- Real-time field validation
- Clear error messages
- Stored credentials used for photo upload routing

**Why 3-Field System?**
The 3-field login ensures precise data routing:
- Team UUID identifies which photos belong to which organization
- User UUID tracks individual photographer
- Combination prevents accidental data mixing between teams

### Viewer Access (`/login/viewer`)
**Authentication Method:** Google Drive Sharing Link

**Fields:**
- Google Drive folder sharing link

**Success:** Redirects to `/viewer/gallery`

**Features:**
- URL validation for sharing links
- No user account creation needed
- Instant read-only access
- Link-based permissions

## Components Used

### AdminLoginForm
Located: `@/components/auth/AdminLoginForm`
```tsx
<AdminLoginForm onLoginSuccess={() => {}} />
```
- Email & password fields
- Form validation
- API integration ready
- Error handling

### ClientLoginForm
Located: `@/components/auth/ClientLoginForm`
```tsx
<ClientLoginForm onLoginSuccess={() => {}} />
```
- 3-field login form
- UUID validation
- Password validation
- Team/User tracking

### Custom Login Form
Viewer login uses custom form for share link input.

## Authentication Flow

### 1. Initial Page Load
```javascript
useEffect(() => {
  const userRole = localStorage.getItem('userRole');
  if (userRole) {
    // Redirect to appropriate dashboard
  }
}, [router]);
```

### 2. Form Submission
```javascript
const response = await fetch('/api/auth/login', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ type: 'admin|client', ...credentials })
});
```

### 3. Storage & Redirect
```javascript
localStorage.setItem('authToken', token);
localStorage.setItem('userRole', role);
// Additional role-specific data
router.push(redirectUrl);
```

### 4. Protected Routes
All authenticated pages check:
```javascript
const userRole = localStorage.getItem('userRole');
if (userRole !== 'expected_role') {
  router.push('/login');
}
```

## Required API Endpoints

### Authentication Endpoint
**POST `/api/auth/login`**

**Request:**
```json
{
  "type": "admin" | "client" | "viewer",
  // Admin
  "email": "admin@example.com",
  "password": "password123",
  
  // Client
  "teamUuid": "550e8400-e29b-41d4-a716-446655440000",
  "userUuid": "550e8400-e29b-41d4-a716-446655440001",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "token": "jwt_token_here",
  "user": {
    "id": "user-id",
    "role": "admin" | "client" | "viewer",
    "email": "user@example.com"
  }
}
```

## Storage Schema

### localStorage Keys
- `authToken` - JWT token for API authentication
- `userRole` - User role (admin, client, viewer)
- `userEmail` - User email (admin only)
- `teamUuid` - Team identifier (client only)
- `userUuid` - User identifier (client only)
- `viewerShareLink` - Google Drive link (viewer only)

## Security Considerations

### ✅ Implemented
- Client-side form validation
- Password minimum length requirement (8 chars)
- UUID format validation
- Token storage in localStorage
- Role-based access control checks
- Logout functionality clears storage

### ⚠️ Server-Side (Must Implement)
- Password hashing (bcrypt/argon2)
- JWT token generation & validation
- Rate limiting on login attempts
- HTTPS/TLS for all requests
- CORS configuration
- Password reset functionality
- Session timeout handling
- 2FA/MFA support (optional)
- Account lockout after failed attempts
- Email verification for admin accounts

### 🔐 Best Practices
- Never store sensitive data in localStorage (currently storing token - migrate to httpOnly cookies)
- Implement refresh token rotation
- Use strong password policies
- Implement account recovery mechanisms
- Log authentication attempts
- Monitor for suspicious activity

## Error Handling

### Admin Login Errors
- Invalid email format
- Password too short
- Credentials not found
- Account disabled
- Server errors

### Client Login Errors
- Invalid UUID format
- Team UUID not found
- User UUID not found
- Incorrect password
- Team/User mismatch
- Account disabled

### Viewer Access Errors
- Invalid URL format
- Folder not shared
- Folder not found
- Access denied

## Styling

### Login Page Theme
- Gradient background (667eea to 764ba2)
- White cards with shadows
- Rounded corners (12-16px)
- Smooth animations (float effect)
- Responsive grid layout

### Form Styling
- Clear input fields with focus states
- Error states with red borders
- Disabled states with reduced opacity
- Icon indicators for each role
- Back link for navigation

## Responsive Design

### Desktop (>768px)
- Side-by-side layout where applicable
- Full-sized forms
- Hover animations

### Tablet (481-768px)
- Stacked layout
- Optimized touch targets
- Adjusted font sizes

### Mobile (<480px)
- Full-width forms
- Large touch-friendly buttons
- Single column layout
- Minimized padding

## File Structure

```
/app/login/
  ├── page.tsx                 # Role selection page
  ├── layout.tsx              # Login layout wrapper
  ├── login.css               # All login styling
  ├── admin/
  │   └── page.tsx           # Admin login form
  ├── client/
  │   └── page.tsx           # Client login form
  └── viewer/
      └── page.tsx           # Viewer sharing link
```

## Usage Examples

### Checking Authentication
```javascript
const userRole = localStorage.getItem('userRole');
const isAdmin = userRole === 'admin';
const isClient = userRole === 'client';
const isViewer = userRole === 'viewer';
```

### Logging Out
```javascript
const handleLogout = () => {
  localStorage.removeItem('authToken');
  localStorage.removeItem('userRole');
  localStorage.removeItem('userEmail');
  localStorage.removeItem('teamUuid');
  localStorage.removeItem('userUuid');
  localStorage.removeItem('viewerShareLink');
  router.push('/login');
};
```

### Getting User Context
```javascript
const userRole = localStorage.getItem('userRole');
const userEmail = localStorage.getItem('userEmail');
const teamUuid = localStorage.getItem('teamUuid');
const userUuid = localStorage.getItem('userUuid');
```

## Future Enhancements

1. **OAuth Integration** - Google, Microsoft, SSO
2. **Two-Factor Authentication** - SMS, Email, Authenticator
3. **Social Login** - Facebook, GitHub
4. **Password Reset** - Email-based recovery
5. **Account Recovery** - Backup codes, security questions
6. **Session Management** - Multiple device sessions
7. **Activity Logs** - Track login history
8. **IP Whitelisting** - Restrict by network
9. **API Key Authentication** - For integrations
10. **Passwordless** - Magic links, biometric

## Testing Checklist

- [ ] Admin login with valid credentials
- [ ] Admin login with invalid email
- [ ] Admin login with weak password
- [ ] Client login with valid credentials
- [ ] Client login with invalid UUIDs
- [ ] Client login with mismatched credentials
- [ ] Viewer access with valid share link
- [ ] Viewer access with invalid link
- [ ] Logout clears all storage
- [ ] Protected pages redirect to login
- [ ] Already logged in users skip login
- [ ] Form validation messages display
- [ ] Responsive design on mobile/tablet
- [ ] Error messages are helpful
- [ ] Loading states work correctly
