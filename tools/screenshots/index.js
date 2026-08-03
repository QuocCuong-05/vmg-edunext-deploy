import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const env = {};
for (const line of fs.readFileSync(path.join(__dirname, '.env.local'), 'utf8').split('\n')) {
  const i = line.indexOf('=');
  if (i > 0) env[line.slice(0, i).trim()] = line.slice(i + 1).trim();
}

const BASE_URL = env.BASE_URL || 'http://localhost:5173';
const EMAIL = env.TEST_EMAIL;
const PASSWORD = env.TEST_PASSWORD;
const OUT = path.join(__dirname, 'shots');

const PUBLIC_PAGES = [
  { path: '/', name: 'landing' },
  { path: '/login', name: 'login' },
];

const AUTH_PAGES = [
  { path: '/dashboard', name: 'dashboard' },
  { path: '/courses', name: 'courses' },
  { path: '/quiz', name: 'quiz' },
  { path: '/community', name: 'community' },
  { path: '/vimi', name: 'vimi' },
  { path: '/certificate', name: 'certificate' },
  { path: '/rewards', name: 'rewards' },
  { path: '/ranking', name: 'ranking' },
  { path: '/level', name: 'level' },
  { path: '/wordbook', name: 'wordbook' },
  { path: '/planner', name: 'planner' },
  { path: '/booking', name: 'booking' },
  { path: '/blog', name: 'blog' },
  { path: '/about', name: 'about' },
  { path: '/account', name: 'account' },
  { path: '/password', name: 'password' },
];

const DARK_PAGES = ['community', 'certificate', 'dashboard'];

const VIEWPORTS = [
  { w: 320, h: 568, label: '320', mobile: true },
  { w: 375, h: 667, label: '375', mobile: true },
  { w: 390, h: 844, label: '390', mobile: true },
  { w: 412, h: 915, label: '412', mobile: true },
  { w: 430, h: 932, label: '430', mobile: true },
  { w: 600, h: 1024, label: '600', mobile: false },
  { w: 768, h: 1024, label: '768', mobile: false },
  { w: 1024, h: 768, label: '1024', mobile: false },
  { w: 1280, h: 800, label: '1280', mobile: false },
  { w: 1440, h: 900, label: '1440', mobile: false },
];

async function loginAndSaveState(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 800 } });
  const page = await ctx.newPage();
  await page.goto(`${BASE_URL}/login`, { waitUntil: 'load' });
  await page.fill('input[type="email"]', EMAIL);
  await page.fill('input[type="password"]', PASSWORD);
  await Promise.all([
    page.waitForURL('**/dashboard', { timeout: 15000 }).catch(() => {}),
    page.click('button[type="submit"]'),
  ]);
  await page.waitForTimeout(1500);
  const state = await ctx.storageState();
  fs.writeFileSync(path.join(__dirname, '.state.json'), JSON.stringify(state));
  await ctx.close();
  console.log('login done, state saved');
}

const REPORT = [];

async function setThemeSafe(page, dark) {
  try {
    await page.evaluate(t => { try { localStorage.setItem('vmg_theme', t); } catch {} }, dark ? 'dark' : 'light');
  } catch {}
}

async function auditLayout(page, label, name) {
  try {
    const report = await page.evaluate(() => {
    const vw = document.documentElement.clientWidth;
    const aside = document.querySelector('aside');
    const main = document.querySelector('main');
    const asideW = aside ? Math.round(aside.getBoundingClientRect().width) : 0;
    const mainW = main ? Math.round(main.getBoundingClientRect().width) : 0;
    const offenders = [];
    for (const el of document.querySelectorAll('div, section, table, select, button')) {
      if (el.children.length > 30) continue;
      const r = el.getBoundingClientRect();
      if (r.width > 0 && r.right > vw + 1) {
        const cls = el.className && typeof el.className === 'string' ? `.${el.className.split(' ')[0]}` : el.tagName.toLowerCase();
        const txt = (el.textContent || '').trim().slice(0, 22).replace(/\s+/g, ' ');
        offenders.push(`${cls} right=${Math.round(r.right)} "${txt}"`);
      }
    }
    return { vw, asideW, mainW, offenders: offenders.slice(0, 5) };
  });
  const crushed = report.asideW > 0 && report.mainW < report.vw * 0.5;
  REPORT.push({ page: name, viewport: label, ...report, crushed });
  if (crushed) {
    console.log(`  ⚠ ${name} @${label}px: aside=${report.asideW} main=${report.mainW} vw=${report.vw} (bóp nát)`);
  }
  report.offenders.forEach(o => console.log(`      → ${o}`));
  } catch {}
}

async function main() {
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();

  const statePath = path.join(__dirname, '.state.json');
  if (!fs.existsSync(statePath)) {
    await loginAndSaveState(browser);
  }

  const state = JSON.parse(fs.readFileSync(statePath, 'utf8'));
  let shots = 0;

  for (const vp of VIEWPORTS) {
    const context = await browser.newContext({
      viewport: { width: vp.w, height: vp.h },
      deviceScaleFactor: vp.mobile ? 2 : 1,
      isMobile: vp.mobile,
      hasTouch: vp.mobile,
      storageState: state,
    });
    const page = await context.newPage();

    for (const p of PUBLIC_PAGES) {
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'load' }).catch(() => {});
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `${p.name}-${vp.label}.png`) });
      await auditLayout(page, vp.label, p.name);
      shots++;
    }

    for (const p of AUTH_PAGES) {
      const dark = DARK_PAGES.includes(p.name);
      await setThemeSafe(page, dark);
      await page.goto(`${BASE_URL}${p.path}`, { waitUntil: 'load' }).catch(() => {});
      await page.waitForTimeout(900);
      await page.screenshot({ path: path.join(OUT, `${p.name}-${vp.label}${dark ? '-dark' : ''}.png`) });
      await auditLayout(page, vp.label, p.name + (dark ? '-dark' : ''));
      shots++;
    }

    await context.close();
    console.log(`done ${vp.label}px (${shots} shots so far)`);
  }

  fs.writeFileSync(path.join(__dirname, 'overflow-report.json'), JSON.stringify(REPORT, null, 2));
  const summary = REPORT.filter(r => r.crushed || r.offenders.length);
  console.log(`ISSUES: ${summary.length}/${REPORT.length}`);
  await browser.close();
  console.log(`TOTAL ${shots} shots in ${OUT}`);
}

main().catch(e => { console.error(e); process.exit(1); });
