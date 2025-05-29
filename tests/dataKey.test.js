const wait = () => new Promise((r) => setTimeout(r, 0));

describe('data-key loop behaviour', () => {
  beforeEach(() => {
    document.body.innerHTML = '';
    // Ensure the library is freshly required each test (jest cache bust)
    jest.resetModules();
  });

  test('preserves DOM node identity when list is reordered', async () => {
    // Load library
    require('../src/index.js');

    const generateData = (ids) => ids.map((i) => ({ id: i, name: `User-${i}` }));

    // Build root template
    const tpl = document.createElement('template');
    tpl.setAttribute('is', '🌱');
    tpl.id = 'root';
    tpl.setAttribute('data-json', JSON.stringify(generateData([0, 1, 2])));
    tpl.innerHTML = `
      <template data-for="{user in _}" data-key="{user.id}">
        <div data-id="{user.id}">{user.name}</div>
      </template>
    `;

    document.body.appendChild(tpl);

    // Fire DOMContentLoaded to trigger render
    document.dispatchEvent(new Event('DOMContentLoaded'));
    await wait();

    const firstDiv = document.querySelector('[data-id="0"]');
    expect(firstDiv).not.toBeNull();
    const initialParent = firstDiv.parentNode;

    // Reorder list (rotate)
    const newOrder = generateData([1, 2, 0]);
    tpl.setAttribute('data-json', JSON.stringify(newOrder));

    await wait();

    const sameDiv = document.querySelector('[data-id="0"]');
    expect(sameDiv).toBe(firstDiv); // identity preserved
    // It should also still be in the DOM under the same parent
    expect(initialParent.contains(sameDiv)).toBe(true);
  });
});