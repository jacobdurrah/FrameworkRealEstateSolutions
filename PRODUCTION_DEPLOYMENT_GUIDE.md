# Production Deployment Guide for AI Market Analysis

## Files to Upload to frameworkrealestatesolutions.com

### 1. **Required JavaScript Files**
Upload these files to maintain the same directory structure:

- `js/ai-query-processor.js` - **NEW FILE** (handles AI queries)
  - Current API URL: `https://framework-20wbysc7e-jacob-durrahs-projects.vercel.app/api`
  
- `js/market-query-builder.js` - **UPDATED** (enhanced patterns)

### 2. **Updated HTML File**
- `market-analysis.html` - **UPDATED** (includes AI mode toggle and error handling)

### 3. **Test the Deployment**

After uploading the files:

1. **Clear Browser Cache** (important!)
   - Chrome: Cmd+Shift+R (Mac) or Ctrl+Shift+R (Windows)
   - Or open in Incognito/Private mode

2. **Test AI Mode**:
   - Go to: https://frameworkrealestatesolutions.com/market-analysis.html
   - Toggle "AI Mode (Beta)" ON
   - Try: "What properties did Jacob Durrah buy in Detroit?"
   - You should see SQL preview, then results

3. **Verify No Errors**:
   - Open browser console (F12)
   - Should NOT see CORS errors
   - Should NOT see "Unexpected token" errors

## Troubleshooting

### If you see "Unable to connect to the API":
- The API URL might have changed
- Check the latest deployment URL in this file

### If you see CORS errors:
- Make sure you're accessing via https://frameworkrealestatesolutions.com
- Not http:// or www. version

### If you see "Supabase credentials not configured":
- This has been fixed in the latest deployment
- Clear cache and try again

## Current API Endpoints

✅ **Working Deployment**: https://framework-20wbysc7e-jacob-durrahs-projects.vercel.app
- `/api/market/generate-sql` - Converts natural language to SQL
- `/api/market/execute-sql` - Executes SQL queries

## Features Now Available

1. **AI Mode**: Natural language queries
2. **Pattern Mode**: Pre-built query patterns (default)
3. **SQL Preview**: See generated SQL before execution
4. **Error Handling**: User-friendly error messages
5. **Export**: CSV and JSON export options

## Important Notes

- The Anthropic API key is configured on the server
- No API keys needed in frontend code
- All sensitive operations happen server-side
- CORS is configured for frameworkrealestatesolutions.com

Last updated: 2025-06-18