// Browser-only visual/interaction regression checks. All API calls use local fixtures.
// Run against `npm run dev` or `npm run preview`; see README.md for setup.
import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { setTimeout as delay } from 'node:timers/promises';
const { chromium } = await import(process.env.PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.UI_BASE_URL || 'http://127.0.0.1:4173';
const artifacts = process.env.UI_ARTIFACT_DIR || '/tmp/fitlife-ui-artifacts';
await mkdir(artifacts, { recursive: true });
const browser = await chromium.launch({ headless: true });
const errors = [];
let checks = 0;

const plans = [
  { name: 'MONTHLY', price: 1350 },
  { name: 'QUARTERLY', price: 2500 },
  { name: 'YEARLY', price: 6000 },
];
const member = { id: 1, name: 'Sample Member', age: 28, phone: '0000000000', membershipType: 'QUARTERLY', membershipStartDate: '2026-01-01', membershipEndDate: '2099-04-01', trainerId: 1 };
const trainer = { id: 1, trainerId: 1, name: 'Sample Trainer', specialty: 'Strength', email: 'trainer@example.test' };
const owner = { id: 1, displayName: 'Sample Owner', fullName: 'Sample Owner', email: 'owner@example.test', role: 'OWNER' };
const payment = { paymentId: 1, memberId: 1, memberName: member.name, amount: 2500, paymentDate: '2026-01-01', paymentMethod: 'CASH', paymentStatus: 'PAID' };

async function makePage(options = {}) {
  const page = await browser.newPage({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  page.on('pageerror', error => errors.push(error.message));
  await page.route('**/*', async route => {
    const path = new URL(route.request().url()).pathname.replace(/^\/api(?=\/)/, '');
    if (!/^\/(members|trainers|payments|user|dashboard)(\/|$)/.test(path)) return route.continue();
    let data;
    let status = 200;
    if (path === '/members/plans') {
      if (options.waitForPlans) await options.waitForPlans;
      status = options.planFailure ? 503 : 200;
      data = options.emptyPlans ? [] : plans;
    } else if (path === '/user/login') {
      status = options.rejectLogin ? 400 : 200;
      data = options.rejectLogin ? { message: 'Please check your email and password.' } : { ...owner, token: 'ui-fixture-token', sessionExpiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString() };
    } else if (path === '/user/logout') data = {};
    else if (path === '/dashboard') data = { totalMembers: 1, totalTrainers: 1, totalUsers: 1, totalRevenue: 2500 };
    else if (path === '/members') data = route.request().method() === 'POST' ? { ...route.request().postDataJSON(), id: 2 } : options.emptyWorkspace ? [] : [member];
    else if (path === '/members/my-profile') data = member;
    else if (path === '/members/my-members') data = [member];
    else if (path === '/trainers/my-profile') data = trainer;
    else if (path === '/trainers') data = [trainer];
    else if (path === '/payments' || path === '/payments/my-payment') data = options.emptyWorkspace ? [] : [payment];
    else if (path === '/user/profile') data = { ...owner, role: options.role || 'OWNER', ...((options.role === 'MEMBER') ? member : {}) };
    else if (path === '/user') data = [owner];
    else return route.fulfill({ status: 404, json: { message: 'Unconfigured UI test fixture' } });
    await route.fulfill({ status, json: data });
  });
  return page;
}

async function noOverflow(page, label) {
  const dimensions = await page.evaluate(() => ({ content: document.documentElement.scrollWidth, viewport: document.documentElement.clientWidth }));
  assert.ok(dimensions.content <= dimensions.viewport + 1, `${label} overflows: ${JSON.stringify(dimensions)}`);
  checks++;
}
async function visible(locator, label) {
  await locator.waitFor({ state: 'visible' });
  assert.ok(await locator.isVisible(), label);
  checks++;
}
async function screenshot(page, name) {
  await page.screenshot({ path: `${artifacts}/${name}.png`, fullPage: true });
}

try {
  let releasePlans;
  const options = { waitForPlans: new Promise(resolve => { releasePlans = resolve; }), rejectLogin: true };
  const page = await makePage(options);
  await page.goto(baseURL);
  await visible(page.getByRole('heading', { name: 'Your best self. Built here.' }), 'hero');
  await visible(page.getByText('Loading membership plans...'), 'plan loading state');
  releasePlans();
  await visible(page.locator('.membership-card').nth(2), 'three membership plans');
  assert.match(await page.locator('.membership-card').first().innerText(), /1,350/);
  checks++;
  await page.evaluate(() => document.fonts.ready);
  for (const width of [1440, 1024, 768, 620, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await noOverflow(page, `landing ${width}px`);
    if (width === 1440 || width === 390) await screenshot(page, `landing-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  const toggle = page.locator('.mobile-menu-button');
  await toggle.click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'true');
  await page.keyboard.press('Escape');
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  assert.ok(await toggle.evaluate(element => element === document.activeElement));
  checks++;
  await toggle.click();
  await page.getByRole('navigation', { name: 'Mobile navigation', exact: true }).getByRole('link', { name: 'Membership' }).click();
  assert.equal(await toggle.getAttribute('aria-expanded'), 'false');
  checks++;
  await page.getByRole('button', { name: /Expert coaches/ }).click();
  await visible(page.locator('.stage-coaches'), 'method click changes panel');
  await page.getByRole('button', { name: /Progress tracking/ }).focus();
  await page.keyboard.press('Enter');
  await visible(page.locator('.stage-progress'), 'method keyboard changes panel');
  await page.locator('.membership-cta').first().click();
  await visible(page.getByRole('heading', { name: 'Welcome back.' }), 'membership sign-in flow');
  for (const width of [1440, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 960 });
    await noOverflow(page, `sign in ${width}px`);
    if (width === 1440 || width === 390) await screenshot(page, `signin-${width}`);
  }
  await visible(page.getByRole('button', { name: 'Back to website' }), 'mobile back action');
  await page.getByRole('button', { name: 'Back to website' }).click();
  await page.locator('.nav-signin').click();
  await page.getByLabel('Email address', { exact: true }).fill('owner@example.test');
  await page.getByLabel('Password', { exact: true }).fill('ui-fixture-password');
  await page.getByRole('button', { name: 'Show password' }).click();
  assert.equal(await page.getByLabel('Password', { exact: true }).getAttribute('type'), 'text');
  await page.getByRole('button', { name: 'Hide password' }).click();
  checks++;
  await page.getByRole('button', { name: 'Sign in to FitLife' }).click();
  await visible(page.getByRole('status').filter({ hasText: 'Please check your email and password.' }), 'login error notification');
  await page.getByRole('button', { name: 'Dismiss notification' }).click();
  options.rejectLogin = false;
  await page.getByRole('button', { name: 'Sign in to FitLife' }).click();
  await visible(page.locator('.owner-overview'), 'owner login');
  for (const width of [1440, 1024, 768, 390, 320]) {
    await page.setViewportSize({ width, height: 1000 });
    await noOverflow(page, `dashboard ${width}px`);
    await visible(page.getByRole('button', { name: 'Sign out' }), `sign out ${width}px`);
    if (width === 1440 || width === 390) await screenshot(page, `dashboard-${width}`);
  }
  await page.setViewportSize({ width: 390, height: 844 });
  await page.locator('.dashboard-side').getByRole('button', { name: 'Members', exact: true }).click();
  await visible(page.getByRole('heading', { name: 'Members Management' }), 'member navigation');
  await noOverflow(page, 'mobile member directory');
  await page.getByPlaceholder('Search members by name...').fill('no matching fixture');
  await visible(page.getByText('No members found', { exact: true }), 'member empty search');
  await page.getByPlaceholder('Search members by name...').fill('');
  await page.getByRole('button', { name: 'Add Member', exact: true }).click();
  await visible(page.locator('.modal'), 'member modal');
  await page.getByLabel(/^Membership plan/).selectOption('QUARTERLY');
  await page.getByLabel('Start date', { exact: true }).fill('2026-01-01');
  assert.equal(await page.getByLabel('End date', { exact: false }).inputValue(), '2026-04-01');
  checks++;
  await noOverflow(page, 'mobile member modal');
  await page.getByRole('button', { name: 'Cancel', exact: true }).click();
  for (const tab of ['Trainers', 'Payments', 'Users', 'My profile']) {
    await page.locator('.dashboard-side').getByRole('button', { name: tab, exact: true }).click();
    await delay(150);
    await noOverflow(page, `mobile ${tab}`);
  }
  await page.getByRole('button', { name: 'Sign out' }).click();
  await visible(page.getByRole('heading', { name: 'Your best self. Built here.' }), 'sign out returns to landing');
  await page.close();

  for (const [label, extra] of [['failed', { planFailure: true }], ['empty', { emptyPlans: true }]]) {
    const fallback = await makePage(extra);
    await fallback.goto(baseURL);
    await visible(fallback.locator('.membership-card').nth(2), `${label} plans fallback`);
    assert.match(await fallback.locator('.membership-card').first().innerText(), /1,200/);
    checks++;
    await fallback.close();
  }
  for (const role of ['MEMBER', 'TRAINER', 'OWNER']) {
    const rolePage = await makePage({ role, emptyWorkspace: true });
    await rolePage.addInitScript(session => localStorage.setItem('fitlife_session', JSON.stringify(session)), { ...owner, token: 'ui-fixture-token', role });
    await rolePage.setViewportSize({ width: 390, height: 844 });
    await rolePage.goto(baseURL);
    await visible(rolePage.locator(role === 'OWNER' ? '.owner-overview' : '.profile-management-card'), `${role} workspace`);
    await noOverflow(rolePage, `${role} workspace`);
    if (role === 'OWNER') await visible(rolePage.getByText('No members found yet.', { exact: true }), 'empty owner state');
    await rolePage.getByRole('button', { name: 'Sign out' }).click();
    await visible(rolePage.getByRole('heading', { name: 'Your best self. Built here.' }), `${role} logout`);
    await rolePage.close();
  }
  assert.deepEqual(errors, [], 'no browser runtime errors');
  console.log(`PASS: ${checks} UI checks; no browser runtime errors. Screenshots: ${artifacts}`);
} finally {
  await browser.close();
}
