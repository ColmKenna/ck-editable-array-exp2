import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-010: Undo', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="delete">Delete</button>
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

  test('TC-010-01: undo() restores previous state', () => {
    type RowData = { name: string };
    const elementWithUndo = element as unknown as {
      data: RowData[];
      undo: () => void;
    };

    // Set initial data
    elementWithUndo.data = [{ name: 'Alice' }];

    // Make a change
    elementWithUndo.data = [{ name: 'Bob' }];

    // Undo
    elementWithUndo.undo();

    // Should restore previous state
    expect(elementWithUndo.data[0].name).toBe('Alice');
  });

  test('TC-010-02: canUndo returns true when history exists', () => {
    type RowData = { name: string };
    const elementWithUndo = element as unknown as {
      data: RowData[];
      canUndo: boolean;
    };

    // Initially no history
    expect(elementWithUndo.canUndo).toBe(false);

    // Set initial data
    elementWithUndo.data = [{ name: 'Alice' }];

    // Still no history (first state)
    expect(elementWithUndo.canUndo).toBe(false);

    // Make a change
    elementWithUndo.data = [{ name: 'Bob' }];

    // Now we have history
    expect(elementWithUndo.canUndo).toBe(true);
  });

  test('TC-010-03: datachanged event dispatched on undo', () => {
    type RowData = { name: string };
    const elementWithUndo = element as unknown as {
      data: RowData[];
      undo: () => void;
    };

    // Set initial data and make a change
    elementWithUndo.data = [{ name: 'Alice' }];
    elementWithUndo.data = [{ name: 'Bob' }];

    const handler = jest.fn();
    element.addEventListener('datachanged', handler);

    // Undo
    elementWithUndo.undo();

    expect(handler).toHaveBeenCalled();
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: RowData[] }>;
    expect(event.detail.data[0].name).toBe('Alice');
  });

  test('TC-010-04: undo event dispatched with data', () => {
    type RowData = { name: string };
    const elementWithUndo = element as unknown as {
      data: RowData[];
      undo: () => void;
    };

    // Set initial data and make a change
    elementWithUndo.data = [{ name: 'Alice' }];
    elementWithUndo.data = [{ name: 'Bob' }];

    const handler = jest.fn();
    element.addEventListener('undo', handler);

    // Undo
    elementWithUndo.undo();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: RowData[] }>;
    expect(event.detail.data[0].name).toBe('Alice');
  });
});

describe('FR-011: Redo', () => {
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

  test('TC-011-01: redo() restores next state', () => {
    type RowData = { name: string };
    const elementWithRedo = element as unknown as {
      data: RowData[];
      undo: () => void;
      redo: () => void;
    };

    // Set initial data
    elementWithRedo.data = [{ name: 'Alice' }];

    // Make a change
    elementWithRedo.data = [{ name: 'Bob' }];

    // Undo
    elementWithRedo.undo();
    expect(elementWithRedo.data[0].name).toBe('Alice');

    // Redo
    elementWithRedo.redo();
    expect(elementWithRedo.data[0].name).toBe('Bob');
  });

  test('TC-011-02: canRedo returns true after undo', () => {
    type RowData = { name: string };
    const elementWithRedo = element as unknown as {
      data: RowData[];
      undo: () => void;
      canRedo: boolean;
    };

    // Initially no redo
    expect(elementWithRedo.canRedo).toBe(false);

    // Set data and make change
    elementWithRedo.data = [{ name: 'Alice' }];
    elementWithRedo.data = [{ name: 'Bob' }];

    // Still no redo before undo
    expect(elementWithRedo.canRedo).toBe(false);

    // Undo
    elementWithRedo.undo();

    // Now we can redo
    expect(elementWithRedo.canRedo).toBe(true);
  });

  test('TC-011-03: datachanged event dispatched on redo', () => {
    type RowData = { name: string };
    const elementWithRedo = element as unknown as {
      data: RowData[];
      undo: () => void;
      redo: () => void;
    };

    // Setup: set data, change, undo
    elementWithRedo.data = [{ name: 'Alice' }];
    elementWithRedo.data = [{ name: 'Bob' }];
    elementWithRedo.undo();

    const handler = jest.fn();
    element.addEventListener('datachanged', handler);

    // Redo
    elementWithRedo.redo();

    expect(handler).toHaveBeenCalled();
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: RowData[] }>;
    expect(event.detail.data[0].name).toBe('Bob');
  });

  test('TC-011-04: redo event dispatched with data', () => {
    type RowData = { name: string };
    const elementWithRedo = element as unknown as {
      data: RowData[];
      undo: () => void;
      redo: () => void;
    };

    // Setup: set data, change, undo
    elementWithRedo.data = [{ name: 'Alice' }];
    elementWithRedo.data = [{ name: 'Bob' }];
    elementWithRedo.undo();

    const handler = jest.fn();
    element.addEventListener('redo', handler);

    // Redo
    elementWithRedo.redo();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: RowData[] }>;
    expect(event.detail.data[0].name).toBe('Bob');
  });
});

