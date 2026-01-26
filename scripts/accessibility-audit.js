/**
 * Automated Accessibility Audit Script
 *
 * Runs axe-core accessibility checks against V2 pages.
 * WCAG 2.1 AA compliance verification.
 */

import { chromium } from 'playwright';
import AxeBuilder from '@axe-core/playwright';

const BASE_URL = 'http://localhost:3001';

// Pages to test
const PAGES = [
  { name: 'Dashboard', path: '/app' },
  { name: 'Athletes', path: '/app/athletes' },
  { name: 'Erg Data', path: '/app/erg-tests' },
  { name: 'Lineups', path: '/app/coach/lineup-builder' },
  { name: 'Seat Racing', path: '/app/coach/seat-racing' },
  { name: 'Training', path: '/app/coach/training' },
  { name: 'Regattas', path: '/app/regattas' },
  { name: 'Settings', path: '/app/settings' },
];

async function runAudit() {
  console.log('Starting Accessibility Audit...\n');
  console.log('Standard: WCAG 2.1 AA');
  console.log('Tool: axe-core via Playwright\n');
  console.log('='.repeat(60) + '\n');

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  const results = [];

  for (const pageConfig of PAGES) {
    console.log(`Testing: ${pageConfig.name} (${pageConfig.path})`);

    try {
      // Navigate to page
      await page.goto(`${BASE_URL}${pageConfig.path}`, {
        waitUntil: 'networkidle',
        timeout: 30000
      });

      // Wait a bit for React hydration
      await page.waitForTimeout(1000);

      // Run axe analysis
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
        .analyze();

      const violations = accessibilityScanResults.violations;
      const critical = violations.filter(v => v.impact === 'critical').length;
      const serious = violations.filter(v => v.impact === 'serious').length;
      const moderate = violations.filter(v => v.impact === 'moderate').length;
      const minor = violations.filter(v => v.impact === 'minor').length;

      results.push({
        page: pageConfig.name,
        critical,
        serious,
        moderate,
        minor,
        violations
      });

      console.log(`  Critical: ${critical} | Serious: ${serious} | Moderate: ${moderate} | Minor: ${minor}`);

      // Log any critical/serious issues
      violations
        .filter(v => v.impact === 'critical' || v.impact === 'serious')
        .forEach(v => {
          console.log(`  [${v.impact.toUpperCase()}] ${v.id}: ${v.help}`);
          v.nodes.forEach(n => {
            console.log(`    - ${n.html.substring(0, 100)}...`);
          });
        });

    } catch (error) {
      console.log(`  ERROR: ${error.message}`);
      results.push({
        page: pageConfig.name,
        error: error.message
      });
    }

    console.log('');
  }

  await browser.close();

  // Summary
  console.log('='.repeat(60));
  console.log('\nSUMMARY\n');
  console.log('| Page | Critical | Serious | Moderate | Minor |');
  console.log('|------|----------|---------|----------|-------|');

  let totalCritical = 0;
  let totalSerious = 0;

  results.forEach(r => {
    if (r.error) {
      console.log(`| ${r.page} | ERROR | - | - | - |`);
    } else {
      console.log(`| ${r.page} | ${r.critical} | ${r.serious} | ${r.moderate} | ${r.minor} |`);
      totalCritical += r.critical;
      totalSerious += r.serious;
    }
  });

  console.log('\n' + '='.repeat(60));

  if (totalCritical > 0 || totalSerious > 0) {
    console.log('\nSTATUS: FAIL - Critical/Serious issues found');
    console.log(`Total Critical: ${totalCritical}`);
    console.log(`Total Serious: ${totalSerious}`);
    process.exit(1);
  } else {
    console.log('\nSTATUS: PASS - No critical or serious issues');
    process.exit(0);
  }
}

runAudit().catch(err => {
  console.error('Audit failed:', err);
  process.exit(1);
});
