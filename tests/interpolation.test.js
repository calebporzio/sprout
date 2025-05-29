const wait = () => new Promise((r) => setTimeout(r, 0));

// Ensure fresh module state between tests
beforeEach(() => {
  document.body.innerHTML = '';
  jest.resetModules();
});

test('interpolates expressions inside text nodes', async () => {
  // Load library (registers DOMContentLoaded listener)
  require('../src/index.js');

  // Build template using text interpolation
  const tpl = document.createElement('template');
  tpl.setAttribute('is', '🌱');
  tpl.setAttribute('data-json', JSON.stringify({ name: 'John' }));
  tpl.innerHTML = '<span>Hello {name}</span>';

  document.body.appendChild(tpl);

  // Trigger initial render
  document.dispatchEvent(new Event('DOMContentLoaded'));
  await wait();

  const span = document.querySelector('span');
  expect(span).not.toBeNull();
  expect(span.textContent).toBe('Hello John');
});