describe('FR-012: History Size Limit', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
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

  test('TC-012-01: History respects maxHistorySize', () => {
    type RowData = { name: string };
    const elementWithHistory = element as unknown as {
      data: RowData[];
      maxHistorySize: number;
      undo: () => void;
      canUndo: boolean;
    };

    // Set max history size to 3
    elementWithHistory.maxHistorySize = 3;

    // Make 5 changes
    elementWithHistory.data = [{ name: 'State1' }];
    elementWithHistory.data = [{ name: 'State2' }];
    elementWithHistory.data = [{ name: 'State3' }];
    elementWithHistory.data = [{ name: 'State4' }];
    elementWithHistory.data = [{ name: 'State5' }];

    // Undo 3 times (should work)
    elementWithHistory.undo();
    expect(elementWithHistory.data[0].name).toBe('State4');

    elementWithHistory.undo();
    expect(elementWithHistory.data[0].name).toBe('State3');

    elementWithHistory.undo();
    expect(elementWithHistory.data[0].name).toBe('State2');

    // 4th undo should not work (history limit)
    expect(elementWithHistory.canUndo).toBe(false);
  });

  test('TC-012-02: Oldest entries removed when limit exceeded', () => {
    type RowData = { name: string };
    const elementWithHistory = element as unknown as {
      data: RowData[];
      maxHistorySize: number;
      _history: unknown[];
    };

    // Set max history size to 2
    elementWithHistory.maxHistorySize = 2;

    // Make 4 changes
    elementWithHistory.data = [{ name: 'State1' }];
    elementWithHistory.data = [{ name: 'State2' }];
    elementWithHistory.data = [{ name: 'State3' }];
    elementWithHistory.data = [{ name: 'State4' }];

    // History should only have 2 entries
    expect(elementWithHistory._history.length).toBeLessThanOrEqual(2);
  });
});

describe('FR-013: Clear History', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
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

  test('TC-013-01: clearHistory() empties history', () => {
    type RowData = { name: string };
    const elementWithHistory = element as unknown as {
      data: RowData[];
      clearHistory: () => void;
      _history: unknown[];
      _redoStack: unknown[];
    };

    // Make some changes
    elementWithHistory.data = [{ name: 'Alice' }];
    elementWithHistory.data = [{ name: 'Bob' }];
    elementWithHistory.data = [{ name: 'Charlie' }];

    // Clear history
    elementWithHistory.clearHistory();

    // History should be empty
    expect(elementWithHistory._history.length).toBe(0);
    expect(elementWithHistory._redoStack.length).toBe(0);
  });

  test('TC-013-02: canUndo/canRedo false after clear', () => {
    type RowData = { name: string };
    const elementWithHistory = element as unknown as {
      data: RowData[];
      undo: () => void;
      clearHistory: () => void;
      canUndo: boolean;
      canRedo: boolean;
    };

    // Make 3 changes and undo once to have both undo and redo states
    elementWithHistory.data = [{ name: 'Alice' }];
    elementWithHistory.data = [{ name: 'Bob' }];
    elementWithHistory.data = [{ name: 'Charlie' }];
    elementWithHistory.undo();

    // Verify we have both (history has Alice and Bob, redo has Charlie)
    expect(elementWithHistory.canUndo).toBe(true);
    expect(elementWithHistory.canRedo).toBe(true);

    // Clear history
    elementWithHistory.clearHistory();

    // Both should be false
    expect(elementWithHistory.canUndo).toBe(false);
    expect(elementWithHistory.canRedo).toBe(false);
  });
});

describe('Undo/Redo Readonly Mode', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
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

  test('undo blocked in readonly mode', () => {
    type RowData = { name: string };
    const elementWithUndo = element as unknown as {
      data: RowData[];
      undo: () => void;
      readonly: boolean;
    };

    // Set initial data and make a change
    elementWithUndo.data = [{ name: 'Alice' }];
    elementWithUndo.data = [{ name: 'Bob' }];

    // Enable readonly
    elementWithUndo.readonly = true;

    // Try undo
    elementWithUndo.undo();

    // Should still be Bob (undo blocked)
    expect(elementWithUndo.data[0].name).toBe('Bob');
  });

  test('redo blocked in readonly mode', () => {
    type RowData = { name: string };
    const elementWithRedo = element as unknown as {
      data: RowData[];
      undo: () => void;
      redo: () => void;
      readonly: boolean;
    };

    // Setup: set data, change, undo
    elementWithRedo.data = [{ name: 'Alice' }];
    elementWithRedo.data = [{ name: 'Bob' }];
    elementWithRedo.undo();

    // Enable readonly
    elementWithRedo.readonly = true;

    // Try redo
    elementWithRedo.redo();

    // Should still be Alice (redo blocked)
    expect(elementWithRedo.data[0].name).toBe('Alice');
  });
});
