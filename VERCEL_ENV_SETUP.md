# Setting up Environment Variables in Vercel

## Important: API Key Required
The AI Market Analysis feature requires an Anthropic API key to function. You need to set this up in Vercel.

## Steps to Add Your API Key

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project: `framework-api`

2. **Navigate to Settings**
   - Click on the "Settings" tab
   - Select "Environment Variables" from the left sidebar

3. **Add the API Key**
   - Click "Add New"
   - Enter the following:
     - **Key**: `ANTHROPIC_API_KEY`
     - **Value**: Your Anthropic API key
     - **Environment**: Select all (Production, Preview, Development)
   - Click "Save"

4. **Redeploy**
   - Go to the "Deployments" tab
   - Click the three dots on the latest deployment
   - Select "Redeploy"
   - Wait for deployment to complete

## Alternative: Using Vercel CLI

```bash
# Set the environment variable
vercel env add ANTHROPIC_API_KEY

# When prompted:
# - Paste your API key
# - Select all environments
# - Confirm

# Redeploy
vercel --prod
```

## Your API Key
You'll need to use the Anthropic API key you provided earlier. 
Format: `sk-ant-api03-...`

## Verification
After setting up, test the AI mode:
1. Go to Market Analysis page
2. Enable "AI Mode (Beta)"
3. Try a query like "Show recent sales"
4. You should see SQL generated

## Security Note
Never commit API keys to Git. Always use environment variables for sensitive data.