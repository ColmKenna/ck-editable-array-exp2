import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-002: Add Row', () => {
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
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-002-01: data-action="add" creates new row', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Add a button with data-action="add" to trigger adding a new row
    const addBtn = document.createElement('button');
    addBtn.setAttribute('data-action', 'add');
    element.shadowRoot
      ?.querySelector('.ck-editable-array')
      ?.appendChild(addBtn);

    // Click add button
    addBtn.click();

    // Verify new row was added
    const data = (element as unknown as { data: RowData[] }).data;
    expect(data.length).toBe(2);
  });

  test('TC-002-02: New row uses newItemFactory', () => {
    document.body.appendChild(element);

    // Set custom factory that creates items with default values
    type RowData = { name: string; status: string };
    const factory = () => ({ name: '', status: 'pending' });
    (element as unknown as { newItemFactory: () => RowData }).newItemFactory =
      factory;

    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', status: 'active' },
    ];

    // Trigger add
    (element as unknown as { addRow: () => void }).addRow();

    const data = (element as unknown as { data: RowData[] }).data;
    expect(data.length).toBe(2);
    expect(data[1].name).toBe('');
    expect(data[1].status).toBe('pending');
  });

  test('TC-002-03: New row marked with __isNew', () => {
    document.body.appendChild(element);

    type RowData = { name: string; __isNew?: boolean };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Trigger add
    (element as unknown as { addRow: () => void }).addRow();

    // Access internal data to check __isNew marker
    const internalData = (element as unknown as { _data: RowData[] })._data;
    expect(internalData[1].__isNew).toBe(true);
  });

  test('TC-002-04: New row enters edit mode automatically', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Trigger add
    (element as unknown as { addRow: () => void }).addRow();

    // Check that the new row is in edit mode
    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    expect(rows?.length).toBe(2);

    // The new row (index 1) should show edit template (have an input)
    const newRowInput = rows?.[1].querySelector('input[data-bind="name"]');
    expect(newRowInput).not.toBeNull();
  });

  test('TC-002-05: Add blocked when another row editing', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode on first row
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Capture current data length
    const lengthBefore = (element as unknown as { data: RowData[] }).data
      .length;

    // Try to add - should be blocked
    (element as unknown as { addRow: () => void }).addRow();

    const lengthAfter = (element as unknown as { data: RowData[] }).data.length;
    expect(lengthAfter).toBe(lengthBefore);
  });

  test('TC-002-06: Add blocked in readonly mode', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];
    element.readonly = true;

    // Try to add - should be blocked
    (element as unknown as { addRow: () => void }).addRow();

    const data = (element as unknown as { data: RowData[] }).data;
    expect(data.length).toBe(1);
  });
});
