import { chromium } from 'playwright';

const BASE = 'http://localhost:3000';
const API = 'http://localhost:8080/api/v1';
const results = [];
const check = (name, ok, extra = '') => {
  results.push(ok);
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${extra ? ' — ' + extra : ''}`);
};

const browser = await chromium.launch();
const page = await browser.newPage();
page.on('pageerror', (e) => console.log('PAGE ERROR:', e.message));

try {
  await page.goto(`${BASE}/login`);
  await page.getByLabel(/email/i).fill('pw-test-admin@example.org');
  await page.getByLabel(/password/i).fill('Password123!');
  await page.getByRole('button', { name: /log ?in|sign ?in/i }).click();
  await page.waitForURL((u) => !String(u).includes('/login'), { timeout: 15000 });

  // ── Create SOP applying a font family through the real UI ──────────────
  const uniq = `FontTest ${Date.now()}`;
  await page.goto(`${BASE}/sops`);
  await page.getByRole('button', { name: /create|new/i }).first().click();
  await page.getByLabel(/^title$/i).fill(uniq);
  const editor = page.locator('[role="dialog"] .ProseMirror').first();
  await editor.click();
  await page.keyboard.type('Styled paragraph text');
  // Select the typed text first — with a collapsed cursor setFontFamily
  // only becomes a stored mark for FUTURE input, it doesn't wrap anything.
  await page.keyboard.press('Control+a');
  await page.waitForTimeout(300);

  // Open the font-family select (mui MenuSelect renders a MUI Select)
  await page.locator('[role="dialog"] [aria-label*="font" i], [role="dialog"] [title*="font" i]').first().click();
  await page.waitForTimeout(400);
  await page.getByRole('option', { name: /khmer os muol/i }).click();
  await page.waitForTimeout(300);

  const spanStyle = await editor.evaluate((el) => {
    const span = el.querySelector('span[style*="font-family"]');
    return span?.getAttribute('style') ?? null;
  });
  check('font-family applied to content', !!spanStyle && spanStyle.includes('Khmer OS Muol'), spanStyle);

  await page.getByRole('button', { name: /^save$/i }).click();
  await page.getByText(/created|success/i).first().waitFor({ timeout: 8000 });

  // ── Persisted to DB ─────────────────────────────────────────────────────
  const token = await page.evaluate(() => localStorage.getItem('admin_auth_token'));
  await page.waitForTimeout(500);
  const list = await (await fetch(`${API}/sops`, { headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } })).json();
  const mine = list.data.find((s) => s.title === uniq);
  check('DB stores font-family style', !!mine && mine.content_en.includes("font-family"), mine?.content_en?.slice(0, 90));

  // ── PDF renders without error (Gotenberg path) ─────────────────────────
  const pdfRes = await fetch(`${API}/sops/${mine.id}/pdf`, { headers: { Authorization: `Bearer ${token}` } });
  const buf = await pdfRes.arrayBuffer();
  const magic = String.fromCharCode(...new Uint8Array(buf.slice(0, 4)));
  check('PDF renders via Gotenberg with custom font', magic === '%PDF', `${magic} (${buf.byteLength} bytes)`);

  await fetch(`${API}/sops/${mine.id}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' } });
} catch (err) {
  check('unexpected failure', false, String(err).slice(0, 200));
}

await browser.close();
const failed = results.filter((r) => !r).length;
console.log(`\n${results.length - failed}/${results.length} passed`);
process.exit(failed ? 1 : 0);
