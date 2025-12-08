import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-026: Modal Edit Toggle', () => {
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

  test('TC-026-01: modalEdit=true renders edit in modal', () => {
    document.body.appendChild(element);

    // Enable modal edit mode
    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Click toggle button to enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Edit template should be rendered in modal, not inline
    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal).not.toBeNull();

    const modalInput = modal?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(modalInput).not.toBeNull();
    expect(modalInput?.value).toBe('Alice');
  });

  test('TC-026-02: modal-edit attribute enables modal', () => {
    element.setAttribute('modal-edit', '');
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Click toggle button
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Edit template should be in modal
    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal).not.toBeNull();

    const modalInput = modal?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(modalInput).not.toBeNull();
  });

  test('TC-026-03: Modal overlay shown (ck-hidden removed)', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Modal should be hidden initially
    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal?.classList.contains('ck-hidden')).toBe(true);

    // Click toggle button
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Modal should now be visible
    expect(modal?.classList.contains('ck-hidden')).toBe(false);
  });

  test('TC-026-04: aria-hidden="false" on modal', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Click toggle button
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Modal should have aria-hidden="false"
    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal?.getAttribute('aria-hidden')).toBe('false');
  });

  test('TC-026-05: Focus trapped in modal', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Click toggle button
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Focus should be on first input in modal
    const modalInput = element.shadowRoot?.querySelector(
      '.ck-modal input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(document.activeElement).toBe(element);
    expect(element.shadowRoot?.activeElement).toBe(modalInput);
  });
});

describe('FR-027: Modal Close on Save/Cancel', () => {
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

  test('TC-027-01: Save closes modal', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Modal should be visible
    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal?.classList.contains('ck-hidden')).toBe(false);

    // Click save button in modal
    const saveBtn = modal?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn?.click();

    // Modal should be hidden
    expect(modal?.classList.contains('ck-hidden')).toBe(true);
  });

  test('TC-027-02: Cancel closes modal', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Modal should be visible
    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal?.classList.contains('ck-hidden')).toBe(false);

    // Click cancel button in modal
    const cancelBtn = modal?.querySelector(
      '[data-action="cancel"]'
    ) as HTMLElement;
    cancelBtn?.click();

    // Modal should be hidden
    expect(modal?.classList.contains('ck-hidden')).toBe(true);
  });

  test('TC-027-03: aria-hidden="true" when closed', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal?.getAttribute('aria-hidden')).toBe('false');

    // Close modal by clicking save
    const saveBtn = modal?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn?.click();

    // Modal should have aria-hidden="true"
    expect(modal?.getAttribute('aria-hidden')).toBe('true');
  });

  test('TC-027-04: Focus returns to toggle button', async () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Close modal by clicking save
    const saveBtn = modal?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn?.click();

    // Wait for microtask to complete (focus restoration is async)
    await new Promise(resolve => setTimeout(resolve, 0));

    // Focus should return to toggle button (query again as DOM was re-rendered)
    const newToggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    expect(element.shadowRoot?.activeElement).toBe(newToggleBtn);
  });

  test('TC-027-05: Clicking overlay closes modal', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal?.classList.contains('ck-hidden')).toBe(false);

    // Click the overlay (not the content)
    modal?.click();

    // Modal should be closed
    expect(modal?.classList.contains('ck-hidden')).toBe(true);
    expect(modal?.getAttribute('aria-hidden')).toBe('true');
  });

  test('TC-027-06: Clicking modal content does not close modal', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    const modalContent = modal?.querySelector(
      '.ck-modal__content'
    ) as HTMLElement;

    // Click the modal content
    modalContent?.click();

    // Modal should still be open
    expect(modal?.classList.contains('ck-hidden')).toBe(false);
    expect(modal?.getAttribute('aria-hidden')).toBe('false');
  });
});

