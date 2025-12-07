import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-006: Delete Row (Soft Delete)', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="delete">Delete</button>
        <button data-action="restore">Restore</button>
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

  test('TC-006-01: data-action="delete" sets deleted:true', () => {
    document.body.appendChild(element);

    type RowData = { name: string; deleted?: boolean };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Click delete on first row
    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    const deleteBtn = rows?.[0].querySelector(
      '[data-action="delete"]'
    ) as HTMLElement;
    deleteBtn?.click();

    // Check deleted flag is set
    const internalData = (element as unknown as { _data: RowData[] })._data;
    expect(internalData[0].deleted).toBe(true);
    expect(internalData[1].deleted).toBeUndefined();
  });

  test('TC-006-02: Row receives ck-deleted class', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Click delete
    const deleteBtn = element.shadowRoot?.querySelector(
      '[data-action="delete"]'
    ) as HTMLElement;
    deleteBtn?.click();

    // Check row has ck-deleted class
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.classList.contains('ck-deleted')).toBe(true);
  });

  test('TC-006-03: datachanged event dispatched', () => {
    document.body.appendChild(element);

    type RowData = { name: string; deleted?: boolean };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    const handler = jest.fn();
    element.addEventListener('datachanged', handler);

    // Click delete
    const deleteBtn = element.shadowRoot?.querySelector(
      '[data-action="delete"]'
    ) as HTMLElement;
    deleteBtn?.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: RowData[] }>;
    expect(event.detail.data[0].deleted).toBe(true);
  });

  test('TC-006-04: Delete blocked when row editing', () => {
    document.body.appendChild(element);

    type RowData = { name: string; deleted?: boolean };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Try to delete (via programmatic method since delete button may not be visible in edit mode)
    (element as unknown as { deleteRow: (index: number) => void }).deleteRow(0);

    // Should not be deleted
    const internalData = (element as unknown as { _data: RowData[] })._data;
    expect(internalData[0].deleted).toBeUndefined();
  });

  test('TC-006-05: Delete blocked in readonly mode', () => {
    document.body.appendChild(element);

    type RowData = { name: string; deleted?: boolean };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];
    element.readonly = true;

    // Try to delete
    (element as unknown as { deleteRow: (index: number) => void }).deleteRow(0);

    // Should not be deleted
    const internalData = (element as unknown as { _data: RowData[] })._data;
    expect(internalData[0].deleted).toBeUndefined();
  });
});

describe('FR-007: Restore Row', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
        <button data-action="delete">Delete</button>
        <button data-action="restore">Restore</button>
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

  test('TC-007-01: data-action="restore" sets deleted:false', () => {
    document.body.appendChild(element);

    type RowData = { name: string; deleted?: boolean };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', deleted: true },
    ];

    // Click restore
    const restoreBtn = element.shadowRoot?.querySelector(
      '[data-action="restore"]'
    ) as HTMLElement;
    restoreBtn?.click();

    // Check deleted flag is removed
    const internalData = (element as unknown as { _data: RowData[] })._data;
    expect(internalData[0].deleted).toBe(false);
  });

  test('TC-007-02: ck-deleted class removed', () => {
    document.body.appendChild(element);

    type RowData = { name: string; deleted?: boolean };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', deleted: true },
    ];

    // Verify row has ck-deleted class initially
    let row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.classList.contains('ck-deleted')).toBe(true);

    // Click restore
    const restoreBtn = element.shadowRoot?.querySelector(
      '[data-action="restore"]'
    ) as HTMLElement;
    restoreBtn?.click();

    // Check class is removed
    row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.classList.contains('ck-deleted')).toBe(false);
  });

  test('TC-007-03: datachanged event dispatched', () => {
    document.body.appendChild(element);

    type RowData = { name: string; deleted?: boolean };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', deleted: true },
    ];

    const handler = jest.fn();
    element.addEventListener('datachanged', handler);

    // Click restore
    const restoreBtn = element.shadowRoot?.querySelector(
      '[data-action="restore"]'
    ) as HTMLElement;
    restoreBtn?.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: RowData[] }>;
    expect(event.detail.data[0].deleted).toBe(false);
  });
});
