# EduConnect SIM Manager

A modern SIM card management dashboard built with Angular, TypeScript and Vercel Postgres.

## Features

- 📱 **SIM Card Management**: Add, view, and manage SIM cards
- 🎨 **Custom Status Dropdown**: Beautiful status indicators with icons
- 🔍 **Search & Filter**: Search by ID, number, or assigned person
- 📊 **Statistics Dashboard**: Real-time stats about total, active, deactivated, and spam SIMs
- 🎨 **Personalization Panel**: Customize accent color and organization name
- 💾 **Vercel Postgres Integration**: Persistent data storage

## Tech Stack

### Frontend
- Angular 17
- TypeScript
- SCSS

### Backend
- Vercel Serverless Functions
- Vercel Postgres

## Installation & Setup

### Prerequisites

- Node.js 18+
- npm or yarn
- Vercel account (for deployment)

### Local Development

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Set up environment variables** (see `.env.example`):
   ```
   POSTGRES_URL=your_vercel_postgres_url
   ```

3. **Start development server**:
   ```bash
   npm start
   ```

4. **Open your browser**: Navigate to `http://localhost:4200`

## Deployment

1. **Deploy to Vercel:
   ```bash
   vercel
   ```

## Project Structure

```
.
├── api/                # Vercel serverless functions
│   └── sims.ts       # API endpoint for SIMs
├── lib/               # Backend utilities
│   └── db.ts         # Database setup & query helpers
├── src/               # Angular source code
│   ├── app/          # Main application
│   │   ├── models/    # Data models
│   │   ├── services/# Services
│   │   └── sim-manager/ # Main component
├── angular.json      # Angular config
├── package.json      # Dependencies
└── tsconfig.json    # TypeScript config
```

## License

MIT
