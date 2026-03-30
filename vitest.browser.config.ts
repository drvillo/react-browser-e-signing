import { defineConfig } from 'vitest/config'
import { playwright } from '@vitest/browser-playwright'
import { chromium } from 'playwright'
import { existsSync } from 'node:fs'

const chromiumExecutablePath = chromium.executablePath()
const resolvedChromiumExecutablePath =
  process.arch === 'arm64'
    ? chromiumExecutablePath.replace('mac-x64', 'mac-arm64')
    : chromiumExecutablePath
const hasChromiumExecutable = existsSync(resolvedChromiumExecutablePath)

export default defineConfig({
  test: {
    include: hasChromiumExecutable ? ['test/browser/**/*.test.{ts,tsx}'] : [],
    passWithNoTests: true,
    browser: hasChromiumExecutable
      ? {
          enabled: true,
          provider: playwright({
            launchOptions: {
              executablePath: resolvedChromiumExecutablePath,
              headless: true,
            },
          }),
          instances: [{ browser: 'chromium' }],
        }
      : undefined,
  },
})
