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
    const saveBtn = modal?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
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
    const saveBtn = modal?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
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
    const saveBtn = modal?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
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
    const modalContent = modal?.querySelector('.ck-modal__content') as HTMLElement;

    // Click the modal content
    modalContent?.click();

    // Modal should still be open
    expect(modal?.classList.contains('ck-hidden')).toBe(false);
    expect(modal?.getAttribute('aria-hidden')).toBe('false');
  });
});
