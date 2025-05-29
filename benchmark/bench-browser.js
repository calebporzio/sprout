const path = require('path');
const puppeteer = require('puppeteer');

(async () => {
  const ITEMS = process.env.ITEMS || 5000;
  const browser = await puppeteer.launch({ headless: 'new', args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files'] });
  const page = await browser.newPage();

  // forward console.log from page to node process
  page.on('console', (msg) => {
    console[msg.type()]?.(msg.text());
  });

  page.on('pageerror', (err) => {
    console.error('Page error:', err);
  });

  const filePath = path.resolve(__dirname, '../benchmark-in-browser.html');
  const url = `file://${filePath}?items=${ITEMS}`;

  await page.goto(url, { waitUntil: 'load' });

  // wait for completion ("Done." in output)
  await page.waitForFunction(
    () => {
      const pre = document.getElementById('output');
      return pre && pre.textContent.includes('Done.');
    },
    { timeout: 0 }
  );

  await browser.close();
})();