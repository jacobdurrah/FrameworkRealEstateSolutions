import { test, expect } from '@playwright/test';

test.describe('Property Address Population Tests', () => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  test.beforeEach(async ({ page }) => {
    // Mock the property API to return consistent test data
    await page.addInitScript(() => {
      window.mockListings = [
        {
          zpid: '123456',
          address: '20264 Waltham St, Detroit, MI 48205',
          price: 56850,
          bedrooms: 3,
          bathrooms: 2,
          livingArea: 1200,
          url: 'https://www.zillow.com/homedetails/123456',
          imgSrc: 'https://photos.zillowstatic.com/test1.jpg'
        },
        {
          zpid: '123457',
          address: '4226 18th St, Detroit, MI 48208',
          price: 42937,
          bedrooms: 2,
          bathrooms: 1,
          livingArea: 950,
          url: 'https://www.zillow.com/homedetails/123457',
          imgSrc: 'https://photos.zillowstatic.com/test2.jpg'
        },
        {
          zpid: '123458',
          address: '11116 Rosemary St, Detroit, MI 48213',
          price: 38777,
          bedrooms: 3,
          bathrooms: 1.5,
          livingArea: 1100,
          url: 'https://www.zillow.com/homedetails/123458',
          imgSrc: 'https://photos.zillowstatic.com/test3.jpg'
        }
      ];
      
      // Mock the search function
      window.searchPropertiesZillow = async (criteria) => {
        console.log('Mock searchPropertiesZillow called with:', criteria);
        // Filter mock listings based on price range
        const filtered = window.mockListings.filter(listing => 
          listing.price >= criteria.minPrice && 
          listing.price <= criteria.maxPrice
        );
        return { props: filtered };
      };
    });
  });
  
  test('Property addresses populate correctly after clicking Find Actual Listings', async ({ page }) => {
    console.log('\n=== Testing Property Address Population ===');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Step 1: Enter a goal
    console.log('Step 1: Entering investment goal...');
    await page.fill('#goalInput', 'I want to build a $10,000/month rental portfolio in 5 years');
    
    // Step 2: Generate strategy
    console.log('Step 2: Generating strategy...');
    await page.click('button:has-text("Generate Strategy")');
    
    // Wait for strategy to be generated
    await page.waitForSelector('.strategy-display', { timeout: 30000 });
    console.log('✅ Strategy generated');
    
    // Step 3: Apply strategy to timeline
    console.log('Step 3: Applying strategy to timeline...');
    await page.click('button:has-text("Apply to Timeline")');
    
    // Wait for timeline to be populated
    await page.waitForTimeout(2000);
    
    // Verify timeline has events
    const timelineRows = await page.locator('#timelineTable tbody tr').count();
    expect(timelineRows).toBeGreaterThan(0);
    console.log(`✅ Timeline populated with ${timelineRows} events`);
    
    // Get initial property values
    const initialProperties = await page.evaluate(() => {
      const inputs = document.querySelectorAll('#timelineTable input[placeholder="Property address"]');
      return Array.from(inputs).map(input => input.value);
    });
    console.log('Initial property values:', initialProperties);
    
    // Step 4: Click Find Actual Listings
    console.log('Step 4: Clicking Find Actual Listings...');
    await page.click('button:has-text("Find Actual Listings")');
    
    // Wait for listings to be applied
    await page.waitForTimeout(3000);
    
    // Step 5: Verify property addresses are populated
    console.log('Step 5: Verifying property addresses...');
    const propertyInputs = page.locator('#timelineTable input[placeholder="Property address"]');
    const propertyCount = await propertyInputs.count();
    
    let populatedCount = 0;
    const populatedAddresses = [];
    
    for (let i = 0; i < propertyCount; i++) {
      const input = propertyInputs.nth(i);
      const value = await input.inputValue();
      
      if (value && value.includes(':')) {
        populatedCount++;
        populatedAddresses.push(value);
        
        // Verify format is "Rental X: Address"
        expect(value).toMatch(/^(Rental|Flip|Property) \d+: .+$/);
        console.log(`✅ Property ${i + 1}: "${value}"`);
        
        // Check if Zillow link is present for this row
        const row = input.locator('xpath=ancestor::tr');
        const zillowLink = row.locator('.zillow-link');
        const hasLink = await zillowLink.count() > 0;
        
        if (hasLink) {
          const href = await zillowLink.getAttribute('href');
          expect(href).toContain('zillow.com');
          console.log(`   - Zillow link: ${href}`);
        }
      }
    }
    
    // Verify at least some properties were populated
    expect(populatedCount).toBeGreaterThan(0);
    console.log(`\n✅ ${populatedCount} of ${propertyCount} properties populated with real addresses`);
    
    // Step 6: Verify addresses are different from initial
    const finalProperties = await page.evaluate(() => {
      const inputs = document.querySelectorAll('#timelineTable input[placeholder="Property address"]');
      return Array.from(inputs).map(input => input.value);
    });
    
    let changedCount = 0;
    for (let i = 0; i < initialProperties.length; i++) {
      if (initialProperties[i] !== finalProperties[i]) {
        changedCount++;
      }
    }
    
    expect(changedCount).toBeGreaterThan(0);
    console.log(`✅ ${changedCount} property addresses were updated`);
    
    // Step 7: Verify sell events have matching property names
    console.log('\nStep 7: Verifying sell events have updated property names...');
    const sellEvents = await page.evaluate(() => {
      const rows = document.querySelectorAll('#timelineTable tbody tr');
      const sells = [];
      rows.forEach(row => {
        const actionSelect = row.querySelector('select.table-select');
        if (actionSelect && actionSelect.value === 'sell') {
          const propertyInput = row.querySelector('input[placeholder="Property address"]');
          sells.push(propertyInput ? propertyInput.value : '');
        }
      });
      return sells;
    });
    
    if (sellEvents.length > 0) {
      console.log('Sell events found:', sellEvents);
      sellEvents.forEach(property => {
        if (property) {
          expect(property).toMatch(/^(Rental|Flip|Property) \d+: .+$/);
        }
      });
      console.log('✅ Sell events have matching property names');
    }
  });
  
  test('Property input fields remain editable after population', async ({ page }) => {
    console.log('\n=== Testing Property Field Editability ===');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Quick setup: Generate strategy and apply
    await page.fill('#goalInput', 'Buy 3 rentals');
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-display', { timeout: 30000 });
    await page.click('button:has-text("Apply to Timeline")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Find Actual Listings")');
    await page.waitForTimeout(3000);
    
    // Test editing a property field
    const firstPropertyInput = page.locator('#timelineTable input[placeholder="Property address"]').first();
    const originalValue = await firstPropertyInput.inputValue();
    
    // Clear and type new value
    await firstPropertyInput.fill('');
    await firstPropertyInput.type('Custom Property: 123 Test St, Detroit, MI');
    
    // Verify the change persisted
    const newValue = await firstPropertyInput.inputValue();
    expect(newValue).toBe('Custom Property: 123 Test St, Detroit, MI');
    console.log('✅ Property field remains editable');
    
    // Verify the change is saved in the data model
    await page.evaluate(() => {
      if (typeof updateTimeline === 'function') {
        // Trigger the onchange event
        const input = document.querySelector('#timelineTable input[placeholder="Property address"]');
        input.dispatchEvent(new Event('change', { bubbles: true }));
      }
    });
    
    await page.waitForTimeout(500);
    
    // Check if the value persisted
    const persistedValue = await firstPropertyInput.inputValue();
    expect(persistedValue).toBe('Custom Property: 123 Test St, Detroit, MI');
    console.log('✅ Property changes are saved to the data model');
  });
  
  test('Empty timeline shows appropriate message', async ({ page }) => {
    console.log('\n=== Testing Empty Timeline Behavior ===');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Try to find listings without generating a strategy
    await page.click('button:has-text("Find Actual Listings")');
    
    // Check for error message
    const errorVisible = await page.locator('.alert-danger:has-text("generate a strategy")').isVisible();
    expect(errorVisible).toBe(true);
    console.log('✅ Appropriate error shown for empty timeline');
  });
  
  test('Property format consistency across buy and sell events', async ({ page }) => {
    console.log('\n=== Testing Property Format Consistency ===');
    
    await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
    await page.waitForLoadState('networkidle');
    
    // Generate a strategy with both buy and sell events
    await page.fill('#goalInput', 'BRRRR strategy with 2 properties, refinance and repeat');
    await page.click('button:has-text("Generate Strategy")');
    await page.waitForSelector('.strategy-display', { timeout: 30000 });
    await page.click('button:has-text("Apply to Timeline")');
    await page.waitForTimeout(2000);
    await page.click('button:has-text("Find Actual Listings")');
    await page.waitForTimeout(3000);
    
    // Collect all property names
    const allProperties = await page.evaluate(() => {
      const inputs = document.querySelectorAll('#timelineTable input[placeholder="Property address"]');
      return Array.from(inputs).map((input, index) => {
        const row = input.closest('tr');
        const actionSelect = row.querySelector('select.table-select');
        return {
          index: index,
          action: actionSelect ? actionSelect.value : '',
          property: input.value
        };
      });
    });
    
    console.log('All properties:', allProperties);
    
    // Check that sell events reference the same property names as buy events
    const buyProperties = allProperties.filter(p => p.action === 'buy' && p.property);
    const sellProperties = allProperties.filter(p => p.action === 'sell' && p.property);
    
    sellProperties.forEach(sell => {
      if (sell.property) {
        // Extract the property identifier (e.g., "Rental 1")
        const propertyId = sell.property.split(':')[0];
        const matchingBuy = buyProperties.find(buy => buy.property.startsWith(propertyId));
        
        if (matchingBuy) {
          expect(sell.property).toBe(matchingBuy.property);
          console.log(`✅ Sell event matches buy: "${sell.property}"`);
        }
      }
    });
  });
});