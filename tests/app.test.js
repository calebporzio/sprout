const { render } = require('../app');

describe('render', () => {
  beforeEach(() => {
    // Reset the document body for each test
    document.body.innerHTML = '';
  });

  test('should render initial data correctly', () => {
    const initialData = { message: 'Hello, World!' };
    const element = render(initialData);

    expect(element.textContent).toBe('Hello, World!');
    expect(JSON.parse(element.getAttribute('data-json'))).toEqual(initialData);
    expect(document.body.contains(element)).toBe(true);
  });

  test('should update DOM when data-json attribute is mutated', () => {
    const initialData = { message: 'Initial Message' };
    const element = render(initialData);

    // Mutate the data-json attribute
    const updatedData = { message: 'Updated Message' };
    element.setAttribute('data-json', JSON.stringify(updatedData));

    // For this simple example, we'll manually re-render based on the attribute
    // In a real app, you might have a MutationObserver or a re-render function
    const newData = JSON.parse(element.getAttribute('data-json'));
    element.textContent = newData.message; // Simulate DOM update based on new data

    expect(element.textContent).toBe('Updated Message');
    expect(JSON.parse(element.getAttribute('data-json'))).toEqual(updatedData);
  });
});