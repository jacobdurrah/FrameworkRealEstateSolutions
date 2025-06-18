# Update Production Site (frameworkrealestatesolutions.com)

The Market Analysis AI feature requires updating the production site to use the Vercel API endpoint.

## Files to Update on Production

### 1. Update `js/ai-query-processor.js`

The file has been updated to use the correct Vercel API URL when accessed from frameworkrealestatesolutions.com:

```javascript
// Production site needs to use Vercel API URL
this.apiBaseUrl = 'https://framework-7q9voggyv-jacob-durrahs-projects.vercel.app/api';
```

### 2. Files Changed for AI Feature

- `js/ai-query-processor.js` - NEW FILE (AI query handler)
- `market-analysis.html` - UPDATED (AI mode toggle and SQL preview)
- `js/market-query-builder.js` - UPDATED (enhanced patterns)

## Deployment Steps

1. **Pull latest from GitHub**:
   ```bash
   git pull origin main
   ```

2. **Copy updated files to production**:
   - Upload the new/updated files to your web host
   - Ensure all JavaScript files are updated

3. **Test the feature**:
   - Go to Market Analysis page
   - Enable "AI Mode (Beta)"
   - Try a query like "Did jacob durrah buy a house in 2024?"

## Alternative: Use Vercel for Everything

Instead of maintaining two separate deployments, you could:
1. Point frameworkrealestatesolutions.com to Vercel
2. Use Vercel's custom domain feature
3. This would ensure API and frontend are always in sync

## Current API Endpoint

The AI API is hosted at:
- https://framework-7q9voggyv-jacob-durrahs-projects.vercel.app/api/market/generate-sql
- https://framework-7q9voggyv-jacob-durrahs-projects.vercel.app/api/market/execute-sql

These endpoints require the `ANTHROPIC_API_KEY` environment variable which is already configured in Vercel.