import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-014: Move Up', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="move-up">Move Up</button>
        <button data-action="move-down">Move Down</button>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-014-01: moveUp() swaps with row above', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveUp: (index: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ];

    // Move Bob (index 1) up
    elementWithReorder.moveUp(1);

    // Bob should now be first
    expect(elementWithReorder.data[0].name).toBe('Bob');
    expect(elementWithReorder.data[1].name).toBe('Alice');
    expect(elementWithReorder.data[2].name).toBe('Charlie');
  });

  test('TC-014-02: moveUp() no-op for first row', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveUp: (index: number) => void;
    };

    elementWithReorder.data = [{ name: 'Alice' }, { name: 'Bob' }];

    // Try to move first row up (should do nothing)
    elementWithReorder.moveUp(0);

    // Order should remain the same
    expect(elementWithReorder.data[0].name).toBe('Alice');
    expect(elementWithReorder.data[1].name).toBe('Bob');
  });

  test('TC-014-03: data-action="move-up" triggers moveUp', () => {
    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Click move-up button on second row
    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    const moveUpBtn = rows?.[1].querySelector(
      '[data-action="move-up"]'
    ) as HTMLElement;
    moveUpBtn?.click();

    // Bob should now be first
    const data = (element as unknown as { data: RowData[] }).data;
    expect(data[0].name).toBe('Bob');
    expect(data[1].name).toBe('Alice');
  });

  test('TC-014-04: reorder event dispatched', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveUp: (index: number) => void;
    };

    elementWithReorder.data = [{ name: 'Alice' }, { name: 'Bob' }];

    const handler = jest.fn();
    element.addEventListener('reorder', handler);

    elementWithReorder.moveUp(1);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.fromIndex).toBe(1);
    expect(event.detail.toIndex).toBe(0);
  });

  test('TC-014-05: moveUp blocked when row editing', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveUp: (index: number) => void;
    };

    elementWithReorder.data = [{ name: 'Alice' }, { name: 'Bob' }];

    // Enter edit mode on first row
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Try to move second row up (should be blocked)
    elementWithReorder.moveUp(1);

    // Order should remain the same
    expect(elementWithReorder.data[0].name).toBe('Alice');
    expect(elementWithReorder.data[1].name).toBe('Bob');
  });
});

describe('FR-015: Move Down', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="move-up">Move Up</button>
        <button data-action="move-down">Move Down</button>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-015-01: moveDown() swaps with row below', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveDown: (index: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ];

    // Move Alice (index 0) down
    elementWithReorder.moveDown(0);

    // Alice should now be second
    expect(elementWithReorder.data[0].name).toBe('Bob');
    expect(elementWithReorder.data[1].name).toBe('Alice');
    expect(elementWithReorder.data[2].name).toBe('Charlie');
  });

  test('TC-015-02: moveDown() no-op for last row', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveDown: (index: number) => void;
    };

    elementWithReorder.data = [{ name: 'Alice' }, { name: 'Bob' }];

    // Try to move last row down (should do nothing)
    elementWithReorder.moveDown(1);

    // Order should remain the same
    expect(elementWithReorder.data[0].name).toBe('Alice');
    expect(elementWithReorder.data[1].name).toBe('Bob');
  });

  test('TC-015-03: data-action="move-down" triggers moveDown', () => {
    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Click move-down button on first row
    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    const moveDownBtn = rows?.[0].querySelector(
      '[data-action="move-down"]'
    ) as HTMLElement;
    moveDownBtn?.click();

    // Alice should now be second
    const data = (element as unknown as { data: RowData[] }).data;
    expect(data[0].name).toBe('Bob');
    expect(data[1].name).toBe('Alice');
  });

  test('TC-015-04: reorder event dispatched', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveDown: (index: number) => void;
    };

    elementWithReorder.data = [{ name: 'Alice' }, { name: 'Bob' }];

    const handler = jest.fn();
    element.addEventListener('reorder', handler);

    elementWithReorder.moveDown(0);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.fromIndex).toBe(0);
    expect(event.detail.toIndex).toBe(1);
  });
});

describe('FR-016: Move To', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
        <button data-action="save">Save</button>
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-016-01: moveTo() moves row to target position', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
      { name: 'Diana' },
    ];

    // Move Alice (index 0) to position 2
    elementWithReorder.moveTo(0, 2);

    // Alice should now be at index 2
    expect(elementWithReorder.data[0].name).toBe('Bob');
    expect(elementWithReorder.data[1].name).toBe('Charlie');
    expect(elementWithReorder.data[2].name).toBe('Alice');
    expect(elementWithReorder.data[3].name).toBe('Diana');
  });

  test('TC-016-02: moveTo() clamps to valid range', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ];

    // Try to move to index beyond array length
    elementWithReorder.moveTo(0, 10);

    // Should move to last position (clamped)
    expect(elementWithReorder.data[0].name).toBe('Bob');
    expect(elementWithReorder.data[1].name).toBe('Charlie');
    expect(elementWithReorder.data[2].name).toBe('Alice');

    // Try to move to negative index
    elementWithReorder.moveTo(2, -5);

    // Should move to first position (clamped)
    expect(elementWithReorder.data[0].name).toBe('Alice');
    expect(elementWithReorder.data[1].name).toBe('Bob');
    expect(elementWithReorder.data[2].name).toBe('Charlie');
  });

  test('TC-016-03: reorder event dispatched', () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ];

    const handler = jest.fn();
    element.addEventListener('reorder', handler);

    elementWithReorder.moveTo(0, 2);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.fromIndex).toBe(0);
    expect(event.detail.toIndex).toBe(2);
  });
});

