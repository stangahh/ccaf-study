// @ts-check
const { defineConfig, devices } = require('@playwright/test');
const path = require('path');

module.exports = defineConfig({
  testDir: './tests',
  timeout: 30000,
  reporter: 'list',
  use: {
    baseURL: `file://${path.resolve(__dirname)}`,
    headless: true,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
