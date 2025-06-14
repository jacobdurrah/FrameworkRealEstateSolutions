// Shared CORS configuration
export function configureCORS(req, res) {
  const allowedOrigins = [
    'https://frameworkrealestatesolutions.com',
    'https://www.frameworkrealestatesolutions.com',
    'https://jacobdurrah.github.io',
    'http://localhost:8000',
    'http://localhost:3000',
    'http://localhost:3001',
    'http://127.0.0.1:8000'
  ];
  
  const origin = req.headers.origin;
  
  // Check if origin is allowed
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // Allow requests with no origin (like Postman)
    res.setHeader('Access-Control-Allow-Origin', '*');
  } else {
    // Default to main domain
    res.setHeader('Access-Control-Allow-Origin', 'https://frameworkrealestatesolutions.com');
  }
  
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return true;
  }
  
  return false;
}