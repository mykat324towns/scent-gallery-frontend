// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  use: {
    baseURL: 'https://scentgallery.shop',
    storageState: 'state.json',
    trace: 'on-first-retry',
  },
});