describe('FR-028: Modal Validation Failure Indication', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    jest.useFakeTimers();
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <button data-action="toggle">Edit</button>
      </template>
      <template data-slot="edit">
        <div>
          <input data-bind="name" type="text" placeholder="Name (required, min 3)" />
          <span data-field-error="name"></span>
        </div>
        <div>
          <input data-bind="email" type="email" placeholder="Email (required)" />
          <span data-field-error="email"></span>
        </div>
        <div data-error-summary></div>
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
  });

  afterEach(() => {
    element.remove();
    jest.useRealTimers();
  });

  test('TC-028-01: Modal displays validation errors when validation fails', () => {
    document.body.appendChild(element);

    // Enable modal edit mode
    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    // Set validation schema
    type RowData = { name: string; email: string };
    (element as unknown as { validationSchema: unknown }).validationSchema = {
      name: {
        required: true,
        minLength: 3,
      },
      email: {
        required: true,
      },
    };

    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
    ];

    // Enter edit mode - modal should show
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;
    expect(modal?.classList.contains('ck-hidden')).toBe(false);

    // Clear the name field to trigger validation error
    const nameInput = modal?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounce (validation debounces at 150ms)
    jest.advanceTimersByTime(200);

    // The name field should show invalid state
    expect(nameInput?.getAttribute('aria-invalid')).toBe('true');
    expect(nameInput?.getAttribute('data-invalid')).toBe('true');

    // Error message should be displayed
    const errorMsg = modal?.querySelector(
      '[data-field-error="name"]'
    ) as HTMLElement;
    expect(errorMsg?.textContent).toBeTruthy();
  });

  test('TC-028-02: Save button is disabled in modal when validation fails', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { validationSchema: unknown }).validationSchema = {
      name: {
        required: true,
        minLength: 3,
      },
      email: {
        required: true,
      },
    };

    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Clear the name field to trigger validation error
    const nameInput = modal?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    jest.advanceTimersByTime(200);

    // Save button should be disabled
    const saveBtn = modal?.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;
    expect(saveBtn?.disabled).toBe(true);
    expect(saveBtn?.getAttribute('aria-disabled')).toBe('true');
  });

  test('TC-028-03: Error summary displays all field errors in modal', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { validationSchema: unknown }).validationSchema = {
      name: {
        required: true,
        minLength: 3,
      },
      email: {
        required: true,
      },
    };

    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Clear both fields to trigger validation errors
    const nameInput = modal?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    const emailInput = modal?.querySelector(
      'input[data-bind="email"]'
    ) as HTMLInputElement;

    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    emailInput.value = '';
    emailInput.dispatchEvent(new Event('input', { bubbles: true }));

    jest.advanceTimersByTime(200);

    // Error summary should show all errors
    const errorSummary = modal?.querySelector(
      '[data-error-summary]'
    ) as HTMLElement;
    expect(errorSummary?.textContent).toBeTruthy();
    // Summary should contain error messages for both fields
    expect(errorSummary?.textContent?.length).toBeGreaterThan(0);
  });

  test('TC-028-04: Modal shows that validation was corrected when errors clear', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { validationSchema: unknown }).validationSchema = {
      name: {
        required: true,
        minLength: 3,
      },
      email: {
        required: true,
      },
    };

    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Clear the name field to trigger validation error
    const nameInput = modal?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    jest.advanceTimersByTime(200);

    // Save button should be disabled
    const saveBtn = modal?.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;
    expect(saveBtn?.disabled).toBe(true);

    // Now correct the error by entering valid data
    nameInput.value = 'Bob';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    jest.advanceTimersByTime(200);

    // Save button should now be enabled
    expect(saveBtn?.disabled).toBe(false);
    expect(saveBtn?.getAttribute('aria-disabled')).not.toBe('true');

    // aria-invalid should be removed from name input
    expect(nameInput?.getAttribute('aria-invalid')).not.toBe('true');
  });

  test('TC-028-05: Modal row gets data-row-invalid when validation fails', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { validationSchema: unknown }).validationSchema = {
      name: {
        required: true,
        minLength: 3,
      },
      email: {
        required: true,
      },
    };

    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Clear the name field to trigger validation error
    const nameInput = modal?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    nameInput.value = '';
    nameInput.dispatchEvent(new Event('input', { bubbles: true }));

    jest.advanceTimersByTime(200);

    // Modal row should have data-row-invalid attribute
    const modalRowEl = modal?.querySelector('[data-row-index="0"]');
    expect(modalRowEl?.getAttribute('data-row-invalid')).toBe('true');
  });
});

