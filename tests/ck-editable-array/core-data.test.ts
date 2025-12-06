import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-001: Data Property Getter/Setter - core behavior', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-001-01: Setting data should deep clone provided array (deep clone - mutation of source should not affect component data)', () => {
    const source = [{ name: 'Alice', nested: { age: 30 } }];

    // Mutate the source after setting. Use `any` cast to avoid TS errors while data property isn't implemented yet
    (element as any).data = source as any;
    // modify source after setter
    source[0].name = 'Bob';
    source[0].nested.age = 35;

    // Read from element.data
    const componentData = (element as any).data;

    expect(componentData).toBeDefined();
    expect(componentData[0].name).toBe('Alice');
    expect(componentData[0].nested.age).toBe(30);
  });

  test('TC-001-02: Getting data should return a clone so modifying returned value does not mutate internal state', () => {
    const source = [{ name: 'Carol', nested: { age: 40 } }];
    (element as any).data = source as any;

    const returned = (element as any).data;
    returned[0].name = 'Dave';
    returned[0].nested.age = 45;

    const again = (element as any).data;
    expect(again[0].name).toBe('Carol');
    expect(again[0].nested.age).toBe(40);
  });
});
