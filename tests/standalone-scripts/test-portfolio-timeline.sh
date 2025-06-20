#!/bin/bash

echo "🧪 Testing Portfolio Simulator Timeline Functionality"
echo "=================================================="
echo ""

# Start local server if not running
echo "📦 Starting local server..."
npx http-server . -p 8080 -c-1 > /dev/null 2>&1 &
SERVER_PID=$!
sleep 2

# Open test page in browser
echo "🌐 Opening test page in browser..."
if [[ "$OSTYPE" == "darwin"* ]]; then
    open "http://localhost:8080/portfolio-simulator-test.html"
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    xdg-open "http://localhost:8080/portfolio-simulator-test.html"
else
    start "http://localhost:8080/portfolio-simulator-test.html"
fi

echo ""
echo "📋 Test Instructions:"
echo "1. Click 'Add Property' - Verify metrics update immediately"
echo "2. Click 'Add Snapshot' - Verify timeline shows snapshot"
echo "3. Click 'Simulate Page Refresh' - Verify timeline persists"
echo "4. Check console for success messages"
echo ""
echo "✅ Expected Behavior:"
echo "- All metrics should update immediately when adding properties"
echo "- Timeline should show all events (properties, snapshots)"
echo "- Timeline should persist after page refresh"
echo "- Console should show green success messages"
echo ""

# Run Playwright test if available
if command -v npx &> /dev/null && [ -f "tests/e2e/portfolio-timeline-test.spec.js" ]; then
    echo "🎭 Running automated Playwright tests..."
    echo ""
    npx playwright test tests/e2e/portfolio-timeline-test.spec.js --reporter=list || true
else
    echo "ℹ️  Playwright not installed. Run 'npm install -D @playwright/test' to enable automated tests."
fi

echo ""
echo "🔗 Main Portfolio Simulator: http://localhost:8080/portfolio-simulator.html"
echo ""
echo "Press Ctrl+C to stop the server..."

# Wait for user to stop
trap "kill $SERVER_PID 2>/dev/null; echo ''; echo '🛑 Server stopped.'; exit" INT
wait