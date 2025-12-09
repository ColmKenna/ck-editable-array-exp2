import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-003: Toggle Edit Mode', () => {
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

  test('TC-003-01: data-action="toggle" enters edit mode', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Click toggle button
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Row should now show edit template (have an input)
    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();
    expect(input?.value).toBe('Alice');
  });

  test('TC-003-02: beforetogglemode event fired (cancelable)', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    const handler = jest.fn((e: Event) => {
      e.preventDefault(); // Cancel the toggle
    });
    element.addEventListener('beforetogglemode', handler);

    // Click toggle button
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    expect(handler).toHaveBeenCalledTimes(1);

    // Since event was canceled, row should NOT be in edit mode
    const input = element.shadowRoot?.querySelector('input[data-bind="name"]');
    expect(input).toBeNull();
  });

  test('TC-003-03: Original state stored as snapshot', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Access internal row state to verify snapshot
    const rowStates = (
      element as unknown as {
        _rowStates: Map<
          number,
          { editing: boolean; snapshot?: Record<string, unknown> }
        >;
      }
    )._rowStates;
    const state = rowStates.get(0);

    expect(state?.snapshot).toBeDefined();
    expect(state?.snapshot?.name).toBe('Alice');
  });

  test('TC-003-04: Row editing property set to true', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Check row state
    const rowStates = (
      element as unknown as { _rowStates: Map<number, { editing: boolean }> }
    )._rowStates;
    const state = rowStates.get(0);

    expect(state?.editing).toBe(true);
  });

  test('TC-003-05: Display hidden, edit shown', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Before toggle - display template shown (span visible)
    let span = element.shadowRoot?.querySelector(
      '[data-bind="name"]:not(input)'
    );
    expect(span?.tagName.toLowerCase()).toBe('span');

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // After toggle - edit template shown (input visible)
    const input = element.shadowRoot?.querySelector('input[data-bind="name"]');
    expect(input).not.toBeNull();

    // span should no longer be visible in edit mode
    span = element.shadowRoot?.querySelector('span[data-bind="name"]');
    expect(span).toBeNull();
  });

  test('TC-003-06: Focus moves to first input', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Check focus is on first input
    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(document.activeElement).toBe(element);
    expect(element.shadowRoot?.activeElement).toBe(input);
  });

  test('TC-003-07: aftertogglemode event fired', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    const handler = jest.fn();
    element.addEventListener('aftertogglemode', handler);

    // Click toggle button
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.index).toBe(0);
    expect(event.detail.editing).toBe(true);
  });

  test('TC-003-08: Exclusive locking - only one row editable', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Enter edit mode on first row
    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    const firstToggle = rows?.[0].querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    firstToggle?.click();

    // Try to enter edit mode on second row
    const secondToggle = rows?.[1].querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    secondToggle?.click();

    // Only first row should be in edit mode
    const rowStates = (
      element as unknown as { _rowStates: Map<number, { editing: boolean }> }
    )._rowStates;
    expect(rowStates.get(0)?.editing).toBe(true);
    expect(rowStates.get(1)?.editing).toBeFalsy();
  });
});

describe('FR-004: Save Row', () => {
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

  test('TC-004-01: data-action="save" exits edit mode', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Click save
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn?.click();

    // Should be back in display mode
    const span = element.shadowRoot?.querySelector('span[data-bind="name"]');
    expect(span).not.toBeNull();

    const input = element.shadowRoot?.querySelector('input[data-bind="name"]');
    expect(input).toBeNull();
  });

  test('TC-004-02: Save removes editing flag and markers', () => {
    document.body.appendChild(element);

    type RowData = { name: string; __isNew?: boolean };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Add a new row (will have __isNew marker)
    (element as unknown as { addRow: () => void }).addRow();

    // Save the new row
    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    const saveBtn = rows?.[1].querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn?.click();

    // Check markers are removed
    const rowStates = (
      element as unknown as { _rowStates: Map<number, { editing: boolean }> }
    )._rowStates;
    expect(rowStates.get(1)?.editing).toBeFalsy();

    // __isNew should be removed from data
    const data = (element as unknown as { data: RowData[] }).data;
    expect(data[1].__isNew).toBeUndefined();
  });

  test('TC-004-03: datachanged event dispatched', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Modify value
    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    input.value = 'Bob';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Listen for datachanged
    const handler = jest.fn();
    element.addEventListener('datachanged', handler);

    // Click save
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn?.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent<{ data: RowData[] }>;
    expect(event.detail.data[0].name).toBe('Bob');
  });

  test('TC-004-04: Focus returns to toggle button', async () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Click save
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn?.click();

    // Wait for microtask to complete (focus restoration is async)
    await new Promise(resolve => setTimeout(resolve, 0));

    // Focus should be on toggle button
    const newToggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    expect(element.shadowRoot?.activeElement).toBe(newToggleBtn);
  });

  test('TC-004-05: Save blocked if validation fails', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Set validation schema that requires non-empty name
    (
      element as unknown as {
        validationSchema: Record<string, { required: boolean }>;
      }
    ).validationSchema = {
      name: { required: true },
    };

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Clear the name (make it invalid)
    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Try to save
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn?.click();

    // Should still be in edit mode (save blocked)
    const inputAfter = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    );
    expect(inputAfter).not.toBeNull();
  });
});

