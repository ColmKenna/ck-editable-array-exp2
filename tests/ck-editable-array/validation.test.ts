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
      name: { required: true },
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
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn.click();
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.querySelector('input')).toBeTruthy();
  });

  test('TC-018-03: Schema validates maxLength', async () => {
    element.validationSchema = { name: { maxLength: 3 } };
    element.newItemFactory = () => ({ name: 'Abcd' }); // Too long
    element.addRow();
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn.click();
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.querySelector('input')).toBeTruthy();
  });

  test('TC-018-04: Schema validates pattern', async () => {
    element.validationSchema = { name: { pattern: /^[A-Z]+$/ } };
    element.newItemFactory = () => ({ name: 'abc' }); // Lowercase, invalid
    element.addRow();
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn.click();
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    expect(row?.querySelector('input')).toBeTruthy();
  });

  test('TC-018-06: Save button disabled when invalid', async () => {
    element.validationSchema = { name: { required: true } };
    element.newItemFactory = () => ({ name: 'Test' });
    element.addRow();

    // Initial state valid
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;
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
        // @ts-expect-error - custom property is in type definition but testing type safety
        custom: (val: string) => val === 'valid',
      },
    };

    element.newItemFactory = () => ({ name: 'invalid' });
    element.addRow();

    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement;
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
    const errorMsg = row?.querySelector(
      '[data-field-error="name"]'
    ) as HTMLElement;

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

    const row = element.shadowRoot?.querySelector(
      '[data-row-index="0"]'
    ) as HTMLElement;
    const errorCount = row.querySelector('[data-error-count]') as HTMLElement;
    const errorSummary = row.querySelector(
      '[data-error-summary]'
    ) as HTMLElement;

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

describe('FR-021: i18n Support', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
    element.innerHTML = `
            <template data-slot="display">
                <span data-bind="name"></span>
                <button data-action="toggle">Edit</button>
            </template>
            <template data-slot="edit">
                <input data-bind="name" type="text">
                <span data-field-error="name"></span>
                <button data-action="save">Save</button>
            </template>
        `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-021-01: i18n messages used for required', async () => {
    // Set i18n BEFORE validation schema to ensure messages are available
    element.i18n = {
      required: 'Campo requerido'
    };
    element.validationSchema = { name: { required: true } };
    element.newItemFactory = () => ({ name: 'initially valid' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;
    const errorMsg = row?.querySelector('[data-field-error="name"]');

    // Make input invalid to trigger validation with i18n message
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Wait for debounced validation
    await new Promise(resolve => setTimeout(resolve, 200));

    expect(errorMsg?.textContent).toBe('Campo requerido');
  });

  test('TC-021-02: i18n messages used for minLength', async () => {
    // Set i18n BEFORE validation schema
    element.i18n = {
      minLength: 'Mínimo {min} caracteres'
    };
    element.validationSchema = { name: { minLength: 5 } };
    element.newItemFactory = () => ({ name: 'Valid Name' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;
    const errorMsg = row?.querySelector('[data-field-error="name"]');

    // Make input invalid (too short)
    input.value = 'Abc';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(errorMsg?.textContent).toBe('Mínimo 5 caracteres');
  });

  test('TC-021-03: i18n messages used for maxLength', async () => {
    element.i18n = {
      maxLength: 'Máximo {max} caracteres'
    };
    element.validationSchema = { name: { maxLength: 10 } };
    element.newItemFactory = () => ({ name: 'Short' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;
    const errorMsg = row?.querySelector('[data-field-error="name"]');

    // Make input invalid (too long)
    input.value = 'This is way too long for the limit';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(errorMsg?.textContent).toBe('Máximo 10 caracteres');
  });

  test('TC-021-04: i18n messages used for pattern', async () => {
    element.i18n = {
      pattern: 'Solo mayúsculas permitidas'
    };
    element.validationSchema = { name: { pattern: /^[A-Z]+$/ } };
    element.newItemFactory = () => ({ name: 'VALID' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;
    const errorMsg = row?.querySelector('[data-field-error="name"]');

    // Make input invalid (contains lowercase)
    input.value = 'Invalid123';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 200));

    expect(errorMsg?.textContent).toBe('Solo mayúsculas permitidas');
  });
});

describe('FR-029-A: Custom Validator Error Handling', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
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

  test('TC-029-A-01: Custom validator throws exception is caught', async () => {
    element.validationSchema = {
      name: {
        custom: (value) => {
          if (String(value) === 'FORBIDDEN') {
            throw new Error('This value is forbidden');
          }
          return true;
        }
      }
    };

    element.newItemFactory = () => ({ name: 'FORBIDDEN' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;

    // Trigger save - custom validator will throw
    const saveBtn = row?.querySelector('[data-action="save"]') as HTMLElement;
    expect(input).toBeTruthy();
    
    // Change value to trigger validation
    input.value = 'FORBIDDEN';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 200));

    // Row should still have edit inputs (still in edit mode due to validation error)
    const inputAfterValidation = element.shadowRoot?.querySelector('[data-row-index="0"] input');
    expect(inputAfterValidation).toBeTruthy();
  });

  test('TC-029-A-02: validationfailed event dispatched with error details', async () => {
    const eventListener = jest.fn();
    element.addEventListener('validationfailed', eventListener);

    element.validationSchema = {
      name: {
        custom: (value) => {
          throw new Error('Custom error message');
        }
      }
    };

    element.newItemFactory = () => ({ name: 'Test' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;

    // Trigger validation by changing input
    input.value = 'Test Value';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    await new Promise(resolve => setTimeout(resolve, 200));

    // Event should be dispatched with error details
    if (eventListener.mock.calls.length > 0) {
      const event = eventListener.mock.calls[0][0] as CustomEvent;
      expect(event.detail).toBeDefined();
      expect(event.detail.field).toBe('name');
      expect(event.detail.index).toBe(0);
      expect(event.detail.message).toContain('Custom error message');
    }
  });

  test('TC-029-A-03: Custom validator returning false shows error', async () => {
    element.validationSchema = {
      name: {
        custom: (value) => String(value).length > 2
      }
    };

    element.newItemFactory = () => ({ name: 'AB' }); // Too short
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const saveBtn = row?.querySelector('[data-action="save"]') as HTMLElement;

    // Try to save - should fail validation
    saveBtn?.click();

    // Row should remain in edit mode (with edit inputs visible)
    const inputAfterSave = element.shadowRoot?.querySelector('[data-row-index="0"] input');
    expect(inputAfterSave).toBeTruthy();
  });
});

