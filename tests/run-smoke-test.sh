#!/bin/bash

# Portfolio Simulator Smoke Test Runner
# This script runs a quick subset of tests to verify the test setup is working

echo "🧪 Running Portfolio Simulator Smoke Tests..."
echo "==========================================="
echo ""

# Run only the basic loading test on Chromium
echo "📋 Running basic page load test..."
npx playwright test portfolio-simulator.spec.js -g "should load the portfolio simulator page" --project=chromium

# Check if test passed
if [ $? -eq 0 ]; then
    echo ""
    echo "✅ Smoke test passed! The test setup is working correctly."
    echo ""
    echo "📝 Next steps:"
    echo "   - Run all tests: npm run test:e2e"
    echo "   - Run tests with UI: npm run test:e2e:ui"
    echo "   - Debug tests: npm run test:e2e:debug"
    echo ""
else
    echo ""
    echo "❌ Smoke test failed. Please check:"
    echo "   1. The local web server is accessible"
    echo "   2. The portfolio-simulator.html file exists"
    echo "   3. All dependencies are installed"
    echo ""
    echo "Try running: npm run test:e2e:debug"
fi