# SmartTax - Vehicle Import Tax Calculator

A React-based application for calculating Kenya vehicle import taxes using the KRA (Kenya Revenue Authority) guidelines.

## Tech Stack
- **Frontend**: React 18, React Router
- **Database**: Supabase (PostgreSQL)
- **Authentication**: Supabase Auth

## Getting Started

### Prerequisites
- Node.js 16+
- npm or yarn
- Supabase account

### Setup

1. **Install dependencies**
   ```bash
   cd frontend
   npm install
   ```

2. **Setup Supabase Database**
   
   Go to [Supabase Dashboard](https://supabase.com/dashboard), select your project, and run the SQL in:
   ```
   frontend/src/config/database-schema.sql
   ```
   
   This will create all required tables (profiles, vehicles, crsp, calculations, documents, audit_logs).

3. **Start the app**
   ```bash
   npm start
   ```

4. **Open in browser**
   
   Navigate to http://localhost:3000

## Features

- ✅ User Registration/Login (Supabase Auth)
- ✅ Vehicle Lookup (CRSP Search)
- ✅ Tax Calculator (KRA 2025 Guidelines)
- ✅ Save/View Calculations
- ✅ Document Upload
- ✅ Report Generation
- ✅ Admin Dashboard

## Project Structure

```
SMArt-tax/
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/    # React components
│   │   ├── config/        # Supabase config & DB schema
│   │   ├── context/       # React contexts
│   │   ├── hooks/        # Custom hooks
│   │   ├── layouts/      # Page layouts
│   │   ├── pages/        # Page components
│   │   ├── services/     # API services
│   │   ├── styles/       # CSS styles
│   │   └── utils/        # Utilities
│   └── package.json
└── package.json          # Root package.json
```

## Supabase Tables

The database schema includes:

- **profiles**: User profiles (extends auth.users)
- **vehicles**: Vehicle database
- **crsp**: Customs Reserve Price Guide
- **calculations**: Tax calculations
- **documents**: Uploaded documents
- **audit_logs**: Audit trail

## License

MIT
