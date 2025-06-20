# AI API Troubleshooting Guide

## 🚨 Current Issues

### Issue 1: 404 Error - Enhanced Strategy Generator
**Error**: `Failed to load resource: the server responded with a status of 404 ()`

**Root Cause**: The `enhanced-strategy-generator` endpoint may not be properly deployed or accessible.

**Solutions**:
1. **Check Deployment Status**
   ```bash
   curl -I https://framework-api-eta.vercel.app/api/ai/enhanced-strategy-generator
   ```

2. **Verify File Structure**
   - Ensure `api/ai/enhanced-strategy-generator.js` exists
   - Check that the file exports a default handler function
   - Verify the file is in the correct Vercel deployment path

3. **Test Basic Endpoint**
   ```bash
   curl -X POST https://framework-api-eta.vercel.app/api/ai/strategy-generator \
     -H "Content-Type: application/json" \
     -d '{"goal":"test","mode":"strategy"}'
   ```

### Issue 2: 504 Gateway Timeout
**Error**: `POST https://framework-api-eta.vercel.app/api/ai/enhanced-strategy-generator 504 (Gateway Timeout)`

**Root Cause**: The AI processing is taking longer than Vercel's 30-second timeout limit.

**Solutions**:

#### Immediate Fixes:
1. **Reduce Timeout in Frontend**
   ```javascript
   // In ai-service-v2.js
   timeout: 25000, // Reduced from 30000ms
   ```

2. **Simplify AI Prompts**
   - Use shorter, more focused prompts
   - Remove complex JSON parsing requirements
   - Limit response length

3. **Add Better Error Handling**
   ```javascript
   if (response.status === 504) {
       throw new Error('Gateway timeout - AI service is taking too long to respond');
   }
   ```

#### Long-term Solutions:
1. **Implement Caching**
   - Cache AI responses for 30 minutes
   - Return cached results for similar requests

2. **Use Background Processing**
   - Implement webhook-based processing
   - Use Vercel's background functions

3. **Optimize Claude API Calls**
   - Use smaller models (Claude Haiku instead of Claude Sonnet)
   - Implement request batching
   - Add retry logic with exponential backoff

### Issue 3: Response Parsing Error
**Error**: `"Failed to parse AI response: response.match is not a function"`

**Root Cause**: The code is trying to call `.match()` on the full Claude API response object instead of the text content.

**Fix Applied**:
```javascript
// Before (incorrect)
const response = await this.client.sendMessage(messages, systemPrompt);
const jsonMatch = response.match(/\{[\s\S]*\}/);

// After (correct)
const response = await this.client.sendMessage(messages, systemPrompt);
const responseText = response.content[0].text;
const jsonMatch = responseText.match(/\{[\s\S]*\}/);
```

## 🔧 Diagnostic Steps

### Step 1: Check API Health
```bash
curl https://framework-api-eta.vercel.app/api/ai/health
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2025-06-20T23:18:22.731Z",
  "services": {
    "claude": {
      "status": "healthy",
      "responseTime": "1500ms"
    }
  }
}
```

### Step 2: Test Basic Strategy Generator
```bash
curl -X POST https://framework-api-eta.vercel.app/api/ai/strategy-generator \
  -H "Content-Type: application/json" \
  -d '{"goal":"I want to make $3000/month from rentals","mode":"strategy"}' \
  --max-time 30
```

### Step 3: Test Enhanced Strategy Generator
```bash
curl -X POST https://framework-api-eta.vercel.app/api/ai/enhanced-strategy-generator \
  -H "Content-Type: application/json" \
  -d '{"goal":"I want to make $3000/month from rentals","mode":"comprehensive"}' \
  --max-time 25
```

## 🛠️ Implementation Fixes

### Fix 1: Update AI Service Configuration
```javascript
// In js/services/ai-service-v2.js
this.config = {
    timeout: 25000, // Reduced timeout
    modes: {
        basic: { timeout: 10000, cache: true },
        comprehensive: { timeout: 25000, cache: true }, // Reduced
        explain: { timeout: 15000, cache: false }
    }
};
```

