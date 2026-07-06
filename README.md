# Swipy - Tinder for startups

A modern React application for discovering and connecting with startups, built with Vite, React, and Supabase.

## 🚀 Quick Start

### Prerequisites

- Node.js 25.0.0 (use `nvm use to switch to the correct version)
- npm or yarn package manager

### Installation

1. **Clone the repository** (if not already done)
   ```bash
   git clone <repository-url>
   cd Swipy
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up environment variables**
   ```bash
   # Copy the template file
   cp .env.local.template .env.loocal
   
   # Edit .env.local with your actual Supabase credentials
   # You need at least:
   # VITE_PUBLIC_SUPABASE_URL="your_supabase_url"
   # VITE_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:3000`

### Available Scripts

- `npm run dev` - Start development server
- `npm run build` - Build for production
- `npm run preview` - Preview production build
- `npm run lint` - Run ESLint

## 🛠️ Tech Stack

- **Frontend**: React 18, Vite 7
- **Styling**: TailwindCSS, Custom CSS
- **Backend**: Supabase (PostgreSQL, Auth, Storage)
- **Routing**: React Router DOM
- **Icons**: Font Awesome
- **Fonts**: Inter (Google Fonts)

## 📱 Features

- User authentication and profiles
- Startup discovery with swipe interface
- Real-time chat functionality
- Notifications system
- Advanced filtering options
- Mobile-responsive design

## 🔧 Configuration

### Node.js Version

This project requires Node.js 25.0.0. The version is specified in:
- `.nvmrc` file for nvm users
- `package.json` engines field

### Environment Variables

Required environment variables (see `.env.local.template`):

- `VITE_PUBLIC_SUPABASE_URL` - Your Supabase project URL
- `VITE_PUBLIC_SUPABASE_ANON_KEY` - Your Supabase anonymous key

## 📚 Documentation

- [Supabase Setup Guide](./SUPABASE_SETUP.md) - Complete backend setup instructions
- [Google OAuth Setup](./GOOGLE_OAUTH_SETUP.md) - OAuth configuration
- [SQL Execution Order](./SQL_EXECUTION_ORDER.md) - Database schema setup

## 🚀 Deployment

The app is configured for deployment on Vercel. See `vercel.json` for configuration.

For local production build:
```bash
npm run build
npm run preview
```

## 🤝 Contributing

1. Follow the existing code style
2. Run `npm run lint` before committing
3. Ensure all tests pass
4. Update documentation as needed

## 📄 License

[Add your license information here]
