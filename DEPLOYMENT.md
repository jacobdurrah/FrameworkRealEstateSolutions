# Deployment Guide for Framework Real Estate Solutions

## Overview
This guide explains how to deploy the Framework Real Estate Solutions website with its secure backend API.

## Architecture
- **Frontend**: Static HTML/JS/CSS served from GitHub Pages
- **Backend**: Serverless functions deployed on Vercel
- **API Security**: Zillow API key stored as environment variable

## Deployment Steps

### 1. Deploy Backend to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Login to Vercel**:
   ```bash
   vercel login
   ```

3. **Deploy the Backend**:
   ```bash
   vercel
   ```
   
   Follow the prompts:
   - Set up and deploy: Yes
   - Which scope: Select your account
   - Link to existing project: No
   - Project name: framework-realestate-backend
   - Directory: ./
   - Build command: (leave empty)
   - Output directory: (leave empty)
   - Development command: vercel dev

4. **Configure Environment Variables**:
   ```bash
   vercel env add ZILLOW_API_KEY
   ```
   
   When prompted, enter: `435eeaf287msh252959294ebf8abp1d39bbjsnc04db0da6d18`
   
   Select all environments (Production, Preview, Development)

5. **Deploy to Production**:
   ```bash
   vercel --prod
   ```

6. **Note your Backend URL**:
   After deployment, you'll get a URL like: `https://framework-realestate-backend.vercel.app`

### 2. Update Frontend Configuration

1. **Update API Base URL** in `js/property-api.js`:
   ```javascript
   const API_CONFIG = {
       baseUrl: window.location.hostname === 'localhost' 
           ? 'http://localhost:3000/api' 
           : 'https://framework-realestate-backend.vercel.app/api',  // Your Vercel URL
       headers: {
           'Content-Type': 'application/json'
       }
   };
   ```

2. **Commit Changes**:
   ```bash
   git add .
   git commit -m "Update API endpoint to production backend"
   git push
   ```

### 3. GitHub Pages Deployment (Already Set Up)
The frontend is automatically deployed via GitHub Pages at:
https://yourusername.github.io/FrameworkRealEstateSolution/

## Testing

### Local Testing:
```bash
# Terminal 1 - Run backend
vercel dev

# Terminal 2 - Serve frontend
python3 -m http.server 8000
```

Visit http://localhost:8000

### Production Testing:
Visit your GitHub Pages URL and test:
1. Property search functionality
2. Chatbot natural language queries
3. Property details loading

## Environment Variables

Required environment variables for Vercel:
- `ZILLOW_API_KEY`: Your RapidAPI key for Zillow API

## Troubleshooting

### CORS Issues:
- Ensure the backend API endpoints have proper CORS headers
- Check that the frontend is using the correct backend URL

### API Rate Limits:
- The app gracefully falls back to mock data when API limits are reached
- Monitor usage in your RapidAPI dashboard

### 404 Errors:
- Verify the backend is deployed and accessible
- Check API endpoint URLs match between frontend and backend

## Future Enhancements

1. **Database Integration**:
   - Add Supabase for property data caching
   - Store user searches and preferences

2. **Authentication**:
   - Add user accounts for saved searches
   - Implement admin panel for property management

3. **Additional APIs**:
   - Integrate geocoding for address searches
   - Add property valuation APIs
   - Include neighborhood data APIs

## Support
For issues or questions, contact Framework Real Estate Solutions technical team.