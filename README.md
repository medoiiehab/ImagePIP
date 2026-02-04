# Image Pipeline System

A streamlined image intake system designed for schools and teams with a "Hot-to-Cold" storage pipeline.

## Project Structure

```
├── app/
│   ├── admin/           # Admin dashboard & management
│   ├── client/          # Client capture interface
│   ├── viewer/          # Third-party viewer access
│   ├── layout.tsx       # Root layout
│   ├── page.tsx         # Home page (redirects)
│   └── globals.css      # Global styles
├── components/          # Reusable React components
├── lib/                 # Utility functions & helpers
├── types/               # TypeScript type definitions
├── public/              # Static assets
├── package.json         # Dependencies
├── tsconfig.json        # TypeScript configuration
└── next.config.js       # Next.js configuration
```

## Features

- **3-Field Authentication**: School/Team UUID, User UUID, and Password
- **Admin Panel**: Manage teams, users, and approve/delete photos
- **Client Interface**: Simple camera capture and upload
- **Photo Grid View**: Review and manage photos
- **Automatic Migration**: Move approved photos to Google Drive
- **Third-Party Access**: Share approved photos via Google Drive links

## Getting Started

### Prerequisites

- Node.js 16+ and npm
- Supabase account
- Google Drive API credentials

### Installation

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env.local` file based on `.env.local.example`:
   ```bash
   cp .env.local.example .env.local
   ```

4. Fill in your environment variables

### Development

Run the development server:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Build

Build for production:

```bash
npm run build
npm start
```

## Technology Stack

- **Frontend**: React 18 + Next.js 14
- **Styling**: CSS + ShadCN-UI
- **Mobile**: Capacitor.js
- **Backend**: Supabase (PostgreSQL)
- **Automation**: Supabase Edge Functions
- **Storage**: Google Drive API
- **Hosting**: GitHub Pages (configured)

## Environment Variables

See `.env.local.example` for required variables:

- `NEXT_PUBLIC_SUPABASE_URL`: Your Supabase project URL
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`: Supabase anonymous key
- `NEXT_PUBLIC_GOOGLE_CLIENT_ID`: Google OAuth client ID
- `GOOGLE_DRIVE_API_KEY`: Google Drive API key

## License

MIT
"# ImagePIP" 
"# ImagePIP" 