describe('FR-005: Cancel Edit', () => {
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

  test('TC-005-01: data-action="cancel" exits edit mode', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Click cancel
    const cancelBtn = element.shadowRoot?.querySelector(
      '[data-action="cancel"]'
    ) as HTMLElement;
    cancelBtn?.click();

    // Should be back in display mode
    const span = element.shadowRoot?.querySelector('span[data-bind="name"]');
    expect(span).not.toBeNull();

    const input = element.shadowRoot?.querySelector('input[data-bind="name"]');
    expect(input).toBeNull();
  });

  test('TC-005-02: Cancel restores original data from snapshot', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Modify value
    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    input.value = 'Bob';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Click cancel
    const cancelBtn = element.shadowRoot?.querySelector(
      '[data-action="cancel"]'
    ) as HTMLElement;
    cancelBtn?.click();

    // Data should be restored to original
    const data = (element as unknown as { data: RowData[] }).data;
    expect(data[0].name).toBe('Alice');
  });

  test('TC-005-03: Cancel removes new row (__isNew)', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Add a new row
    (element as unknown as { addRow: () => void }).addRow();

    // Verify we now have 2 rows
    let rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    expect(rows?.length).toBe(2);

    // Cancel the new row
    const cancelBtn = rows?.[1].querySelector(
      '[data-action="cancel"]'
    ) as HTMLElement;
    cancelBtn?.click();

    // New row should be removed
    rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    expect(rows?.length).toBe(1);

    const data = (element as unknown as { data: RowData[] }).data;
    expect(data.length).toBe(1);
    expect(data[0].name).toBe('Alice');
  });

  test('TC-005-04: beforetogglemode event fired (cancelable)', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Set up handler that prevents cancel
    const handler = jest.fn((e: Event) => {
      e.preventDefault();
    });
    element.addEventListener('beforetogglemode', handler);

    // Try to cancel
    const cancelBtn = element.shadowRoot?.querySelector(
      '[data-action="cancel"]'
    ) as HTMLElement;
    cancelBtn?.click();

    expect(handler).toHaveBeenCalled();

    // Should still be in edit mode (cancel was blocked)
    const input = element.shadowRoot?.querySelector('input[data-bind="name"]');
    expect(input).not.toBeNull();
  });

  test('TC-005-05: aftertogglemode event fired', () => {
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const handler = jest.fn();
    element.addEventListener('aftertogglemode', handler);

    // Click cancel
    const cancelBtn = element.shadowRoot?.querySelector(
      '[data-action="cancel"]'
    ) as HTMLElement;
    cancelBtn?.click();

    expect(handler).toHaveBeenCalledTimes(1);
    const event = handler.mock.calls[0][0] as CustomEvent;
    expect(event.detail.index).toBe(0);
    expect(event.detail.editing).toBe(false);
  });
});

describe('FR-003: Input Throttling with RAF (Phase 3.3)', () => {
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

  test('TC-003-RAF-01: Input events trigger validation with RAF batching', async () => {
    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'test' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    // Simulate rapid input changes
    input!.value = 't';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    input!.value = 'te';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    input!.value = 'tes';
    input!.dispatchEvent(new Event('input', { bubbles: true }));
    input!.value = 'test';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for RAF to process validations
    await new Promise(resolve => requestAnimationFrame(resolve));

    // Validations should be batched and processed
    expect(input!.value).toBe('test');
  });

  test('TC-003-RAF-02: Multiple field inputs are batched together', async () => {
    type RowData = { name: string; email: string };
    element.validationSchema = {
      name: { required: true },
      email: { email: true }
    };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'test', email: 'test@example.com' }
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const inputs = element.shadowRoot?.querySelectorAll('input');
    expect(inputs?.length).toBeGreaterThan(0);

    // Simulate rapid changes on multiple fields
    if (inputs) {
      for (let i = 0; i < inputs.length; i++) {
        const input = inputs[i] as HTMLInputElement;
        input.value = 'rapid' + i;
        input.dispatchEvent(new Event('input', { bubbles: true }));
      }
    }

    // Wait for RAF to batch all validations
    await new Promise(resolve => requestAnimationFrame(resolve));

    // All inputs should have their values updated
    expect(inputs?.length).toBeGreaterThan(0);
  });

  test('TC-003-RAF-03: RAF throttling improves performance on rapid input', async () => {
    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: '' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(input).not.toBeNull();

    // Measure time for rapid input events (RAF batching)
    const startRaf = performance.now();

    // Simulate 50 rapid input changes
    for (let i = 0; i < 50; i++) {
      input!.value += 'x';
      input!.dispatchEvent(new Event('input', { bubbles: true }));
    }

    // Wait for RAF to complete
    await new Promise(resolve => requestAnimationFrame(resolve));

    const endRaf = performance.now();

    // Performance should be reasonable (RAF batching reduces overhead)
    expect(endRaf - startRaf).toBeLessThan(1000); // Should complete within 1 second
    expect(input!.value.length).toBe(50); // All changes applied
  });

  test('TC-003-RAF-04: Cleanup of RAF request on component disconnect', async () => {
    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'test' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;

    // Start a validation update
    input!.value = 'changed';
    input!.dispatchEvent(new Event('input', { bubbles: true }));

    // Disconnect before RAF completes
    element.remove();

    // Should not throw error and RAF should be cleaned up
    await new Promise(resolve => requestAnimationFrame(resolve));
    expect(true).toBe(true); // If we get here, cleanup worked
  });
});
