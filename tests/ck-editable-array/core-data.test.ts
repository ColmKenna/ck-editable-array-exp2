import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-001: Data Property Getter/Setter - core behavior', () => {
  let element: CkEditableArray;
  type Person = { name: string; nested: { age: number } };
  const getPersonData = (el: CkEditableArray) =>
    (el as unknown as { data: Person[] }).data;
  type TsRow = { ts: Date };
  const getTsData = (el: CkEditableArray) =>
    (el as unknown as { data: TsRow[] }).data;

  beforeEach(() => {
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-001-01: Setting data should deep clone provided array (deep clone - mutation of source should not affect component data)', () => {
    const source = [{ name: 'Alice', nested: { age: 30 } }];

    // Mutate the source after setting. Use `unknown` cast to access the `data` property safely
    (element as unknown as { data: Person[] }).data =
      source as unknown as Person[];
    // modify source after setter
    source[0].name = 'Bob';
    source[0].nested.age = 35;

    // Read from element.data
    const componentData = getPersonData(element);

    expect(componentData).toBeDefined();
    expect(componentData[0].name).toBe('Alice');
    expect(componentData[0].nested.age).toBe(30);
  });

  test('TC-001-02: Getting data should return a clone so modifying returned value does not mutate internal state', () => {
    const source = [{ name: 'Carol', nested: { age: 40 } }];
    (element as unknown as { data: Person[] }).data =
      source as unknown as Person[];

    const returned = getPersonData(element);
    returned[0].name = 'Dave';
    returned[0].nested.age = 45;

    const again = getPersonData(element);
    expect(again[0].name).toBe('Carol');
    expect(again[0].nested.age).toBe(40);
  });

  test('TC-001-03: Setting data dispatches datachanged event', () => {
    const handler = jest.fn();
    element.addEventListener('datachanged', handler);

    (element as unknown as { data: Person[] }).data = [
      { name: 'Test', nested: { age: 25 } },
    ];

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: Person[] }>;
    expect(event.type).toBe('datachanged');
    expect(event.detail.data).toEqual([{ name: 'Test', nested: { age: 25 } }]);
  });

  test('TC-001-03b: Fallback style node remains after render (render should not remove earlier appended style)', () => {
    // Ensure style is present after multiple renders and not removed
    element.connectedCallback();
    const fallbackStyleBefore = element.shadowRoot?.querySelectorAll(
      'style[data-ck-editable-array-fallback]'
    );
    expect(fallbackStyleBefore?.length).toBeGreaterThanOrEqual(1);

    // Call render again; style should still be present and not duplicated extensively
    (element as unknown as { render: () => void }).render();
    const fallbackStyleAfter = element.shadowRoot?.querySelectorAll(
      'style[data-ck-editable-array-fallback]'
    );
    expect(fallbackStyleAfter?.length).toBeGreaterThanOrEqual(1);
    // The test ensures render does not remove the previously appended style elements
  });

  test('TC-002-01: Data cloning preserves Date object when structured clone is available or fallback handles it', () => {
    const d = new Date(1620000000000);
    // Create a new unattached element to avoid side-effects from prior renders
    const newEl = new CkEditableArray();
    (newEl as unknown as { data: TsRow[] }).data = [{ ts: d }];

    const componentData = getTsData(newEl);
    // If structured clone or custom fallback is implemented, the type should be Date
    expect(componentData[0].ts instanceof Date).toBe(true);
    expect(componentData[0].ts.getTime()).toBe(d.getTime());
  });

  test('TC-003-01: connectedCallback adds resize listener and disconnectedCallback removes it', () => {
    // Create an unattached element so we can spy before it is connected
    const newEl = new CkEditableArray();
    const addSpy = jest.spyOn(window, 'addEventListener');
    const removeSpy = jest.spyOn(window, 'removeEventListener');

    document.body.appendChild(newEl); // triggers connectedCallback
    expect(addSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    newEl.remove(); // triggers disconnectedCallback
    expect(removeSpy).toHaveBeenCalledWith('resize', expect.any(Function));

    addSpy.mockRestore();
    removeSpy.mockRestore();
  });

  test('TC-005-01: Invalid color values are sanitized to default', () => {
    element.color = 'javascript:alert(1)';
    element.connectedCallback();
    const heading = element.shadowRoot?.querySelector(
      '.ck-editable-array__message'
    ) as HTMLElement | null;
    expect(heading).not.toBeNull();
    // heading.style.color should use sanitized color (either default or valid value)
    expect(heading?.style.color).not.toContain('javascript');
  });
});
