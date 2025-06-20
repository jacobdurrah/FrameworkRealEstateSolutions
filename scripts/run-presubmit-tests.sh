#!/bin/bash

# Presubmit test runner for Portfolio Simulator V3
# This script runs essential tests before code submission

echo "🚀 Running presubmit tests..."
echo "=============================="

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Track overall status
FAILED=0

# 1. Check for test files in root directory
echo -e "\n📁 Checking file structure..."
if ls test-*.js 2>/dev/null || ls test-*.html 2>/dev/null; then
    echo -e "${RED}❌ Test files found in root directory${NC}"
    echo "   Please move test files to appropriate directories under tests/"
    FAILED=1
else
    echo -e "${GREEN}✓ No test files in root directory${NC}"
fi

# 2. Run linter
echo -e "\n🔍 Running ESLint..."
if npm run lint > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Linting passed${NC}"
else
    echo -e "${YELLOW}⚠️  Linting warnings found${NC}"
    echo "   Run 'npm run lint' to see details"
    # Don't fail on lint warnings for now
fi

# 3. Check for console.log in production code
echo -e "\n🔍 Checking for console.log statements..."
CONSOLE_LOGS=$(grep -r "console\.log" js/ --include="*.js" --exclude="*test*" --exclude="*debug*" 2>/dev/null | wc -l)
if [ "$CONSOLE_LOGS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $CONSOLE_LOGS console.log statements in production code${NC}"
    echo "   Consider using a proper logging system"
else
    echo -e "${GREEN}✓ No console.log in production code${NC}"
fi

# 4. Check for TODO/FIXME comments
echo -e "\n🔍 Checking for TODO/FIXME comments..."
TODOS=$(grep -r "TODO\|FIXME" js/ --include="*.js" 2>/dev/null | wc -l)
if [ "$TODOS" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  Found $TODOS TODO/FIXME comments${NC}"
    echo "   Review these before major releases"
else
    echo -e "${GREEN}✓ No TODO/FIXME comments${NC}"
fi

# 5. Install dependencies if needed
if [ ! -d "node_modules" ]; then
    echo -e "\n📦 Installing dependencies..."
    npm ci
fi

# 6. Run core functionality tests
echo -e "\n🧪 Running core functionality tests..."
if npm run test:core > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Core tests passed${NC}"
else
    echo -e "${RED}❌ Core tests failed${NC}"
    echo "   Run 'npm run test:core' to see details"
    FAILED=1
fi

# 7. Run property matching tests
echo -e "\n🏠 Running property matching tests..."
if npm run test:property > /dev/null 2>&1; then
    echo -e "${GREEN}✓ Property tests passed${NC}"
else
    echo -e "${RED}❌ Property tests failed${NC}"
    echo "   Run 'npm run test:property' to see details"
    FAILED=1
fi

# 8. Check git status
echo -e "\n📋 Checking git status..."
UNSTAGED=$(git status --porcelain | grep -E "^.[^D]" | wc -l)
if [ "$UNSTAGED" -gt 0 ]; then
    echo -e "${YELLOW}⚠️  You have $UNSTAGED unstaged changes${NC}"
    echo "   Remember to stage all changes before committing"
fi

# Summary
echo -e "\n=============================="
if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✅ All presubmit checks passed!${NC}"
    echo "Ready to commit your changes."
else
    echo -e "${RED}❌ Some presubmit checks failed${NC}"
    echo "Please fix the issues above before committing."
    exit 1
fi