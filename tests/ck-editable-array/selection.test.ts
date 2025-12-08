import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-017: Selection', () => {
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

  test('TC-017-01: select() adds index to selectedIndices', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      selectedIndices: number[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
    el.select(1);

    expect(el.selectedIndices).toContain(1);
  });

  test('TC-017-02: Row gets data-selected="true"', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];
    el.select(0);

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.getAttribute('data-selected')).toBe('true');
  });

  test('TC-017-03: Row gets aria-selected="true"', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];
    el.select(0);

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.getAttribute('aria-selected')).toBe('true');
  });

  test('TC-017-04: selectionchanged event dispatched', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];

    const handler = jest.fn();
    element.addEventListener('selectionchanged', handler);

    el.select(0);

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.selectedIndices).toContain(0);
  });

  test('TC-017-05: deselect() removes index', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      deselect: (index: number) => void;
      selectedIndices: number[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];
    el.select(0);
    el.select(1);
    el.deselect(0);

    expect(el.selectedIndices).not.toContain(0);
    expect(el.selectedIndices).toContain(1);
  });

  test('TC-017-06: toggleSelection() toggles state', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      toggleSelection: (index: number) => void;
      isSelected: (index: number) => boolean;
    };

    el.data = [{ name: 'Alice' }];

    // First toggle - selects
    el.toggleSelection(0);
    expect(el.isSelected(0)).toBe(true);

    // Second toggle - deselects
    el.toggleSelection(0);
    expect(el.isSelected(0)).toBe(false);
  });

  test('TC-017-07: isSelected() returns correct state', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      isSelected: (index: number) => boolean;
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];

    expect(el.isSelected(0)).toBe(false);
    el.select(0);
    expect(el.isSelected(0)).toBe(true);
    expect(el.isSelected(1)).toBe(false);
  });
});

describe('FR-017a: Select All', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-017a-01: selectAll() selects all rows', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      selectAll: () => void;
      selectedIndices: number[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
    el.selectAll();

    expect(el.selectedIndices).toEqual([0, 1, 2]);
  });
});

describe('FR-017b: Clear Selection', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-017b-01: clearSelection() clears all', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      clearSelection: () => void;
      selectedIndices: number[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];
    el.select(0);
    el.select(1);
    el.clearSelection();

    expect(el.selectedIndices).toEqual([]);
  });

  test('TC-017b-02: deselectAll() clears all', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      deselectAll: () => void;
      selectedIndices: number[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];
    el.select(0);
    el.select(1);
    el.deselectAll();

    expect(el.selectedIndices).toEqual([]);
  });
});

describe('FR-017c: Delete Selected', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-017c-01: deleteSelected() removes rows', () => {
    type RowData = { name: string; deleted?: boolean };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      deleteSelected: () => void;
      _data: RowData[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
    el.select(0);
    el.select(2);
    el.deleteSelected();

    // Soft delete - marked as deleted
    expect(el._data[0].deleted).toBe(true);
    expect(el._data[1].deleted).toBeUndefined();
    expect(el._data[2].deleted).toBe(true);
  });

  test('TC-017c-02: Selection cleared after delete', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      deleteSelected: () => void;
      selectedIndices: number[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }];
    el.select(0);
    el.deleteSelected();

    expect(el.selectedIndices).toEqual([]);
  });
});

describe('FR-017d: Mark Selected Deleted', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-017d-01: markSelectedDeleted() soft deletes', () => {
    type RowData = { name: string; deleted?: boolean };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      markSelectedDeleted: () => void;
      _data: RowData[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
    el.select(1);
    el.markSelectedDeleted();

    expect(el._data[0].deleted).toBeUndefined();
    expect(el._data[1].deleted).toBe(true);
    expect(el._data[2].deleted).toBeUndefined();
  });
});

describe('FR-017e: Bulk Update', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <span data-bind="status"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-017e-01: bulkUpdate() updates selected rows', () => {
    type RowData = { name: string; status: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      bulkUpdate: (updates: Partial<RowData>) => void;
    };

    el.data = [
      { name: 'Alice', status: 'active' },
      { name: 'Bob', status: 'active' },
      { name: 'Charlie', status: 'active' },
    ];

    el.select(0);
    el.select(2);
    el.bulkUpdate({ status: 'inactive' });

    expect(el.data[0].status).toBe('inactive');
    expect(el.data[1].status).toBe('active');
    expect(el.data[2].status).toBe('inactive');
  });

  test('TC-017e-02: getSelectedData() returns selected data', () => {
    type RowData = { name: string };
    const el = element as unknown as {
      data: RowData[];
      select: (index: number) => void;
      getSelectedData: () => RowData[];
    };

    el.data = [{ name: 'Alice' }, { name: 'Bob' }, { name: 'Charlie' }];
    el.select(0);
    el.select(2);

    const selectedData = el.getSelectedData();
    expect(selectedData).toHaveLength(2);
    expect(selectedData[0].name).toBe('Alice');
    expect(selectedData[1].name).toBe('Charlie');
  });
});