describe('FR-016: moveTo Error Handling', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-016-E-01: Should dispatch moveerror when fromIndex is invalid (negative)', async () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ];

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('moveerror', (event: Event) => {
        resolve(event as CustomEvent);
      }, { once: true });
    });

    // Try to move from negative index
    elementWithReorder.moveTo(-1, 1);

    const customEvent = await eventPromise;

    expect(customEvent.detail).toBeDefined();
    expect(customEvent.detail.fromIndex).toBe(-1);
    expect(customEvent.detail.toIndex).toBe(1);
    expect(customEvent.detail.reason).toBe('invalid_from_index');
    expect(customEvent.detail.message).toContain('Invalid fromIndex: -1');
    expect(customEvent.detail.timestamp).toBeGreaterThan(0);
  });

  test('TC-016-E-02: Should dispatch moveerror when fromIndex is out of bounds', async () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('moveerror', (event: Event) => {
        resolve(event as CustomEvent);
      }, { once: true });
    });

    // Try to move from index 5 (only 2 rows exist)
    elementWithReorder.moveTo(5, 0);

    const customEvent = await eventPromise;

    expect(customEvent.detail).toBeDefined();
    expect(customEvent.detail.fromIndex).toBe(5);
    expect(customEvent.detail.reason).toBe('invalid_from_index');
    expect(customEvent.detail.message).toContain('Invalid fromIndex: 5');
  });

  test('TC-016-E-03: Should dispatch moveerror when toIndex is clamped', async () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
      { name: 'Charlie' },
    ];

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('moveerror', (event: Event) => {
        resolve(event as CustomEvent);
      }, { once: true });
    });

    // Try to move to index 10 (only 3 rows exist, will be clamped to 2)
    elementWithReorder.moveTo(0, 10);

    const customEvent = await eventPromise;

    expect(customEvent.detail).toBeDefined();
    expect(customEvent.detail.fromIndex).toBe(0);
    expect(customEvent.detail.toIndex).toBe(10);
    expect(customEvent.detail.clampedToIndex).toBe(2);
    expect(customEvent.detail.reason).toBe('invalid_to_index');
    expect(customEvent.detail.message).toContain('Invalid toIndex: 10');
    expect(customEvent.detail.message).toContain('Clamped to 2');
  });

  test('TC-016-E-04: Should dispatch moveerror when component is readonly', async () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      readonly: boolean;
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Set readonly mode
    elementWithReorder.readonly = true;

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('moveerror', (event: Event) => {
        resolve(event as CustomEvent);
      }, { once: true });
    });

    // Try to move
    elementWithReorder.moveTo(0, 1);

    const customEvent = await eventPromise;

    expect(customEvent.detail).toBeDefined();
    expect(customEvent.detail.reason).toBe('readonly');
    expect(customEvent.detail.message).toContain('readonly mode');
  });

  test('TC-016-E-05: Should dispatch moveerror when row is being edited', async () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Enter edit mode on first row
    const toggleBtn = element.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
    toggleBtn?.click();

    const eventPromise = new Promise<CustomEvent>((resolve) => {
      element.addEventListener('moveerror', (event: Event) => {
        resolve(event as CustomEvent);
      }, { once: true });
    });

    // Try to move while editing
    elementWithReorder.moveTo(0, 1);

    const customEvent = await eventPromise;

    expect(customEvent.detail).toBeDefined();
    expect(customEvent.detail.reason).toBe('editing');
    expect(customEvent.detail.message).toContain('while a row is being edited');
  });

  test('TC-016-E-06: Should log warning in debug mode for invalid fromIndex', async () => {
    type RowData = { name: string };
    const elementWithReorder = element as unknown as {
      data: RowData[];
      debug: boolean;
      moveTo: (fromIndex: number, toIndex: number) => void;
    };

    elementWithReorder.data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Enable debug mode
    elementWithReorder.debug = true;

    const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

    // Try to move from invalid index
    elementWithReorder.moveTo(10, 0);

    // Give time for events to process
    await new Promise(resolve => setTimeout(resolve, 10));

    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('[ck-editable-array]')
    );
    expect(consoleSpy).toHaveBeenCalledWith(
      expect.stringContaining('moveTo: Invalid fromIndex')
    );

    consoleSpy.mockRestore();
  });
});
