# Deployment Guide for Market Analysis AI Feature

## Prerequisites
- Node.js 18+ installed
- Vercel account (or similar serverless platform)
- Anthropic API key (already embedded in code for now)

## Local Development Setup

1. **Install dependencies for API**:
   ```bash
   cd api
   npm install
   ```

2. **Run local development server** (optional):
   ```bash
   # From project root
   python -m http.server 8080
   # Or use any static file server
   ```

## Deployment Steps

### Option 1: Vercel Deployment (Recommended)

1. **Install Vercel CLI**:
   ```bash
   npm install -g vercel
   ```

2. **Deploy from project root**:
   ```bash
   vercel
   ```

3. **Follow prompts**:
   - Select your account
   - Link to existing project or create new
   - Use default settings

4. **Set environment variables** (optional - API key is already in code):
   ```bash
   vercel env add ANTHROPIC_API_KEY
   ```

### Option 2: Manual Deployment

1. **Deploy API functions** to your serverless platform
2. **Update API URLs** in `js/ai-query-processor.js` if needed
3. **Deploy static files** to your web host

## Testing the Deployment

1. **Test AI Mode**:
   - Go to Market Analysis page
   - Toggle "AI Mode (Beta)"
   - Try queries like:
     - "What properties did Jacob Durrah buy?"
     - "Show me all cash sales above $100k in 2023"
     - "Who bought the most properties in 48214?"

2. **Test Pattern Mode**:
   - Turn off AI Mode
   - Try the pre-built query patterns

## Important Notes

- The Anthropic API key is currently hardcoded in the generate-sql.js file
- For production, you should use environment variables instead
- The API has rate limiting - be mindful of usage
- SQL execution is limited to SELECT queries only for safety

## Troubleshooting

**API Key Issues**:
- Verify the API key is correct
- Check for rate limiting

**CORS Issues**:
- The cors.js file allows localhost and production domain
- Add your domain if different

**SQL Execution Errors**:
- Complex queries with JOINs aren't supported yet
- Simplify queries to single table operations

## Files Changed

- `/api/market/generate-sql.js` - AI SQL generation endpoint
- `/api/market/execute-sql.js` - SQL execution endpoint
- `/api/cors.js` - CORS configuration
- `/api/package.json` - API dependencies
- `/js/ai-query-processor.js` - Client-side AI handler
- `/market-analysis.html` - Updated UI with AI mode