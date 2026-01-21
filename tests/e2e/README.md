# PumpTracker Scheduling E2E Tests

This directory contains comprehensive end-to-end tests for the PumpTracker scheduling functionality using Playwright.

## Test Coverage

### Core Functionality Tests (`scheduling.spec.ts`)

1. **Basic Page Loading Test**
   - Verifies the scheduling page loads correctly
   - Checks main components are visible
   - Confirms URL navigation

2. **Component Visibility Test**
   - Validates sidebar with unscheduled jobs
   - Checks calendar grid and header components
   - Verifies navigation buttons are present

3. **Drag and Drop Test**
   - Tests dragging unscheduled jobs to calendar dates
   - Verifies jobs are moved from sidebar
   - Validates job persistence

4. **Event Detail Panel Test**
   - Tests clicking calendar events
   - Verifies event detail panel opens/closes
   - Checks event information display

5. **Persistence Test**
   - Tests data persistence after page refresh
   - Verifies changes survive browser reload
   - Validates local storage/session storage

6. **Navigation Test**
   - Tests switching between Dashboard, Kanban, and Scheduling views
   - Verifies URL changes and component visibility
   - Checks navigation state preservation

7. **Accessibility Checks**
   - Tests keyboard navigation
   - Validates ARIA labels and roles
   - Checks focus management

8. **Responsive Design Test**
   - Tests desktop (1200x800), tablet (768x1024), and mobile (375x667) viewports
   - Verifies component adaptation
   - Checks mobile navigation

9. **Error Handling Test**
   - Tests network error handling
   - Verifies graceful degradation
   - Checks retry mechanisms

10. **Search/Filter Test**
    - Tests job search functionality
    - Verifies filtering works correctly
    - Checks result accuracy

### Enhanced Tests (`scheduling-enhanced.spec.ts`)

1. **Complete Scheduling Workflow**
   - End-to-end job scheduling process
   - Integration test for all components
   - State management verification

2. **Multi-Job Scheduling**
   - Tests scheduling multiple jobs
   - Validates calendar cell allocation
   - Checks performance with multiple items

3. **Navigation and State Preservation**
   - Tests state retention across views
   - Verifies data persistence
   - Checks component state management

4. **Advanced Responsive Behavior**
   - Detailed viewport testing
   - Component layout verification
   - Mobile interaction patterns

5. **Keyboard Navigation**
   - Tab order verification
   - Escape key functionality
   - Enter key interactions

6. **Performance Testing**
   - Load time measurement
   - Animation smoothness
   - Transition verification

7. **Error Recovery**
   - Network failure simulation
   - Recovery mechanism testing
   - Graceful degradation

8. **Edge Cases**
   - Empty state handling
   - Large dataset performance
   - Concurrent operations

## Setup and Configuration

### Prerequisites

- Node.js installed
- Playwright browsers installed

### Installation

```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm test:e2e:install
```

### Running Tests

```bash
# Start the Vite dev server (default http://localhost:5173)
pnpm dev

# Run all tests in headless mode
pnpm test:e2e

# Run tests with visible browser
pnpm test:e2e:headed

# Run tests with Playwright Test UI
pnpm test:e2e:ui

# Run tests in debug mode
pnpm test:e2e:debug

# Generate new tests with codegen
pnpm test:e2e:codegen

# View test reports
pnpm test:e2e:report
```

### Base URL Configuration

Playwright uses the `PLAYWRIGHT_TEST_BASE_URL` environment variable to know
where your dev server is running. It defaults to `http://localhost:5173`.

```bash
# Point Playwright at a custom dev server URL
PLAYWRIGHT_TEST_BASE_URL=http://localhost:5173 pnpm test:e2e
```

### Running Specific Tests

```bash
# Run specific test file
pnpm playwright test tests/e2e/scheduling.spec.ts

# Run tests with specific pattern
pnpm playwright test --grep "drag and drop"

# Run tests in specific browser
pnpm playwright test --project=chromium
```

## Test Architecture

### Test Structure

```
tests/e2e/
├── README.md                     # This file
├── scheduling.spec.ts           # Core functionality tests
├── scheduling-enhanced.spec.ts  # Enhanced and edge case tests
├── helpers/
│   └── test-utils.ts           # Test utilities and helpers
└── fixtures/
    └── test-fixtures.ts        # Custom test fixtures
```

### Key Components

#### SchedulingPageHelper (`helpers/test-utils.ts`)

Utility class providing methods for:
- Navigation between views
- Component interaction
- Data extraction
- Drag and drop operations
- State validation

#### Test Fixtures (`fixtures/test-fixtures.ts`)

Custom Playwright fixtures providing:
- Configured test environment
- Helper class instances
- Test configuration constants
- Common test utilities

#### Test Data

Predefined test data for:
- Pump models
- Priority levels
- Customer names
- Random data generation

## Best Practices

### Test Design

1. **Atomic Tests**: Each test should be independent and self-contained
2. **Clear Assertions**: Use descriptive assertions that clearly state expectations
3. **Proper Waits**: Use appropriate waits for dynamic content
4. **Error Handling**: Include proper error handling for edge cases
5. **Cleanup**: Ensure tests clean up after themselves

### Selectors

1. **Prioritize data-testid**: Use `data-testid` attributes for reliable selectors
2. **Use semantic selectors**: Prefer semantic HTML selectors over CSS classes
3. **Avoid brittle selectors**: Don't rely on implementation details
4. **Consistent naming**: Use consistent naming patterns across tests

### Performance

1. **Parallel execution**: Tests run in parallel by default
2. **Reuse browser state**: Use fixtures to avoid repeated setup
3. **Minimal waits**: Use specific waits instead of fixed timeouts
4. **Efficient selectors**: Use efficient CSS selectors

### Debugging

1. **Use debug mode**: Run tests with `--debug` flag for step-by-step execution
2. **Screenshots**: Tests automatically capture screenshots on failure
3. **Traces**: Use trace viewer for detailed debugging
4. **Console logs**: Check browser console for additional error information

## Troubleshooting

### Common Issues

1. **Tests fail to find elements**
   - Verify the application is running on localhost:3000
   - Check if selectors match current implementation
   - Ensure proper waits are in place

2. **Drag and drop issues**
   - Verify DnD implementation uses proper HTML5 drag events
   - Check if elements have proper draggable attributes
   - Ensure drop zones are properly configured

3. **Timeout errors**
   - Increase timeout values in test configuration
   - Check if application is loading slowly
   - Verify network requests are completing

4. **Browser launch failures**
   - Run `npm run test:e2e:install` to install browsers
   - Check system dependencies
   - Verify permissions for browser installation

### Debug Mode

```bash
# Run specific test in debug mode
npx playwright test --debug tests/e2e/scheduling.spec.ts -g "drag and drop"

# Run with visible browser for manual inspection
npx playwright test --headed --project=chromium
```

### Test Reports

After running tests, view detailed reports:

```bash
npm run test:e2e:report
```

Reports include:
- Test results and screenshots
- Video recordings of test runs
- Trace files for detailed debugging
- Performance metrics

## Contributing

When adding new tests:

1. Follow existing test structure and patterns
2. Use helper classes for common operations
3. Include both positive and negative test cases
4. Add proper assertions and error handling
5. Update documentation as needed

## Configuration

The Playwright configuration (`playwright.config.ts`) includes:

- **Browsers**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Timeouts**: Configurable timeouts for different operations
- **Retry Logic**: Automatic retry on CI
- **Reporting**: HTML reports with screenshots and traces
- **Web Server**: Automatic dev server startup for tests

Modify configuration as needed for your testing requirements.
