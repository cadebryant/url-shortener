# 🧪 URL Shortener Test Suite

This directory contains comprehensive unit and integration tests for the URL shortener application.

## 📁 Test Structure

```
tests/
├── simple.test.ts          # Basic utility function tests
├── functional.test.ts      # End-to-end functional tests
├── utils/
│   └── testDatabase.ts     # Database testing utilities
└── README.md              # This file
```

## 🚀 Running Tests

### All Tests
```bash
npm test
```

### Watch Mode
```bash
npm run test:watch
```

### Coverage Report
```bash
npm run test:coverage
```

## 📊 Test Coverage

The test suite covers:

### ✅ **Simple Tests** (`simple.test.ts`)
- **URL Validation**: Tests valid and invalid URL formats
- **Short Code Generation**: Tests unique code generation
- **API Response Format**: Validates response structure
- **Error Handling**: Tests input validation
- **Database Schema**: Validates data types and structure

### ✅ **Functional Tests** (`functional.test.ts`)
- **URL Shortening**: End-to-end URL shortening flow
- **URL Statistics**: Click tracking and analytics
- **URL Redirection**: Redirect functionality
- **Click Tracking**: Increment counter on redirect
- **Duplicate Handling**: Same short code for duplicate URLs
- **Error Scenarios**: Invalid inputs and missing data

## 🎯 Test Categories

### **Unit Tests**
- Individual function testing
- Input validation
- Response format validation
- Error handling

### **Integration Tests**
- Database operations
- API endpoint testing
- Full user workflows
- Cross-component interactions

### **Functional Tests**
- End-to-end scenarios
- Real database operations
- HTTP request/response cycles
- Business logic validation

## 📈 Test Results

```
✅ Test Suites: 2 passed, 2 total
✅ Tests: 19 passed, 19 total
✅ Snapshots: 0 total
✅ Time: ~3.7s
```

## 🔧 Test Configuration

### Jest Configuration (`jest.config.js`)
- TypeScript support with `ts-jest`
- Node.js test environment
- Coverage reporting
- Custom test patterns

### Test Database
- Isolated SQLite database for each test
- Automatic cleanup between tests
- Real database operations
- No mocking of database layer

## 🛠️ Adding New Tests

### 1. **Unit Tests**
```typescript
describe('Feature Name', () => {
  it('should do something', () => {
    // Test implementation
  });
});
```

### 2. **Integration Tests**
```typescript
describe('API Integration', () => {
  it('should handle full workflow', async () => {
    // Test with real database
  });
});
```

### 3. **Database Tests**
```typescript
describe('Database Operations', () => {
  it('should persist data correctly', async () => {
    // Test database operations
  });
});
```

## 🚨 Test Best Practices

### **Do:**
- ✅ Test both success and failure scenarios
- ✅ Use descriptive test names
- ✅ Clean up after each test
- ✅ Test edge cases and error conditions
- ✅ Use real database for integration tests

### **Don't:**
- ❌ Mock everything (use real database for integration)
- ❌ Write tests that depend on each other
- ❌ Leave test data in the database
- ❌ Skip error scenario testing

## 📝 Test Commands

| Command | Description |
|---------|-------------|
| `npm test` | Run all tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run test:coverage` | Run tests with coverage report |
| `npm run test -- --verbose` | Run tests with detailed output |

## 🎉 Test Success Criteria

- ✅ All tests pass
- ✅ No test dependencies
- ✅ Clean database state
- ✅ Comprehensive coverage
- ✅ Fast execution (< 5 seconds)
- ✅ Clear error messages

## 🔍 Debugging Tests

### **Common Issues:**
1. **Database locked**: Ensure previous tests clean up properly
2. **Port conflicts**: Tests use different ports than production
3. **Async operations**: Use proper async/await patterns
4. **Type errors**: Add proper TypeScript types

### **Debug Commands:**
```bash
# Run specific test file
npm test -- tests/simple.test.ts

# Run with verbose output
npm test -- --verbose

# Run single test
npm test -- --testNamePattern="should validate URLs"
```

---

**Happy Testing! 🧪✨**
