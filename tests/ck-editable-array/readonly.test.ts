import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-028: Readonly Mode', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-028-01: readonly attribute blocks all modifications', () => {
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
    element.setAttribute('readonly', '');
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Try to enter edit mode - should be blocked
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Should still be in display mode (no input visible in shadow)
    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    expect(input).toBeNull();

    // Data should remain unchanged
    const data = (element as unknown as { data: RowData[] }).data;
    expect(data[0].name).toBe('Alice');
  });

  test('TC-028-02: Inputs have readOnly property set', () => {
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
        <textarea data-bind="bio"></textarea>
      </template>
    `;
    element.setAttribute('readonly', '');
    document.body.appendChild(element);

    type RowData = { name: string; bio: string };
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', bio: 'Developer' },
    ];

    // Force render the edit template to check input readOnly
    // Since readonly blocks edit mode, we need to test by setting readonly after entering edit
    element.removeAttribute('readonly');
    (element as unknown as { readonly: boolean }).readonly = false;

    // Re-set data to trigger render
    (element as unknown as { data: RowData[] }).data = [
      { name: 'Alice', bio: 'Developer' },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Now set readonly
    (element as unknown as { readonly: boolean }).readonly = true;

    // Check that inputs are readonly
    const input = element.shadowRoot?.querySelector(
      'input[data-bind="name"]'
    ) as HTMLInputElement;
    const textarea = element.shadowRoot?.querySelector(
      'textarea[data-bind="bio"]'
    ) as HTMLTextAreaElement;

    expect(input?.readOnly).toBe(true);
    expect(textarea?.readOnly).toBe(true);
  });
});
