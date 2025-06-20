# Codebase Cleanup Recommendations

## ✅ Completed Cleanup Actions

### Test Files Organization
- Moved all `test-*.html` files to `/tests/manual-test-pages/`
- Moved all `test-*.js`, `verify-*.js`, and `debug-*.js` files to `/tests/standalone-scripts/`
- Archived all test screenshots to `/tests/screenshots-archive/`
- Created test structure documentation at `/tests/TEST_STRUCTURE.md`

### Documentation Organization
- Created `/docs/deployment/` for deployment-related docs
- Created `/docs/testing/` for test-related documentation
- Created `/docs/archive/` for older documentation
- Created documentation index at `/docs/INDEX.md`

## 🔍 Files to Review for Potential Removal

### Potentially Duplicate Test Files
These files might duplicate functionality already in the organized test suite:
- `/tests/standalone-scripts/test-local.js` - Appears to be a local test runner
- `/tests/standalone-scripts/test-anthropic-key.js` - API key test
- Multiple `test-live-*.js` files that might test similar functionality

### Temporary/Debug Files
- `portfolio-simulator-test.html` - Standalone test page (consider moving to tests)
- Files currently marked as untracked in git (check git status)

### Old Test Reports
- `/playwright-report/` - Contains old test run data
- `/playwright-report-live/` - Another test report directory
- `/test-results/` - Failed test artifacts (videos and screenshots)

## 📋 Recommended Actions

1. **Review Standalone Test Scripts**
   - Check if `/tests/standalone-scripts/` files are still needed
   - Consider converting useful ones to proper Playwright tests
   - Remove obsolete ones

2. **Clean Test Reports**
   ```bash
   # Remove old test reports (after backing up if needed)
   rm -rf playwright-report/ playwright-report-live/
   ```

3. **Archive Old Test Results**
   ```bash
   # Move to archive or remove old test results
   mv test-results/ tests/archive/test-results-old/
   ```

4. **Update .gitignore**
   Add these entries to prevent test artifacts from being committed:
   ```
   # Test artifacts
   playwright-report/
   playwright-report-live/
   test-results/
   tests/screenshots-archive/
   *.png
   ```

5. **Remove Untracked Files**
   Review files shown in `git status` and decide whether to:
   - Add to git (if they should be tracked)
   - Add to .gitignore (if they're generated)
   - Delete (if they're no longer needed)

## 🚀 Next Steps

1. Run `git status` to see current untracked files
2. Review each category of files listed above
3. Back up any important data before deletion
4. Update .gitignore to prevent future clutter
5. Consider setting up automated cleanup in CI/CD pipeline