/* global process */
import { spawn } from 'child_process';
import puppeteer from 'puppeteer';
import http from 'http';
import fs from 'fs';
import path from 'path';

const APP_URL = 'http://localhost:5173';
let devServerProcess = null;

// Wait for a URL to be responsive
function waitForServer(url, timeoutMs = 15000) {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();
    const interval = setInterval(() => {
      if (Date.now() - startTime > timeoutMs) {
        clearInterval(interval);
        reject(new Error(`Timeout waiting for server at ${url}`));
        return;
      }

      http.get(url, (res) => {
        if (res.statusCode === 200) {
          clearInterval(interval);
          resolve();
        }
      }).on('error', () => {
        // Ignore error and retry
      });
    }, 500);
  });
}

async function runTests() {
  console.log('🚀 Starting E2E Puppeteer Integration Tests for Smart Training System (osos)...');

  // 1. Spawn Vite dev server
  console.log('📦 Spawning Vite dev server...');
  devServerProcess = spawn('npx', ['vite'], {
    shell: true,
    stdio: 'inherit',
    cwd: process.cwd()
  });

  // Ensure screenshots directory exists
  const screenshotsDir = path.join(process.cwd(), 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir);
  }

  let browser = null;

  try {
    // 2. Wait for server to boot
    console.log(`⏳ Waiting for Vite server to start on ${APP_URL}...`);
    await waitForServer(APP_URL);
    console.log('✅ Vite server is up and running!');

    // 3. Launch Puppeteer
    console.log('🌐 Launching headless browser...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    const page = await browser.newPage();
    // Set viewport for consistent layouts
    await page.setViewport({ width: 1280, height: 800 });

    // 4. Navigate to Login Page
    console.log(`📍 Navigating to login page: ${APP_URL}/login`);
    await page.goto(`${APP_URL}/login`, { waitUntil: 'networkidle2' });

    // Verify Title / Logo exists
    console.log('🔍 Checking login page elements...');
    const logoImg = await page.$('img[alt="أسس مدار الرؤية"]');
    if (logoImg) {
      console.log('✅ Company logo found');
    } else {
      console.warn('⚠️ Warning: Company logo not found');
    }

    // 5. Fill out Login Form
    console.log('🔑 Filling in admin credentials...');
    await page.waitForSelector('input#username');
    await page.type('input#username', 'admin@test.sa');
    await page.type('input#password', 'Aa123456');

    // Screenshot login state
    await page.screenshot({ path: path.join(screenshotsDir, '01_login_page_filled.png') });

    // 6. Submit Form
    console.log('☝️ Clicking login button...');
    await page.click('button[type="submit"]');

    // Wait for client-side routing to complete the redirect to Company Selection
    console.log('⏳ Waiting for authentication and redirect to /admin/company-selection...');
    await page.waitForFunction(
      () => window.location.href.includes('/admin/company-selection'),
      { timeout: 15000 }
    );

    const currentUrl = page.url();
    console.log(`📍 Navigated to: ${currentUrl}`);
    console.log('✅ Logged in successfully! Reached company selection page.');

    await page.screenshot({ path: path.join(screenshotsDir, '02_company_selection.png') });

    // 7. Select a Company
    console.log('🏢 Selecting a company branch...');
    // Wait for the company selection cards to render by checking for a button containing "اختيار"
    console.log('⏳ Waiting for companies to load and render...');
    await page.waitForFunction(
      () => {
        const buttons = Array.from(document.querySelectorAll('button'));
        return buttons.some(b => b.textContent.includes('اختيار'));
      },
      { timeout: 15000 }
    );
    
    // Find and click the select button "اختيار"
    const buttons = await page.$$('button');
    let selected = false;
    for (const button of buttons) {
      const text = await page.evaluate(el => el.textContent, button);
      if (text.includes('اختيار')) {
        console.log('👉 Clicked "اختيار" button to select the company');
        // Take a screenshot right before clicking
        await page.screenshot({ path: path.join(screenshotsDir, '02_company_selection_loaded.png') });
        await button.click();
        selected = true;
        break;
      }
    }

    if (!selected) {
      throw new Error('Could not find a company "اختيار" button to click.');
    }

    // Wait for redirect to admin dashboard
    console.log('⏳ Waiting for redirect to dashboard...');
    await page.waitForFunction(
      () => window.location.href.includes('/admin/dashboard'),
      { timeout: 10000 }
    );
    console.log(`📍 Navigated to: ${page.url()}`);
    console.log('✅ Reached admin dashboard successfully!');

    await page.screenshot({ path: path.join(screenshotsDir, '03_admin_dashboard.png') });

    // 8. Go to Employees List
    console.log('👥 Navigating to Employees List...');
    await page.waitForSelector('a[href="/admin/employees"]');
    await page.click('a[href="/admin/employees"]');
    await page.waitForSelector('table');
    console.log('✅ Employees list table loaded successfully!');
    await page.screenshot({ path: path.join(screenshotsDir, '04_employees_list.png') });

    // 9. Go to Daily Attendance
    console.log('📅 Navigating to Daily Attendance...');
    await page.waitForSelector('a[href="/admin/attendance"]');
    await page.click('a[href="/admin/attendance"]');
    await page.waitForSelector('table');
    console.log('✅ Daily Attendance table loaded successfully!');
    await page.screenshot({ path: path.join(screenshotsDir, '05_daily_attendance.png') });

    // 10. Go to Monthly Reports
    console.log('📊 Navigating to Monthly Reports...');
    await page.waitForSelector('a[href="/admin/reports"]');
    await page.click('a[href="/admin/reports"]');
    await page.waitForSelector('table');
    console.log('✅ Monthly Reports table loaded successfully!');
    await page.screenshot({ path: path.join(screenshotsDir, '06_monthly_reports.png') });

    console.log('🎉 E2E Puppeteer integration test suite ran successfully!');
    console.log('🎉 All core user journeys and views verified with 100% SUCCESS!');

  } catch (error) {
    console.error('❌ E2E Test Suite FAILED:');
    console.error(error);
    if (browser) {
      const page = (await browser.pages())[0];
      if (page) {
        const errScreenshot = path.join(screenshotsDir, 'error_failure.png');
        await page.screenshot({ path: errScreenshot });
        console.log(`📸 Failure screenshot captured and saved to ${errScreenshot}`);
      }
    }
    process.exitCode = 1;
  } finally {
    if (browser) {
      console.log('🔌 Closing browser...');
      await browser.close();
    }
    if (devServerProcess) {
      console.log('🔌 Killing Vite dev server...');
      devServerProcess.kill();
    }
    console.log('🏁 Integration tests finished.');
  }
}

runTests();
