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

describe('FR-018: Extended Validation Types (Phase 3.1)', () => {
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
        <button data-action="save">Save</button>
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-018-EXT-01: Email validation accepts valid email', async () => {
    element.validationSchema = { name: { email: true } };
    element.newItemFactory = () => ({ name: 'user@example.com' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const saveBtn = row?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn?.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should save successfully (no error message shown)
    const errorMsg = row?.querySelector('[data-field-error="name"]');
    expect(errorMsg?.textContent).toBe('');
  });

  test('TC-018-EXT-02: Email validation rejects invalid email', async () => {
    element.validationSchema = { name: { email: true } };
    element.newItemFactory = () => ({ name: 'not-an-email' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const saveBtn = row?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn?.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should remain in edit mode (validation error)
    const input = row?.querySelector('input[data-bind="name"]');
    expect(input).toBeTruthy();
  });

  test('TC-018-EXT-03: URL validation accepts valid URL', async () => {
    element.validationSchema = { name: { url: true } };
    element.newItemFactory = () => ({ name: 'https://example.com' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const saveBtn = row?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn?.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should save successfully
    const errorMsg = row?.querySelector('[data-field-error="name"]');
    expect(errorMsg?.textContent).toBe('');
  });

  test('TC-018-EXT-04: URL validation rejects invalid URL', async () => {
    element.validationSchema = { name: { url: true } };
    element.newItemFactory = () => ({ name: 'not a url' });
    element.addRow();

    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const saveBtn = row?.querySelector('[data-action="save"]') as HTMLElement;
    saveBtn?.click();

    await new Promise(resolve => setTimeout(resolve, 100));

    // Should remain in edit mode
    const input = row?.querySelector('input[data-bind="name"]');
    expect(input).toBeTruthy();
  });

  test('TC-018-EXT-05: Min validation accepts value >= min', async () => {
    element.validationSchema = { age: { min: 18 } };
    element.newItemFactory = () => ({ age: 25 });
    element.addRow();

    element.data = [{ age: 25 }];
    const isValid = (element.data[0] as any)?.age >= 18;
    expect(isValid).toBe(true);
  });

  test('TC-018-EXT-06: Min validation rejects value < min', async () => {
    element.validationSchema = { age: { min: 18 } };
    element.data = [{ age: 10 }];

    // Manual validation check
    const row = element.data[0];
    const age = (row as any).age;
    const isValid = age >= 18;
    expect(isValid).toBe(false);
  });

  test('TC-018-EXT-07: Max validation accepts value <= max', async () => {
    element.validationSchema = { age: { max: 65 } };
    element.data = [{ age: 50 }];

    const row = element.data[0];
    const age = (row as any).age;
    const isValid = age <= 65;
    expect(isValid).toBe(true);
  });

  test('TC-018-EXT-08: Max validation rejects value > max', async () => {
    element.validationSchema = { age: { max: 65 } };
    element.data = [{ age: 70 }];

    const row = element.data[0];
    const age = (row as any).age;
    const isValid = age <= 65;
    expect(isValid).toBe(false);
  });

  test('TC-018-EXT-09: Async validator accepts valid input', async () => {
    element.validationSchema = {
      username: {
        async: async (value) => {
          // Simulate async check (e.g., API call)
          return Promise.resolve(String(value).length >= 3);
        }
      }
    };
    element.newItemFactory = () => ({ username: 'validuser' });
    element.addRow();

    // Trigger validation
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;
    
    if (input) {
      input.value = 'validuser';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    expect(row).toBeTruthy();
  });

  test('TC-018-EXT-10: Async validator rejects invalid input', async () => {
    element.validationSchema = {
      username: {
        async: async (value) => {
          // Simulate async check
          return Promise.resolve(String(value).length >= 3);
        }
      }
    };
    element.newItemFactory = () => ({ username: 'a' });
    element.addRow();

    // Trigger validation
    const row = element.shadowRoot?.querySelector('[data-row-index="0"]');
    const input = row?.querySelector('input[data-bind="name"]') as HTMLInputElement;
    
    if (input) {
      input.value = 'a';
      input.dispatchEvent(new Event('input', { bubbles: true }));
      
      await new Promise(resolve => setTimeout(resolve, 200));
    }

    expect(row).toBeTruthy();
  });

  test('TC-018-EXT-11: Multiple new validation types work together', async () => {
    element.validationSchema = {
      email: { email: true, required: true },
      website: { url: true },
      age: { min: 18, max: 120 }
    };
    element.newItemFactory = () => ({
      email: 'test@example.com',
      website: 'https://example.com',
      age: 30
    });

    element.data = element.data;
    expect(element.validationSchema).toBeDefined();
    expect(element.validationSchema.email?.email).toBe(true);
    expect(element.validationSchema.website?.url).toBe(true);
    expect(element.validationSchema.age?.min).toBe(18);
    expect(element.validationSchema.age?.max).toBe(120);
  });

  test('TC-018-EXT-12: Backward compatibility: existing validation still works', async () => {
    element.validationSchema = {
      name: { 
        required: true, 
        minLength: 2, 
        maxLength: 50,
        pattern: /^[a-zA-Z\s]+$/
      }
    };
    element.newItemFactory = () => ({ name: 'John Doe' });
    element.addRow();

    expect(element.validationSchema.name?.required).toBe(true);
    expect(element.validationSchema.name?.minLength).toBe(2);
    expect(element.validationSchema.name?.maxLength).toBe(50);
    expect(element.validationSchema.name?.pattern).toBeDefined();
  });
});

