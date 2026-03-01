#!/usr/bin/env node
/**
 * Copyright (c) Microsoft Corporation.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const { createConnection } = require('playwright/lib/mcp/index');

/**
 * Enhanced createConnection that uses playwright-extra with the stealth plugin.
 */
async function createStealthConnection(config = {}, contextGetter) {
  // If no contextGetter is provided, we provide one that uses stealth
  const stealthContextGetter = contextGetter || (async () => {
    // We use the config to determine launch options if needed
    const launchOptions = {
      headless: config.browser?.launchOptions?.headless !== false,
      ...config.browser?.launchOptions
    };
    return await chromium.launchPersistentContext(config.browser?.userDataDir || '', {
      ...launchOptions,
      ...config.browser?.contextOptions
    });
  });

  return createConnection(config, stealthContextGetter);
}

module.exports = { createConnection: createStealthConnection };
