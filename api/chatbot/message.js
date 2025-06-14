// Serverless function for chatbot message processing
// Parses natural language queries and returns structured search parameters

export default async function handler(req, res) {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { message } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    // Parse the user's message to extract search criteria
    const searchParams = parseUserIntent(message);
    
    // If we need geocoding (address to coordinates), we'd call a geocoding API here
    // For now, we'll return the parsed parameters
    
    res.status(200).json({
      success: true,
      parsedQuery: searchParams,
      message: 'Query parsed successfully'
    });
    
  } catch (error) {
    console.error('Chatbot API error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
}

// Parse user intent from natural language
function parseUserIntent(message) {
  const patterns = {
    radius: /within (\d+) mile(?:s)? (?:of|from) (.+?)(?:\s|$)/i,
    zipCode: /(?:zip|zipcode|zip code)\s*(\d{5})/i,
    price: /(?:under|below|less than|max|maximum)\s*\$?(\d+)k?/i,
    minPrice: /(?:over|above|more than|min|minimum)\s*\$?(\d+)k?/i,
    bedrooms: /(\d+)\s*(?:bed|bedroom|br)/i,
    sold: /sold|recent sales|recently sold/i,
    address: /(?:at|near|around)\s+(\d+\s+[A-Za-z\s]+(?:st|street|ave|avenue|rd|road|blvd|boulevard|dr|drive))/i
  };

  const params = {
    location: 'Detroit, MI' // default
  };

  // Extract radius search
  const radiusMatch = message.match(patterns.radius);
  if (radiusMatch) {
    params.radius = radiusMatch[1];
    params.searchAddress = radiusMatch[2];
    params.needsGeocoding = true;
  }

  // Extract zip code
  const zipMatch = message.match(patterns.zipCode);
  if (zipMatch) {
    params.zipCode = zipMatch[1];
    params.location = zipMatch[1];
  }

  // Extract price constraints
  const maxPriceMatch = message.match(patterns.price);
  if (maxPriceMatch) {
    const value = maxPriceMatch[1];
    params.maxPrice = value.endsWith('k') ? 
      parseInt(value) * 1000 : 
      parseInt(value);
  }

  const minPriceMatch = message.match(patterns.minPrice);
  if (minPriceMatch) {
    const value = minPriceMatch[1];
    params.minPrice = value.endsWith('k') ? 
      parseInt(value) * 1000 : 
      parseInt(value);
  }

  // Extract bedrooms
  const bedroomMatch = message.match(patterns.bedrooms);
  if (bedroomMatch) {
    params.beds_min = bedroomMatch[1];
  }

  // Check if looking for sold properties
  if (patterns.sold.test(message)) {
    params.status_type = 'RecentlySold';
  } else {
    params.status_type = 'ForSale';
  }

  // Extract specific address
  const addressMatch = message.match(patterns.address);
  if (addressMatch && !params.searchAddress) {
    params.searchAddress = addressMatch[1];
    params.needsGeocoding = true;
  }

  return params;
}