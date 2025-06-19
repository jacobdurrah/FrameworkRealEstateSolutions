import { test, expect } from '@playwright/test';

test('Debug ShareManager Loading', async ({ page }) => {
  const baseURL = 'https://frameworkrealestatesolutions.com';
  
  console.log('Debugging ShareManager loading issue...\n');
  
  // Enable console logging
  page.on('console', msg => {
    if (msg.type() === 'error') {
      console.log('Browser Error:', msg.text());
    }
  });
  
  await page.goto(`${baseURL}/portfolio-simulator-v3.html`);
  await page.waitForLoadState('networkidle');
  
  // Check script loading order
  const scriptStatus = await page.evaluate(() => {
    const scripts = Array.from(document.querySelectorAll('script[src]'));
    const scriptInfo = scripts.map(s => ({
      src: s.src,
      loaded: true // We can't easily check if loaded without events
    }));
    
    return {
      scripts: scriptInfo,
      totalScripts: scripts.length,
      shareManagerScript: scripts.find(s => s.src.includes('share-manager.js')),
      v3Script: scripts.find(s => s.src.includes('portfolio-simulator-v3.js'))
    };
  });
  
  console.log(`Total scripts: ${scriptStatus.totalScripts}`);
  console.log(`\nShareManager script: ${scriptStatus.shareManagerScript ? scriptStatus.shareManagerScript.src : 'NOT FOUND'}`);
  console.log(`V3 script: ${scriptStatus.v3Script ? scriptStatus.v3Script.src : 'NOT FOUND'}`);
  
  // Check if scripts are in correct order
  if (scriptStatus.shareManagerScript && scriptStatus.v3Script) {
    const shareManagerIndex = scriptStatus.scripts.findIndex(s => s.src.includes('share-manager.js'));
    const v3Index = scriptStatus.scripts.findIndex(s => s.src.includes('portfolio-simulator-v3.js'));
    
    console.log(`\nScript order:`);
    console.log(`ShareManager index: ${shareManagerIndex}`);
    console.log(`V3 index: ${v3Index}`);
    console.log(`Order correct (ShareManager before V3): ${shareManagerIndex < v3Index ? '✅' : '❌'}`);
  }
  
  // Try to fetch and check ShareManager content
  console.log('\nChecking ShareManager file content...');
  const shareManagerContent = await page.evaluate(async () => {
    try {
      const response = await fetch('/js/share-manager.js');
      const text = await response.text();
      return {
        status: response.status,
        length: text.length,
        hasClass: text.includes('class ShareManager'),
        hasConstructor: text.includes('constructor()'),
        firstChars: text.substring(0, 100)
      };
    } catch (e) {
      return { error: e.message };
    }
  });
  
  if (shareManagerContent.status === 200) {
    console.log(`File status: ${shareManagerContent.status}`);
    console.log(`File length: ${shareManagerContent.length} characters`);
    console.log(`Has ShareManager class: ${shareManagerContent.hasClass ? '✅' : '❌'}`);
    console.log(`Has constructor: ${shareManagerContent.hasConstructor ? '✅' : '❌'}`);
  } else {
    console.log('Error fetching file:', shareManagerContent.error);
  }
  
  // Check window object after delay
  console.log('\nChecking window object after delay...');
  await page.waitForTimeout(3000);
  
  const windowCheck = await page.evaluate(() => {
    return {
      ShareManager: typeof window.ShareManager,
      LZString: typeof window.LZString,
      serializeV3State: typeof window.serializeV3State,
      shareSimulation: typeof window.shareSimulation,
      v3State: typeof window.v3State
    };
  });
  
  console.log('\nWindow object status:');
  Object.entries(windowCheck).forEach(([key, type]) => {
    console.log(`- window.${key}: ${type} ${type !== 'undefined' ? '✅' : '❌'}`);
  });
  
  // Try loading ShareManager manually
  console.log('\nTrying to load ShareManager manually...');
  const manualLoad = await page.evaluate(() => {
    return new Promise((resolve) => {
      const script = document.createElement('script');
      script.src = '/js/share-manager.js';
      script.onload = () => resolve({ success: true, ShareManager: typeof window.ShareManager });
      script.onerror = (e) => resolve({ success: false, error: e.message });
      document.head.appendChild(script);
    });
  });
  
  console.log(`Manual load result: ${manualLoad.success ? '✅ Success' : '❌ Failed'}`);
  if (manualLoad.success) {
    console.log(`ShareManager type after manual load: ${manualLoad.ShareManager}`);
  }
});