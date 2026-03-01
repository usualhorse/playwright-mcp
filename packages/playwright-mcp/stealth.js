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

async function createStealthContext(options = {}) {
  const launchOptions = {
    headless: options.headless !== false,
    ...options.launchOptions
  };
  // Use playwright-extra chromium to launch the context
  const context = await chromium.launchPersistentContext(options.userDataDir || '', {
    ...launchOptions,
    ...options.contextOptions
  });
  return context;
}

module.exports = { createStealthContext };
