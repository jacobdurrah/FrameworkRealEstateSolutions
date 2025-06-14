# Backend Scripts for Parcel Data Management

This directory contains scripts for managing Detroit parcel data in Supabase.

## ✅ Setup Status

- ✅ **Database Created**: Schema successfully deployed to Supabase
- ✅ **Data Uploaded**: 371,446 parcel records loaded (98% success rate)
- ✅ **Frontend Configured**: Live on the website with parcel data integration
- ✅ **API Connected**: Real-time queries working with caching

## Setup Instructions

### 1. Create a Supabase Project

1. Go to [Supabase](https://supabase.com) and create a free account
2. Create a new project
3. Note your project URL and anon key from the project settings

### 2. Set Up Database Schema

1. Go to the SQL Editor in your Supabase dashboard
2. Copy the contents of `schema.sql`
3. Run the SQL to create the parcels table and indexes

### 3. Configure Environment

1. Copy `.env.example` to `.env` in the project root:
   ```bash
   cp ../.env.example ../.env
   ```

2. Edit `.env` and add your Supabase credentials:
   ```
   SUPABASE_URL=https://YOUR_PROJECT.supabase.co
   SUPABASE_ANON_KEY=YOUR_ANON_KEY
   SUPABASE_SERVICE_KEY=YOUR_SERVICE_KEY
   ```

### 4. Install Dependencies

```bash
cd backend-scripts
npm install
```

### 5. Upload Parcel Data

```bash
npm run upload
```

This will:
- Read the CSV file (404,000+ records)
- Transform the data to match the database schema
- Upload in batches of 1,000 records
- Show progress and statistics
- Take approximately 30-60 minutes

### 6. Update Frontend Configuration

1. Edit `js/app-config.js` in the main project
2. Add your Supabase credentials:
   ```javascript
   SUPABASE_URL: 'https://YOUR_PROJECT.supabase.co',
   SUPABASE_ANON_KEY: 'YOUR_ANON_KEY',
   ```
3. Set `ENABLE_PARCEL_DATA: true`

## Maintenance

### Updating Data

When new parcel data is available:

1. Download the new CSV file
2. Rename it to match the pattern in the upload script
3. Run: `npm run update` (coming soon)

### Monitoring

- Check Supabase dashboard for API usage
- Monitor database size (500MB free tier limit)
- Review query performance

## Troubleshooting

### Upload Errors

If the upload fails:
- Check your internet connection
- Verify Supabase credentials
- Check Supabase dashboard for rate limits
- The script will show which records failed

### Performance Issues

If queries are slow:
- Check that indexes were created properly
- Review query patterns in Supabase dashboard
- Consider adding additional indexes

## Database Schema

The parcels table includes:
- Property identification (address, parcel ID)
- Owner information (names, mailing addresses)
- Property details (year built, square footage)
- Tax assessments (assessed/taxable values)
- Sale history (date and price)
- Location data (neighborhood, ward, district)
- Lot dimensions (frontage, depth, acreage)