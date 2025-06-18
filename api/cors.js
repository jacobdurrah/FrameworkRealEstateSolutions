// Shared CORS configuration
export function configureCORS(req, res) {
  // Allow both production and localhost
  const origin = req.headers.origin;
  const allowedOrigins = [
    'https://frameworkrealestatesolutions.com',
    'https://www.frameworkrealestatesolutions.com',
    'http://localhost:8080',
    'http://localhost:3000',
    'http://127.0.0.1:8080'
  ];
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (origin && origin.includes('vercel.app')) {
    // Allow all Vercel preview deployments
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else {
    // Default to production domain
    res.setHeader('Access-Control-Allow-Origin', 'https://frameworkrealestatesolutions.com');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version, Authorization'
  );
  res.setHeader('Access-Control-Max-Age', '86400');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}