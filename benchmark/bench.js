const { JSDOM } = require('jsdom');
const { performance } = require('perf_hooks');
const path = require('path');

function waitMicrotask() {
  return new Promise((res) => setTimeout(res, 0));
}

function generateData(count) {
  const arr = [];
  for (let i = 0; i < count; i++) {
    arr.push({
      id: i,
      name: `User-${i}`,
      age: 18 + (i % 50),
      isAdmin: i % 10 === 0,
      nested: { level1: { level2: { value: `deep-${i}` } } }
    });
  }
  return arr;
}

async function bootDom(html) {
  const dom = new JSDOM(html, {
    url: 'http://localhost',
    pretendToBeVisual: true,
    runScripts: 'dangerously'
  });

  global.window = dom.window;
  global.document = dom.window.document;
  global.Node = dom.window.Node;
  global.MutationObserver = dom.window.MutationObserver;

  require(path.resolve(__dirname, '../src/index.js'));

  return dom;
}

async function measure(label, fn) {
  const t0 = performance.now();
  await fn();
  const t1 = performance.now();
  console.log(`${label}: ${(t1 - t0).toFixed(2)} ms`);
}

(async () => {
  const ITEM_COUNT = process.env.ITEMS ? Number(process.env.ITEMS) : 5000;
  const data = generateData(ITEM_COUNT);
  const html = `<!DOCTYPE html><html><body>
      <template is="🌱" id="root" data-json='${JSON.stringify(data).replace(/'/g, "&apos;")}'>
        <template data-for="{user in _}">
          <div>
            <template data-if="{user.isAdmin}">
              <h1>Admin: <span>{user.name}</span></h1>
            </template>
            <template data-unless="{user.isAdmin}">
              <h1>{user.name}</h1>
            </template>
          </div>
        </template>
      </template>
  </body></html>`;

  const dom = await bootDom(html);
  const tpl = dom.window.document.getElementById('root');

  // Measure initial render
  await measure('Initial render', async () => {
    dom.window.document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    await waitMicrotask();
  });

  // Deep value change
  await measure('Deep value change', async () => {
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    const idx = Math.floor(cloned.length / 2);
    cloned[idx].nested.level1.level2.value = 'UPDATED';
    tpl.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // Remove item
  await measure('Remove last item', async () => {
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    cloned.pop();
    tpl.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // Add item
  await measure('Add new item', async () => {
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    const i = cloned.length;
    cloned.push({
      id: i,
      name: `User-${i}`,
      age: 18 + (i % 50),
      isAdmin: i % 10 === 0,
      nested: { level1: { level2: { value: `deep-${i}` } } }
    });
    tpl.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // -----------------------------------------------------------------------
  // Additional Scenarios
  // -----------------------------------------------------------------------

  // No-op update (identical JSON string)
  await measure('No-op update (same JSON)', async () => {
    const same = tpl.getAttribute('data-json');
    tpl.setAttribute('data-json', same);
    await waitMicrotask();
  });

  // Toggle branch: flip admin flag on first item
  await measure('Toggle conditional branch', async () => {
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    if (cloned.length) cloned[0].isAdmin = !cloned[0].isAdmin;
    tpl.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // Attribute-only-ish change: bump age of mid item (affects text only)
  await measure('Text-only change (age++)', async () => {
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    const idx = Math.floor(cloned.length / 2);
    cloned[idx].age += 1;
    tpl.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // Reorder: move first element to end
  await measure('Re-order (rotate first → last)', async () => {
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    if (cloned.length) cloned.push(cloned.shift());
    tpl.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // Bulk batch update: change nested value in 5% of items
  await measure('Bulk update 5% deep values', async () => {
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    const step = Math.max(1, Math.floor(cloned.length / 20)); // 5%
    for (let i = 0; i < cloned.length; i += step) {
      cloned[i].nested.level1.level2.value = 'BULK-' + i;
    }
    tpl.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // Multiple root templates: add extra template and update it
  await measure('Update among multiple templates', async () => {
    // Create additional templates lazily
    if (!dom.window.document.getElementById('extra-root')) {
      for (let t = 0; t < 9; t++) {
        const clone = tpl.cloneNode(false);
        clone.id = `extra-root-${t}`;
        dom.window.document.body.appendChild(clone);
      }
    }

    const extra = dom.window.document.getElementById('extra-root-0');
    const cloned = JSON.parse(tpl.getAttribute('data-json'));
    cloned[0].name = 'EXTRA';
    extra.setAttribute('data-json', JSON.stringify(cloned));
    await waitMicrotask();
  });

  // Memory snapshot
  const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2) + ' MB';
  console.log('Heap used:', mb(process.memoryUsage().heapUsed));
})();