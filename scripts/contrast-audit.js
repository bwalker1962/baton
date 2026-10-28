// Contrast audit: every button, badge, link and tab on every page, in light, half-dark and dark.
// Usage: npm run build && npx next start -p 3324, then: node scripts/contrast-audit.js 3324 [phone]
// Prints nothing when every label meets WCAG AA (4.5:1, or 3:1 for large text).
const { chromium } = require('playwright');
const pages = ['/', '/today', '/signoff', '/signoff/s3', '/advisor', '/skills', '/clients', '/clients/pentara', '/clients/pentara/score',
  '/clients/pentara/tasks', '/clients/pentara/projects', '/clients/pentara/notes', '/clients/pentara/chats', '/clients/pentara/apps',
  '/clients/pentara/report', '/clients/pentara/brand', '/login', '/signup', '/projects-new'];
const extras = {
  '/clients/pentara/tasks': async (p) => { await p.locator('tbody tr').first().getByRole('button', { name: /Snooze/ }).click(); },
  '/clients/pentara/notes': async (p) => { await p.locator('.oneonone-pill').click(); },
  '/signoff/s3': async (p) => { await p.getByRole('button', { name: 'Approve with changes' }).click(); },
  '/clients/pentara/brand': async (p) => { await p.getByRole('button', { name: /Fetch/ }).click(); await p.waitForTimeout(1200); },
};
const audit = () => {
  const parse = (c) => {
    let m = c.match(/rgba?\(([^)]+)\)/);
    if (m) { const v = m[1].split(/[ ,/]+/).filter(Boolean).map(Number); return [v[0], v[1], v[2], v[3] ?? 1]; }
    m = c.match(/color\(srgb ([^)]+)\)/);
    if (m) { const v = m[1].split(/[ /]+/).filter(Boolean).map(Number); return [v[0] * 255, v[1] * 255, v[2] * 255, v[3] ?? 1]; }
    return null;
  };
  const blend = (top, bot) => { const a = top[3]; return [0, 1, 2].map((i) => top[i] * a + bot[i] * (1 - a)).concat(1); };
  const bgOf = (el) => {
    const stack = [];
    for (let e = el; e; e = e.parentElement) { const c = parse(getComputedStyle(e).backgroundColor); if (c && c[3] > 0) { stack.push(c); if (c[3] >= 1) break; } }
    let col = [255, 255, 255, 1];
    for (let i = stack.length - 1; i >= 0; i--) col = blend(stack[i], col);
    return col;
  };
  const lum = (c) => { const f = (v) => { v /= 255; return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4; }; return 0.2126 * f(c[0]) + 0.7152 * f(c[1]) + 0.0722 * f(c[2]); };
  const ratio = (a, b) => { const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p); return (x + 0.05) / (y + 0.05); };
  const out = [];
  document.querySelectorAll('button, a.btn, .badge, .chip, [role=tab], .tabs a, .seg button, .sidenav a, .bottomnav a, .topbar a, .topbar button, .option, label, .navcount, .oneonone-pill, .toast span, .note').forEach((el) => {
    const r = el.getBoundingClientRect(); const cs = getComputedStyle(el);
    if (!r.width || !r.height || cs.visibility === 'hidden' || cs.display === 'none') return;
    if (!el.innerText || !el.innerText.trim()) return;
    if (el.disabled || el.getAttribute('aria-disabled') === 'true') return;
    let o = 1; for (let e = el; e; e = e.parentElement) o *= Number(getComputedStyle(e).opacity);
    const fg = parse(cs.color); if (!fg) return;
    const bg = bgOf(el); const f = blend([fg[0], fg[1], fg[2], fg[3] * o], bg);
    const rt = ratio(f, bg); const big = parseFloat(cs.fontSize) >= 18.5 || (parseFloat(cs.fontSize) >= 14 && Number(cs.fontWeight) >= 700);
    if (rt < (big ? 3 : 4.5)) out.push(`${rt.toFixed(2)} "${el.innerText.trim().slice(0, 40).replace(/\n/g, ' ')}" <${el.tagName.toLowerCase()} ${el.className.toString().slice(0, 30)}>`);
  });
  return [...new Set(out)];
};
(async () => {
  const b = await chromium.launch(); const port = process.argv[2];
  for (const mode of ['light', 'half', 'dark']) {
    const p = await b.newPage({ viewport: process.argv[3] === 'phone' ? { width: 390, height: 844 } : { width: 1360, height: 900 } });
    await p.addInitScript((m) => { try { localStorage.setItem('baton-mode', m); } catch {} }, mode);
    for (const path of pages) {
      if (path === '/projects-new') continue;
      await p.goto(`http://localhost:${port}${path}`); await p.waitForTimeout(500);
      if (extras[path]) { try { await extras[path](p); await p.waitForTimeout(300); } catch (e) { console.log('extra failed', path); } }
      const bad = await p.evaluate(audit);
      if (bad.length) console.log(`[${mode}] ${path}\n   ` + bad.join('\n   '));
    }
    await p.close();
  }
  await b.close();
})();
