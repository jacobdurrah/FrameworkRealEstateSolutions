// Middleware to handle CORS and bypass authentication for API routes
export const config = {
  matcher: '/api/:path*',
}

export function middleware(request) {
  // For API routes, add CORS headers
  const response = new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': 'https://frameworkrealestatesolutions.com',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });

  // Handle preflight requests
  if (request.method === 'OPTIONS') {
    return response;
  }

  return response;
}