### Fix 2: Improve Error Handling
```javascript
// In js/services/ai-service-v2.js
if (!response.ok) {
    if (response.status === 504) {
        throw new Error('Gateway timeout - AI service is taking too long to respond');
    }
    throw new Error(`API error: ${response.status}`);
}
```

### Fix 3: Add Fallback Strategy
```javascript
// In js/services/ai-service-v2.js
getFallbackStrategy(goal) {
    return {
        success: true,
        source: 'fallback',
        data: {
            strategies: ['rental'],
            constraints: {
                locations: [],
                propertyTypes: ['single-family']
            },
            phases: [{
                phaseNumber: 1,
                focus: 'acquisition',
                duration: 12,
                description: 'Purchase first rental property'
            }],
            confidenceScore: 0.6
        }
    };
}
```

## 📊 Performance Monitoring

### Add Performance Logging
```javascript
// In api/ai/enhanced-strategy-generator.js
console.log('[API] Starting enhanced strategy generation');
const startTime = Date.now();

const result = await generator.generateStrategy(goal, mode, context);

const duration = Date.now() - startTime;
console.log(`[API] Strategy generation completed in ${duration}ms`);
```

### Monitor Timeout Patterns
- Track which goals cause timeouts
- Identify patterns in complex requests
- Adjust timeout settings based on usage

## 🚀 Deployment Checklist

### Before Deployment:
1. ✅ Test locally with `vercel dev`
2. ✅ Verify environment variables are set
3. ✅ Check file permissions and structure
4. ✅ Test with simple requests first

### After Deployment:
1. ✅ Test health endpoint
2. ✅ Test basic strategy generator
3. ✅ Test enhanced strategy generator
4. ✅ Monitor logs for errors
5. ✅ Check response times

## 🔄 Fallback Strategy

### When AI is Unavailable:
1. **Use Rule-Based Fallback**
   - Parse goals using regex patterns
   - Generate basic strategies without AI
   - Provide clear indication of fallback source

2. **Cache Previous Results**
   - Store successful AI responses
   - Return cached results for similar goals
   - Implement cache invalidation

3. **Graceful Degradation**
   - Show user-friendly error messages
   - Provide alternative input methods
   - Suggest retrying later

## 📞 Support Actions

### Immediate Actions:
1. **Deploy Simplified Version**
   - Use shorter prompts
   - Reduce timeout to 20 seconds
   - Add comprehensive error handling

2. **Monitor Performance**
   - Track response times
   - Log timeout occurrences
   - Identify bottleneck patterns

3. **Implement Caching**
   - Cache successful responses
   - Reduce API calls
   - Improve user experience

### Long-term Actions:
1. **Optimize AI Processing**
   - Use more efficient prompts
   - Implement request batching
   - Consider alternative AI providers

2. **Scale Infrastructure**
   - Use background processing
   - Implement webhook-based responses
   - Consider dedicated AI service

3. **Improve Error Recovery**
   - Add automatic retry logic
   - Implement circuit breaker pattern
   - Provide better user feedback

## 🎯 Success Metrics

### Performance Targets:
- **Response Time**: < 20 seconds for 95% of requests
- **Success Rate**: > 90% successful responses
- **Timeout Rate**: < 5% of requests
- **Cache Hit Rate**: > 60% for repeated requests

### User Experience:
- **Fallback Availability**: 100% of requests get a response
- **Error Clarity**: Clear error messages for users
- **Recovery Time**: < 30 seconds for retry attempts

## 📝 Next Steps

1. **Immediate**: Deploy simplified enhanced-strategy-generator
2. **Short-term**: Implement comprehensive caching
3. **Medium-term**: Optimize AI prompts and processing
4. **Long-term**: Consider alternative AI infrastructure

---

**Last Updated**: 2025-06-20
**Status**: Active troubleshooting
**Priority**: High - affecting user experience 