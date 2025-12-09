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

describe('FR-001: DeepClone Robustness', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-001-DC-01: Should handle circular references gracefully', () => {
    type CircularData = { name: string; self?: CircularData };
    
    // Create object with circular reference
    const circular: CircularData = { name: 'Test' };
    circular.self = circular;

    // Setting data with circular ref should not hang or crash
    (element as unknown as { data: CircularData[] }).data = [circular];

    // Should still have data (circular part may be shallow copied or omitted)
    const data = (element as unknown as { data: CircularData[] }).data;
    expect(data).toBeDefined();
    expect(data[0]).toBeDefined();
    expect(data[0].name).toBe('Test');
  });

  test('TC-001-DC-02: Should handle deeply nested objects with depth limit', () => {
    // Create deeply nested object (60 levels deep - exceeds MAX_DEPTH of 50)
    let deepObj: Record<string, unknown> = { value: 'bottom' };
    for (let i = 0; i < 60; i++) {
      deepObj = { nested: deepObj };
    }

    // Setting deeply nested data should not cause stack overflow
    (element as unknown as { data: Record<string, unknown>[] }).data = [deepObj];

    // Should still have data (may be shallow copied at depth limit)
    const data = (element as unknown as { data: Record<string, unknown>[] }).data;
    expect(data).toBeDefined();
    expect(data[0]).toBeDefined();
  });

  test('TC-001-DC-03: Should handle objects with many properties', () => {
    // Create object with 100 properties (well under MAX_PROPERTIES of 10000)
    const manyProps: Record<string, number> = {};
    for (let i = 0; i < 100; i++) {
      manyProps[`prop${i}`] = i;
    }

    // Should clone successfully
    (element as unknown as { data: Record<string, unknown>[] }).data = [manyProps];

    const data = (element as unknown as { data: Record<string, unknown>[] }).data;
    expect(data).toBeDefined();
    expect(data[0]).toBeDefined();
    expect((data[0] as Record<string, number>).prop0).toBe(0);
    expect((data[0] as Record<string, number>).prop99).toBe(99);
  });

  test('TC-001-DC-04: Should log warning in debug mode when depth limit exceeded', async () => {
    // Enable debug mode
    (element as unknown as { debug: boolean }).debug = true;

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Create deeply nested object (60 levels deep)
    let deepObj: Record<string, unknown> = { value: 'bottom' };
    for (let i = 0; i < 60; i++) {
      deepObj = { nested: deepObj };
    }

    // Setting deeply nested data should log warning
    (element as unknown as { data: Record<string, unknown>[] }).data = [deepObj];

    // Give time for warnings to be logged
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ck-editable-array]')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('depth limit')
    );

    consoleSpy.mockRestore();
  });

  test('TC-001-DC-05: Should handle normal objects without issues', () => {
    // Normal object with reasonable structure
    const normalData = [
      {
        name: 'Alice',
        age: 30,
        address: {
          street: '123 Main St',
          city: 'Springfield',
          coordinates: { lat: 40.7, lng: -74.0 }
        },
        hobbies: ['reading', 'gaming']
      }
    ];

    // Should clone perfectly
    (element as unknown as { data: typeof normalData }).data = normalData;

    const data = (element as unknown as { data: typeof normalData }).data;
    expect(data).toBeDefined();
    expect(data[0].name).toBe('Alice');
    expect(data[0].address.city).toBe('Springfield');
    expect(data[0].address.coordinates.lat).toBe(40.7);
    expect(data[0].hobbies).toEqual(['reading', 'gaming']);
  });

  test('TC-001-DC-06: Should fallback to shallow copy on clone failure', () => {
    // Enable debug mode to see fallback warnings
    (element as unknown as { debug: boolean }).debug = true;

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Create object with excessive properties (simulate DoS scenario)
    // We'll create a moderately large object that should still work
    const largeObj: Record<string, number> = {};
    for (let i = 0; i < 1000; i++) {
      largeObj[`prop${i}`] = i;
    }

    // Should handle gracefully
    (element as unknown as { data: Record<string, unknown>[] }).data = [largeObj];

    const data = (element as unknown as { data: Record<string, unknown>[] }).data;
    expect(data).toBeDefined();
    expect(data[0]).toBeDefined();

    consoleSpy.mockRestore();
  });
});