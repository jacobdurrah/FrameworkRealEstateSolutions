import Anthropic from '@anthropic-ai/sdk';

const apiKey = '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';

async function testKey() {
  try {
    const anthropic = new Anthropic({ apiKey });
    
    const response = await anthropic.messages.create({
      model: 'claude-3-5-sonnet-20241022',
      messages: [{ role: 'user', content: 'Say hello' }],
      max_tokens: 10
    });
    
    console.log('Success:', response.content[0].text);
  } catch (error) {
    console.error('Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testKey();