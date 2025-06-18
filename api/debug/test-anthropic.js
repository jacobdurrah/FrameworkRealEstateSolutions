export default async function handler(req, res) {
  try {
    // Log the API key info
    const apiKey = process.env.ANTHROPIC_API_KEY;
    console.log('API Key length:', apiKey?.length);
    console.log('API Key prefix:', apiKey?.substring(0, 20));
    
    // Try importing the SDK
    const { default: Anthropic } = await import('@anthropic-ai/sdk');
    
    // Create client
    const anthropic = new Anthropic({ 
      apiKey: apiKey,
      // Add debug headers
      defaultHeaders: {
        'anthropic-version': '2023-06-01'
      }
    });
    
    // Try a simple request
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: 'Say hello in 5 words' }],
      max_tokens: 50
    });
    
    res.status(200).json({
      success: true,
      response: response.content[0].text,
      model: response.model
    });
    
  } catch (error) {
    console.error('Full error:', error);
    res.status(500).json({
      error: error.message,
      type: error.constructor.name,
      status: error.status,
      details: error.response?.data || error
    });
  }
}