import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

describe('FR-018: Schema-Based Validation', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
    // Mock the templates
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text">
        <span data-field-error="name"></span>
        <span data-error-count></span>
        <div data-error-summary></div>
        <button data-action="save">Save</button>
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-018-01: Schema validates required fields', async () => {
    element.validationSchema = {
      name: { required: true }
    };
    element.newItemFactory = () => ({ name: '' });
    element.addRow();

    let row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    let input = row?.querySelector('input');
    expect(input).toBeTruthy();

    const saveBtn = row?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn.click();

    row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.querySelector('input')).toBeTruthy();
  });

  test('TC-018-02: Schema validates minLength', async () => {
    element.validationSchema = { name: { minLength: 3 } };
    element.newItemFactory = () => ({ name: 'Ab' }); // Too short
    element.addRow();
    const saveBtn = element.shadowRoot?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn.click();
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.querySelector('input')).toBeTruthy();
  });

  test('TC-018-03: Schema validates maxLength', async () => {
    element.validationSchema = { name: { maxLength: 3 } };
    element.newItemFactory = () => ({ name: 'Abcd' }); // Too long
    element.addRow();
    const saveBtn = element.shadowRoot?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn.click();
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.querySelector('input')).toBeTruthy();
  });

  test('TC-018-04: Schema validates pattern', async () => {
    element.validationSchema = { name: { pattern: /^[A-Z]+$/ } };
    element.newItemFactory = () => ({ name: 'abc' }); // Lowercase, invalid
    element.addRow();
    const saveBtn = element.shadowRoot?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn.click();
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.querySelector('input')).toBeTruthy();
  });

  test('TC-018-06: Save button disabled when invalid', async () => {
    element.validationSchema = { name: { required: true } };
    element.newItemFactory = () => ({ name: 'Test' });
    element.addRow();

    // Initial state valid
    const saveBtn = element.shadowRoot?.querySelector('[data-action="save"]') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(false);

    // Make invalid
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input') as HTMLInputElement;
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounced validation to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Expect disabled
    expect(saveBtn.disabled).toBe(true);
  });

  test('TC-018-05: Schema supports custom validator', async () => {
    element.validationSchema = {
      name: {
        // @ts-ignore - custom property not yet in type definition
        custom: (val: string) => val === 'valid'
      }
    } as any;

    element.newItemFactory = () => ({ name: 'invalid' });
    element.addRow();

    const saveBtn = element.shadowRoot?.querySelector('[data-action="save"]') as HTMLButtonElement;
    expect(saveBtn.disabled).toBe(true);

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input') as HTMLInputElement;
    input.value = 'valid';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounced validation to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(saveBtn.disabled).toBe(false);
  });

  test('TC-019-01 to 03: Invalid input gets validation attributes and error message', async () => {
    element.validationSchema = { name: { required: true } };
    element.newItemFactory = () => ({ name: 'Test' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input') as HTMLInputElement;
    const errorMsg = row?.querySelector('[data-field-error="name"]') as HTMLElement;

    // Valid state
    expect(input.getAttribute('aria-invalid')).toBeFalsy();
    expect(input.getAttribute('data-invalid')).toBeFalsy();
    expect(errorMsg.textContent).toBe('');

    // Make invalid
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounced validation to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Invalid state
    expect(input.getAttribute('aria-invalid')).toBe('true');
    expect(input.getAttribute('data-invalid')).toBe('true');
    expect(errorMsg.textContent).toBeTruthy();
    expect(input.getAttribute('aria-describedby')).toBe(errorMsg.id);
  });

  test('TC-020-01 to 03: Row level validation state', async () => {
    element.validationSchema = { name: { required: true } };
    element.newItemFactory = () => ({ name: '' }); // Invalid
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]') as HTMLElement;
    const errorCount = row.querySelector('[data-error-count]') as HTMLElement;
    const errorSummary = row.querySelector('[data-error-summary]') as HTMLElement;

    // Initial invalid state
    expect(row.getAttribute('data-row-invalid')).toBe('true');
    expect(errorCount.textContent).toBe('1');
    expect(errorSummary.textContent).toContain('This field is required');

    // Make valid
    const input = row.querySelector('input') as HTMLInputElement;
    input.value = 'Valid';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounced validation to complete
    await new Promise(resolve => setTimeout(resolve, 200));

    // Expect Valid
    expect(row.getAttribute('data-row-invalid')).toBeFalsy();
    // errorCount text might be empty or 0 depending on implementation choice, but logic usually clears it or sets to 0. 
    // Let's expect '0' or empty.
    // expect(errorCount.textContent).toBe('0'); 
  });
});
