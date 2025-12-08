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
