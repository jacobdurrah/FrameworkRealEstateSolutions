// Test utilities for Portfolio Simulator E2E tests

/**
 * Wait for an element to be visible and stable
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {number} timeout - Max wait time in ms
 */
async function waitForElement(page, selector, timeout = 30000) {
  await page.waitForSelector(selector, { state: 'visible', timeout });
  await page.waitForLoadState('networkidle');
}

/**
 * Fill form field with retry logic
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector
 * @param {string} value - Value to fill
 */
async function fillField(page, selector, value) {
  await page.fill(selector, '');
  await page.fill(selector, value.toString());
  // Verify the value was set
  const actualValue = await page.inputValue(selector);
  if (actualValue !== value.toString()) {
    throw new Error(`Failed to set field ${selector} to ${value}`);
  }
}

/**
 * Click button with retry logic
 * @param {Page} page - Playwright page object
 * @param {string} selector - CSS selector or text
 */
async function clickButton(page, selector) {
  // Try selector first
  try {
    await page.click(selector, { timeout: 5000 });
  } catch (e) {
    // Try by text content
    await page.click(`text="${selector}"`);
  }
}

/**
 * Create a new simulation with given parameters
 * @param {Page} page - Playwright page object
 * @param {Object} params - Simulation parameters
 */
async function createSimulation(page, params = {}) {
  const defaults = {
    name: 'Test Simulation',
    targetIncome: 10000,
    initialCapital: 50000,
    timeHorizon: 36,
    strategyType: 'balanced'
  };
  
  const simulationParams = { ...defaults, ...params };
  
  // Fill in the form
  await fillField(page, '#simulationName', simulationParams.name);
  await fillField(page, '#targetIncome', simulationParams.targetIncome);
  await fillField(page, '#initialCapital', simulationParams.initialCapital);
  await fillField(page, '#timeHorizon', simulationParams.timeHorizon);
  await page.selectOption('#strategyType', simulationParams.strategyType);
  
  // Click start simulation button
  await clickButton(page, 'Start Simulation');
  
  // Wait for simulation to be created
  await waitForElement(page, '#phasesList', 10000);
}

/**
 * Add a property to the current simulation
 * @param {Page} page - Playwright page object
 * @param {string} searchTerm - Property search term
 */
async function addProperty(page, searchTerm) {
  // Click add property button
  await clickButton(page, 'Add Property');
  
  // Wait for modal
  await waitForElement(page, '#propertySearchModal', 5000);
  
  // Search for property
  await fillField(page, '#modalSearchInput', searchTerm);
  await clickButton(page, 'Search');
  
  // Wait for results
  await page.waitForTimeout(2000); // Allow search to complete
  
  // Click first result
  const firstResult = await page.$('.property-result-card button');
  if (firstResult) {
    await firstResult.click();
  } else {
    throw new Error('No properties found for search term: ' + searchTerm);
  }
  
  // Wait for property to be added
  await page.waitForTimeout(1000);
}

/**
 * Get current portfolio metrics
 * @param {Page} page - Playwright page object
 */
async function getPortfolioMetrics(page) {
  const metrics = {};
  
  // Get metric values from the UI
  const metricElements = await page.$$('.metric-card');
  
  for (const element of metricElements) {
    const label = await element.$eval('.metric-label', el => el.textContent);
    const value = await element.$eval('.metric-value', el => el.textContent);
    metrics[label] = value;
  }
  
  return metrics;
}

/**
 * Verify that a simulation was saved
 * @param {Page} page - Playwright page object
 * @param {string} simulationName - Name of the simulation
 */
async function verifySimulationSaved(page, simulationName) {
  // Check saved simulations list
  const savedSimulations = await page.$$eval('#savedSimulationsList .saved-sim-card h4', 
    elements => elements.map(el => el.textContent)
  );
  
  if (!savedSimulations.includes(simulationName)) {
    throw new Error(`Simulation "${simulationName}" not found in saved list`);
  }
}

/**
 * Take a screenshot with a descriptive name
 * @param {Page} page - Playwright page object
 * @param {string} name - Screenshot name
 */
async function takeScreenshot(page, name) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  await page.screenshot({ 
    path: `test-results/screenshots/${name}-${timestamp}.png`,
    fullPage: true 
  });
}

module.exports = {
  waitForElement,
  fillField,
  clickButton,
  createSimulation,
  addProperty,
  getPortfolioMetrics,
  verifySimulationSaved,
  takeScreenshot
};