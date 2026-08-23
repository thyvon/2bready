import { chromium } from 'playwright';
import { readFileSync } from 'fs';
const pdfB64 = readFileSync('/tmp/kh-test2.pdf').toString('base64');
const html = `<!DOCTYPE html><html><head><style>body{margin:0;background:#fff}</style></head>
<body><canvas id="c"></canvas>
<script type="module">
  const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: atob('${pdfB64}') }).promise;
  const p = await doc.getPage(1);
  // high scale, crop the KH band
  const vp = p.getViewport({ scale: 3.0 });
  const c = document.getElementById('c');
  c.width = vp.width; c.height = vp.height;
  await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  window.__done = true;
</script></body></html>`;
const fs = await import('fs');
fs.writeFileSync('/tmp/kh-view2.html', html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 900 } });
await page.goto('file:///tmp/kh-view2.html');
await page.waitForFunction('window.__done === true', { timeout: 30000 });
// clip to the khmer lines area (scaled x3 → around y=850..1100)
await page.screenshot({ path: '/tmp/kh-zoom.png', clip: { x: 60, y: 560, width: 900, height: 320 } });
console.log('zoom saved');
await browser.close();
