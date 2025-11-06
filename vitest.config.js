export default {
  test: {
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json', 'lcov'],
      lines: 85,
      functions: 85,
      branches: 75,
      statements: 85
    }
  }
};
