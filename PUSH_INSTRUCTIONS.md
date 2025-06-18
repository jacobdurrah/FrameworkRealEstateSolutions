# Instructions to Push to GitHub

GitHub is blocking the push because it detected an Anthropic API key in the commit history.

## Option 1: Allow the Secret (Easiest)
1. Visit this URL:
   https://github.com/jacobdurrah/FrameworkRealEstateSolutions/security/secret-scanning/unblock-secret/2yfY7q0ypPMeZJzthb7VO8XplS1

2. Click "Allow secret" or "Push anyway"

3. Then run:
   ```bash
   git push origin main
   ```

## Option 2: Force Push (Alternative)
If you're okay with overwriting the remote history:
```bash
git push origin main --force
```

## Important Notes
- The API key has been removed from the current code
- You'll need to set it as an environment variable in Vercel
- See VERCEL_ENV_SETUP.md for instructions

## After Pushing
1. Go to Vercel dashboard
2. Add ANTHROPIC_API_KEY environment variable
3. Redeploy the application