describe('FR-029: Modal Hidden Row Edits for Form Submission', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <span data-bind="email"></span>
        <button data-action="toggle">Edit</button>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
        <input data-bind="email" type="email" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-029-01: Modal mode renders hidden edit inputs for all rows', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' },
    ];

    // Click to edit row 0
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Modal should have input for each row (3 rows total)
    // Only one row should be visible (editing row 0)
    const allInputs = modal?.querySelectorAll(
      'input[data-bind="name"]'
    ) as NodeListOf<HTMLElement>;
    expect(allInputs.length).toBe(3);

    // Check that rows 1 and 2 are hidden
    const row1 = modal?.querySelector('[data-row-index="1"]') as HTMLElement;
    const row2 = modal?.querySelector('[data-row-index="2"]') as HTMLElement;

    expect(row1?.classList.contains('ck-hidden')).toBe(true);
    expect(row2?.classList.contains('ck-hidden')).toBe(true);
  });

  test('TC-029-02: Hidden rows in modal preserve all field values', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ];

    // Edit row 0
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Get all name inputs
    const nameInputs = modal?.querySelectorAll(
      'input[data-bind="name"]'
    ) as NodeListOf<HTMLInputElement>;

    // Row 0 (visible) should have Alice
    expect(nameInputs[0]?.value).toBe('Alice');

    // Row 1 (hidden) should have Bob
    expect(nameInputs[1]?.value).toBe('Bob');
  });

  test('TC-029-03: Changes to hidden rows are preserved in data', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ];

    // Edit row 0
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Find hidden row 1's input and change it
    const allNameInputs = modal?.querySelectorAll(
      'input[data-bind="name"]'
    ) as NodeListOf<HTMLInputElement>;

    // Row 1 is the second input
    const row1NameInput = allNameInputs[1] as HTMLInputElement;
    expect(row1NameInput?.closest('[data-row-index]')?.getAttribute('data-row-index')).toBe('1');

    // Change the hidden row's value
    row1NameInput.value = 'Bobby';
    row1NameInput.dispatchEvent(new Event('input', { bubbles: true }));

    // Get current data
    type DataType = { name: string; email: string };
    const currentData = (element as unknown as { data: DataType[] }).data;

    // Row 1 should have been updated
    expect(currentData[1]?.name).toBe('Bobby');
  });

  test('TC-029-04: Form submission includes hidden row inputs', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
    ];

    // Edit row 0
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Get form data
    const formData = (element as unknown as { toFormData: () => FormData }).toFormData();

    // FormData should contain entries for both rows
    const entries = Array.from(formData.entries());

    // Check that we have entries for both rows
    const row0Entries = entries.filter(([key]) => key.includes('[0]'));
    const row1Entries = entries.filter(([key]) => key.includes('[1]'));

    expect(row0Entries.length).toBeGreaterThan(0);
    expect(row1Entries.length).toBeGreaterThan(0);
  });

  test('TC-029-05: Only editing row is visible, others have ck-hidden class', () => {
    document.body.appendChild(element);

    (element as unknown as { modalEdit: boolean }).modalEdit = true;

    type RowData = { name: string; email: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', email: 'alice@example.com' },
      { name: 'Bob', email: 'bob@example.com' },
      { name: 'Charlie', email: 'charlie@example.com' },
    ];

    // Edit row 1 (not row 0)
    const toggleBtns = element.shadowRoot?.querySelectorAll(
      '[data-action="toggle"]'
    ) as NodeListOf<HTMLElement>;
    (toggleBtns[1] as HTMLElement)?.click();

    const modal = element.shadowRoot?.querySelector('.ck-modal') as HTMLElement;

    // Row 0 and 2 should be hidden
    const row0 = modal?.querySelector('[data-row-index="0"]') as HTMLElement;
    const row1 = modal?.querySelector('[data-row-index="1"]') as HTMLElement;
    const row2 = modal?.querySelector('[data-row-index="2"]') as HTMLElement;

    expect(row0?.classList.contains('ck-hidden')).toBe(true);
    expect(row1?.classList.contains('ck-hidden')).toBe(false);
    expect(row2?.classList.contains('ck-hidden')).toBe(true);
  });
});
