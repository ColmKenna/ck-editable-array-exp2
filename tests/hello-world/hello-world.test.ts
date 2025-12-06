import { HelloWorld } from '../../src/components/hello-world/hello.world';

// Define the custom element before running tests
beforeAll(() => {
  if (!customElements.get('hello-world')) {
    customElements.define('hello-world', HelloWorld);
  }
});

describe('HelloWorld Component', () => {
  let element: HelloWorld;

  beforeEach(() => {
    // Create a fresh instance for each test
    element = new HelloWorld();
    document.body.appendChild(element);
  });

  afterEach(() => {
    // Clean up after each test
    if (element.parentNode) {
      element.parentNode.removeChild(element);
    }
  });

  test('should create an instance', () => {
    expect(element).toBeInstanceOf(HelloWorld);
    expect(element).toBeInstanceOf(HTMLElement);
  });

  test('should have shadow DOM', () => {
    expect(element.shadowRoot).toBeTruthy();
  });

  test('should have default name "World"', () => {
    expect(element.name).toBe('World');
  });

  test('should set and get name attribute', () => {
    element.name = 'Jest';
    expect(element.name).toBe('Jest');
    expect(element.getAttribute('name')).toBe('Jest');
  });

  test('should render content in shadow DOM', () => {
    element.connectedCallback();
    const shadowContent = element.shadowRoot?.innerHTML;
    expect(shadowContent).toContain('Hello');
    expect(shadowContent).toContain('World');
  });

  test('should update content when name attribute changes', () => {
    element.connectedCallback();
    element.setAttribute('name', 'Testing');

    // Trigger attribute change callback
    element.attributeChangedCallback('name', 'World', 'Testing');

    const shadowContent = element.shadowRoot?.innerHTML;
    expect(shadowContent).toContain('Testing');
  });

  test('should observe name and color attributes', () => {
    const observedAttributes = HelloWorld.observedAttributes;
    expect(observedAttributes).toContain('name');
    expect(observedAttributes).toContain('color');
  });

  test('should handle color attribute', () => {
    element.setAttribute('color', 'blue');
    element.connectedCallback();

    const shadowContent = element.shadowRoot?.innerHTML;
    expect(shadowContent).toContain('blue');
  });
});
