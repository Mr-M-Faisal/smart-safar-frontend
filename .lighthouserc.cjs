module.exports = {
  ci: {
    collect: {
      startServerCommand: 'npm run start',
      startServerReadyPattern: 'Ready in',
      startServerTimeout: 120000,
      url: ['http://127.0.0.1:3000/', 'http://127.0.0.1:3000/m', 'http://127.0.0.1:3000/m/map'],
      numberOfRuns: 1,
      settings: {
        emulatedFormFactor: 'mobile',
        throttlingMethod: 'simulate',
        chromeFlags: '--no-sandbox --disable-dev-shm-usage',
      },
    },
    assert: {
      preset: 'lighthouse:recommended',
      assertions: {
        'largest-contentful-paint': ['error', { maxNumericValue: 2500 }],
        'total-blocking-time': ['error', { maxNumericValue: 200 }],
        'resource-summary:script:size': ['error', { maxNumericValue: 170000 }],
      },
    },
    upload: { target: 'filesystem', outputDir: './lighthouse-results' },
  },
};
