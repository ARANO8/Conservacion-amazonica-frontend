import { defineConfig, devices } from '@playwright/test';

/**
 * Pruebas E2E contra los servidores de desarrollo ya levantados (backend en
 * 3000, frontend en 3001) y la base de Docker. Usa el Chrome instalado, así
 * que no hace falta descargar navegadores.
 */
export default defineConfig({
  testDir: './e2e',
  globalSetup: './e2e/global-setup.ts',
  globalTeardown: './e2e/global-teardown.ts',
  // Los casos comparten la base: uno a la vez
  fullyParallel: false,
  workers: 1,
  retries: 0,
  // El servidor de desarrollo compila cada página la primera vez
  timeout: 5 * 60_000,
  expect: { timeout: 20_000 },
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: process.env.E2E_FRONT_URL ?? 'http://localhost:3001',
    navigationTimeout: 90_000,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  projects: [
    {
      name: 'chrome',
      use: {
        ...devices['Desktop Chrome'],
        channel: 'chrome',
        viewport: { width: 1440, height: 900 },
      },
    },
  ],
});
