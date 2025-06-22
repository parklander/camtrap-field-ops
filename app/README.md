# CamTrap Field Ops

A Progressive Web App (PWA) for field technicians to deploy, maintain, and retrieve camera traps with offline capabilities and Supabase integration.

## Features

- **PWA Support**: Installable on mobile devices with offline capabilities
- **Supabase Integration**: Real-time database and authentication
- **Mobile-First Design**: Optimized for field use on smartphones and tablets
- **Offline Functionality**: Local storage with sync when online

## Tech Stack

- **Frontend**: Next.js 15 with TypeScript and Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **PWA**: next-pwa for service worker and manifest
- **Deployment**: Vercel

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- Supabase account

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd camtrap-field-ops/app
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   cp .env.local.example .env.local
   ```
   
   Edit `.env.local` and add your Supabase credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

5. **Open your browser**
   Navigate to [http://localhost:3001](http://localhost:3001)

## Supabase Setup

1. **Create a new Supabase project**
   - Go to [supabase.com](https://supabase.com)
   - Create a new project
   - Note your project URL and anon key

2. **Configure environment variables**
   - Copy your project URL to `NEXT_PUBLIC_SUPABASE_URL`
   - Copy your anon key to `NEXT_PUBLIC_SUPABASE_ANON_KEY`

3. **Test the connection**
   - The app includes a Supabase connection test component
   - Check the status on the homepage

## PWA Features

- **Installable**: Add to home screen on mobile devices
- **Offline Support**: Works without internet connection
- **Service Worker**: Caches resources for offline use
- **Manifest**: App metadata and icons

## Development

### Project Structure

```
app/
├── src/
│   ├── app/                 # Next.js App Router
│   ├── components/          # React components
│   ├── lib/                 # Utility functions
│   └── types/               # TypeScript types
├── public/                  # Static assets
│   ├── manifest.json        # PWA manifest
│   └── icons/               # PWA icons
└── .env.local.example       # Environment variables template
```

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run start` - Start production server
- `npm run lint` - Run ESLint

## Deployment

The app is configured for deployment on Vercel:

1. **Connect your repository** to Vercel
2. **Set environment variables** in Vercel dashboard
3. **Deploy** - Vercel will automatically build and deploy

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Submit a pull request

## License

[Add your license here]
