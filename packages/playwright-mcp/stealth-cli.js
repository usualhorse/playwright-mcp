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

const path = require('path');

// We need to reach deep into the playwright package.
// Node's "exports" in package.json will block direct require('playwright/lib/...')
// so we resolve the absolute path to the playwright package first.
const playwrightPath = path.dirname(require.resolve('playwright/package.json'));

const { program } = require('playwright-core/lib/utilsBundle');
const { decorateMCPCommand } = require(path.join(playwrightPath, 'lib/mcp/program'));
const { chromium } = require('playwright-extra');
const stealth = require('puppeteer-extra-plugin-stealth')();
chromium.use(stealth);

const packageJSON = require('./package.json');
const p = program.version('Version ' + packageJSON.version).name('Playwright MCP (Stealth)');

decorateMCPCommand(p, packageJSON.version);

// We replace the action handler with our own that uses the stealth factory
p._actionHandler = async options => {
  const { resolveCLIConfig } = require(path.join(playwrightPath, 'lib/mcp/browser/config'));
  const { BrowserServerBackend } = require(path.join(playwrightPath, 'lib/mcp/browser/browserServerBackend'));
  const mcpServer = require(path.join(playwrightPath, 'lib/mcp/sdk/server'));
  const { setupExitWatchdog } = require(path.join(playwrightPath, 'lib/mcp/browser/watchdog'));

  setupExitWatchdog();
  const config = await resolveCLIConfig(options);

  // If no browser is specified, or if it's chromium, we ensure no channel is set
  // so that it uses the bundled chromium instead of looking for 'chrome'
  if (config.browser.browserName === 'chromium' && config.browser.launchOptions.channel === 'chrome') {
    delete config.browser.launchOptions.channel;
  }

  // Custom Stealth Factory
  const stealthFactory = {
    async createContext() {
      const context = await chromium.launchPersistentContext(config.browser.userDataDir || '', {
        ...config.browser.launchOptions,
        ...config.browser.contextOptions,
        handleSIGINT: false,
        handleSIGTERM: false,
      });
      return {
        browserContext: context,
        close: () => context.close()
      };
    }
  };

  const factory = {
    name: 'Playwright (Stealth)',
    nameInConfig: 'playwright',
    version: packageJSON.version,
    create: () => new BrowserServerBackend(config, stealthFactory)
  };

  await mcpServer.start(factory, config.server);
};

void program.parseAsync(process.argv);
