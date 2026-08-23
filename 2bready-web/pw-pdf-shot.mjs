import { chromium } from 'playwright';
import { readFileSync, copyFileSync } from 'fs';

const pdfB64 = readFileSync('/tmp/kh-test2.pdf').toString('base64');
const workerPath = new URL('./node_modules/pdfjs-dist/build/pdf.worker.min.mjs', import.meta.url).pathname;
copyFileSync(workerPath, '/tmp/pdf.worker.min.mjs');

const html = `<!DOCTYPE html><html><head><style>body{margin:0;background:#888}</style></head>
<body><canvas id="c"></canvas>
<script src="file:///tmp/pdf.worker.min.mjs"></script>
<script type="module">
  const src = 'data:application/pdf;base64,${pdfB64}';
  const pdfjs = await import('https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.min.mjs');
  pdfjs.GlobalWorkerOptions.workerSrc = 'https://cdnjs.cloudflare.com/ajax/libs/pdf.js/4.7.76/pdf.worker.min.mjs';
  const doc = await pdfjs.getDocument({ data: atob('${pdfB64}') }).promise;
  const p = await doc.getPage(1);
  const vp = p.getViewport({ scale: 1.3 });
  const c = document.getElementById('c');
  c.width = vp.width; c.height = vp.height;
  await p.render({ canvasContext: c.getContext('2d'), viewport: vp }).promise;
  window.__done = true;
</script></body></html>`;

const fs = await import('fs');
fs.writeFileSync('/tmp/kh-view.html', html);

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 950, height: 1250 } });
await page.goto('file:///tmp/kh-view.html');
await page.waitForFunction('window.__done === true', { timeout: 20000 });
await page.screenshot({ path: '/tmp/kh-test.png' });
console.log('rendered + screenshot saved');
await browser.close();
