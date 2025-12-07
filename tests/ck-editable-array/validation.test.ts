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
});
