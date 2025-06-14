# How to Disable Vercel Authentication

Your Vercel account has authentication protection enabled by default for all deployments. To make your API publicly accessible, you need to disable this in the Vercel dashboard.

## Steps to Disable Authentication:

1. **Go to Vercel Dashboard**
   - Visit: https://vercel.com/dashboard

2. **Select Your Project**
   - Click on `framework-api` (or `framework-realestate-api`)

3. **Go to Project Settings**
   - Click on the "Settings" tab at the top

4. **Find Authentication Settings**
   - Look for one of these sections:
     - "Vercel Authentication"
     - "Password Protection"
     - "Deployment Protection"
   - It's usually under "General" or "Security"

5. **Disable Protection**
   - Toggle OFF the authentication/protection
   - Or set it to "Public" access

6. **Save Changes**
   - The changes should apply to all future deployments
   - You may need to redeploy for existing deployments

## Alternative: Use Vercel's Team Settings

If you can't find the setting in the project:

1. Go to your **Team Settings**
2. Look for **Security** or **Authentication**
3. Disable "Deployment Protection" for the team

## Test Your API

After disabling authentication, test your API:
```bash
curl https://your-deployment-url.vercel.app/api/properties/search
```

You should get a proper response instead of a 401 error.

## Note
The authentication is preventing your website from accessing the API. Once disabled, your property finder will work correctly!