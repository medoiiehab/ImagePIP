# Admin Dashboard Documentation

## Overview

The Admin Dashboard provides comprehensive management capabilities for the Image Pipeline system. Admins can manage photos, teams, users, and system settings.

## Dashboard Features

### 1. **Dashboard Home** (`/admin/dashboard`)
Main entry point with system statistics and overview:
- **Total Photos**: All photos in the system
- **Pending Photos**: Awaiting approval
- **Approved Photos**: Approved but not migrated
- **Migrated Photos**: Successfully moved to Google Drive
- **Teams**: Total number of teams
- **Users**: Total number of users
- **Storage Usage**: Current storage in MB

- **School Filtering**: Toggle between different schools/campuses to see specific sets of data.

Recent photos grid showing latest uploads, filtered by selected school.

### 2. **Photo Management** (`/admin/photos`)
Comprehensive photo management interface:
- **Pending Photos Section**: Shows all unapproved photos
  - Approve individual or bulk approve
  - Delete/reject photos
  - View photo metadata
  - **School-based filtering**: Quickly toggle between different campuses
  - Sort and filter options

- **Approved Photos Section**: Shows approved photos
  - Delete capability
  - View migration status
  - Metadata and approval details

**Features:**
- Grid view with thumbnail previews
- Bulk selection and actions
- Status badges (Pending, Approved, Migrated)
- Sort by date or status
- Photo details modal with file info

### 3. **Team Management** (`/admin/teams`)
Manage schools and teams:
- **Create Teams**: Add new teams with name and optional school ID
- **Edit Teams**: Update team information
- **Delete Teams**: Remove teams from system
- **View Team Details**: UUID, creation date, school affiliation

**Table Columns:**
- Team Name
- Team UUID (truncated for display)
- School ID
- Created Date
- Actions (Edit/Delete)

### 4. **User Management** (`/admin/users`)
Manage user accounts:
- **Create Users**: Add new admins, clients, or viewers
- **Assign Roles**:
  - **Admin**: Full system control
  - **Client**: Can capture and upload photos
  - **Viewer**: Read-only access to approved photos
- **Edit Users**: Change user role
- **Delete Users**: Remove user accounts

**Table Columns:**
- Email
- Role (with color badge)
- Team Assignment
- Actions (Edit/Delete)

### 5. **Settings** (`/admin/settings`)
System configuration:

**General:**
- Site Name customization

**Storage:**
- Max File Size (1-500 MB)
- Auto-delete Days for non-approved photos

**Notifications:**
- Email notifications toggle

**Maintenance:**
- Enable/disable maintenance mode

## UI Components

### AdminSidebar
Collapsible navigation sidebar with:
- Quick links to all sections
- Current role indicator
- Logout button
- Responsive design for mobile

### AdminStats
Dashboard statistics widget showing:
- Color-coded stat cards
- Quick overview of system state
- Emoji icons for visual identification
- Hover effects for interactivity

### AdminTeamManager
Team CRUD operations with:
- Form validation
- Table view of all teams
- Inline edit/delete actions
- UUID display

### AdminUserManager
User account management with:
- Email validation
- Role selection dropdown
- User table with status badges
- Admin-only creation

### PhotoGrid
Reusable photo grid component showing:
- Thumbnail images
- Status indicators
- Metadata display
- Bulk selection (admin mode)
- Approve/delete actions

## Data Hooks

### usePhotoManagement
```javascript
const {
  photos,          // Array of Photo objects
  isLoading,       // Loading state
  error,           // Error message if any
  fetchPhotos,     // Fetch with optional filters
  approvePhoto,    // Approve by ID
  deletePhoto,     // Delete by ID
  uploadPhoto,     // Upload new photo
} = usePhotoManagement();
```

### useTeamManagement
```javascript
const {
  teams,           // Array of Team objects
  isLoading,       // Loading state
  error,           // Error message if any
  fetchTeams,      // Fetch all teams
  createTeam,      // Create new team
  updateTeam,      // Update team info
  deleteTeam,      // Delete team
} = useTeamManagement();
```

### useUserManagement
```javascript
const {
  users,           // Array of User objects
  isLoading,       // Loading state
  error,           // Error message if any
  fetchUsers,      // Fetch users (optional teamId filter)
  createUser,      // Create new user
  updateUser,      // Update user role
  deleteUser,      // Delete user
} = useUserManagement();
```

## Required API Endpoints

The dashboard expects these API routes:

### Photo APIs
- `GET /api/photos` - List photos with optional filters
- `POST /api/photos/upload` - Upload new photo
- `POST /api/photos/:id/approve` - Approve photo
- `DELETE /api/photos/:id` - Delete photo

### Team APIs
- `GET /api/teams` - List all teams
- `POST /api/teams` - Create team
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

### User APIs
- `GET /api/users` - List users with optional teamId filter
- `POST /api/users` - Create user
- `PUT /api/users/:id` - Update user
- `DELETE /api/users/:id` - Delete user

## Authentication

All admin pages check:
```javascript
const userRole = localStorage.getItem('userRole');
if (userRole !== 'admin') {
  router.push('/login');
}
```

Admin role must be set during login via `ClientLoginForm` or `AdminLoginForm`.

## Styling

### Admin Dashboard CSS
Main layout and container styles:
- Two-column layout (sidebar + content)
- Sticky header
- Scrollable content area
- Responsive mobile layout

### Component-Specific CSS
Each admin component has scoped CSS:
- AdminSidebar.css
- AdminStats.css
- AdminTeamManager.css
- AdminUserManager.css
- Settings.css

## Features & Best Practices

### Responsive Design
- Mobile-friendly sidebar (collapse to icons)
- Responsive tables with horizontal scroll on mobile
- Touch-friendly buttons and controls

### User Experience
- Confirmation dialogs for destructive actions
- Success/error messages
- Loading states
- Form validation with helpful error messages
- Empty states with guidance

### Performance
- Lazy data fetching with hooks
- Filtered data display
- Efficient re-renders with React hooks
- Pagination-ready architecture

### Security
- Admin authentication required
- Client-side role checking (must also validate server-side)
- No sensitive data in URLs
- Secure token handling in localStorage

## Future Enhancements

1. **Reporting**: Generate reports on photo status, storage usage
2. **Pagination**: For large datasets (teams, users, photos)
3. **Bulk Import**: CSV import for teams/users
4. **Analytics**: Charts and graphs for system metrics
5. **Audit Logs**: Track admin actions
6. **Notification Center**: Display system alerts
7. **Search/Filter**: Advanced search capabilities
8. **Export**: Export data as CSV/Excel

## File Structure

```
/components/admin/
  ├── AdminSidebar.tsx
  ├── AdminSidebar.css
  ├── AdminStats.tsx
  ├── AdminStats.css
  ├── AdminTeamManager.tsx
  ├── AdminTeamManager.css
  ├── AdminUserManager.css
  ├── SchoolFilter.tsx
  └── SchoolFilter.css

/app/admin/
  ├── layout.tsx
  ├── dashboard/
  │   ├── page.tsx
  │   └── admin-dashboard.css
  ├── photos/
  │   └── page.tsx
  ├── teams/
  │   └── page.tsx
  ├── users/
  │   └── page.tsx
  └── settings/
      ├── page.tsx
      └── settings.css

/hooks/
  ├── usePhotoManagement.ts
  ├── useTeamManagement.ts
  └── useUserManagement.ts
```

## Getting Started

1. Ensure admin authentication is set up
2. Implement API endpoints mentioned above
3. Run the development server: `npm run dev`
4. Navigate to `/admin/dashboard`
5. Use sidebar to access different management sections
