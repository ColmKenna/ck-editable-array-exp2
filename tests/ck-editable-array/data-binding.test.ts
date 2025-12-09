import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-008: Data Binding - Display Mode', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-008-01: data-bind sets text content from field', () => {
    // Setup template with data-bind attribute
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
    `;
    document.body.appendChild(element);

    // Set data
    (element as unknown as { data: { name: string }[] }).data = [
      { name: 'Alice' },
      { name: 'Bob' },
    ];

    // Query shadow DOM for rendered rows
    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    expect(rows).toBeDefined();
    expect(rows?.length).toBe(2);

    // Check first row has correct bound value
    const firstRowSpan = rows?.[0].querySelector('[data-bind="name"]');
    expect(firstRowSpan?.textContent).toBe('Alice');

    // Check second row
    const secondRowSpan = rows?.[1].querySelector('[data-bind="name"]');
    expect(secondRowSpan?.textContent).toBe('Bob');
  });

  test('TC-008-02: Nested paths work (person.address.city)', () => {
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="person.address.city"></span>
      </template>
    `;
    document.body.appendChild(element);

    type NestedData = { person: { address: { city: string } } };
    (element as unknown as { data: NestedData[] }).data = [
      { person: { address: { city: 'New York' } } },
      { person: { address: { city: 'London' } } },
    ];

    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    expect(rows?.length).toBe(2);

    const firstRowSpan = rows?.[0].querySelector(
      '[data-bind="person.address.city"]'
    );
    expect(firstRowSpan?.textContent).toBe('New York');

    const secondRowSpan = rows?.[1].querySelector(
      '[data-bind="person.address.city"]'
    );
    expect(secondRowSpan?.textContent).toBe('London');
  });

  test('TC-008-03: Array values joined with comma separator', () => {
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="tags"></span>
      </template>
    `;
    document.body.appendChild(element);

    type TagData = { tags: string[] };
    (element as unknown as { data: TagData[] }).data = [
      { tags: ['javascript', 'typescript', 'web'] },
    ];

    const rows = element.shadowRoot?.querySelectorAll('[data-row-index]');
    expect(rows?.length).toBe(1);

    const span = rows?.[0].querySelector('[data-bind="tags"]');
    expect(span?.textContent).toBe('javascript, typescript, web');
  });
});

describe('FR-009: Data Binding - Edit Mode Input Values', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-009-01: Input value populated from data', () => {
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
      </template>
    `;
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode on first row
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Check input value is populated
    const input = element.shadowRoot?.querySelector(
      '[data-bind="name"]'
    ) as HTMLInputElement;
    expect(input?.value).toBe('Alice');
  });

  test('TC-009-02: Input changes update row data', () => {
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" />
      </template>
    `;
    document.body.appendChild(element);

    type RowData = { name: string };
    (element as unknown as { data: RowData[] }).data = [{ name: 'Alice' }];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    // Change input value
    const input = element.shadowRoot?.querySelector(
      '[data-bind="name"]'
    ) as HTMLInputElement;
    input.value = 'Bob';
    input.dispatchEvent(new Event('input', { bubbles: true }));

    // Save changes
    const saveBtn = element.shadowRoot?.querySelector(
      '[data-action="save"]'
    ) as HTMLElement;
    saveBtn?.click();

    // Check data is updated
    const data = (element as unknown as { data: RowData[] }).data;
    expect(data[0].name).toBe('Bob');
  });
});

describe('FR-009a: Input Name/ID Attribute Generation', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-009a-01: Input name attribute generated correctly', () => {
    element.setAttribute('name', 'users');
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="email"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="email" type="email" />
      </template>
    `;
    document.body.appendChild(element);

    type RowData = { email: string };
    (element as unknown as { data: RowData[] }).data = [
      { email: 'test@example.com' },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const input = element.shadowRoot?.querySelector(
      '[data-bind="email"]'
    ) as HTMLInputElement;
    // Expected format: users[0].email
    expect(input?.name).toBe('users[0].email');
  });

  test('TC-009a-02: Input id attribute generated correctly', () => {
    element.setAttribute('name', 'users');
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="email"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="email" type="email" />
      </template>
    `;
    document.body.appendChild(element);

    type RowData = { email: string };
    (element as unknown as { data: RowData[] }).data = [
      { email: 'test@example.com' },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const input = element.shadowRoot?.querySelector(
      '[data-bind="email"]'
    ) as HTMLInputElement;
    // Expected format: users_0_email
    expect(input?.id).toBe('users_0_email');
  });

  test('TC-009a-03: Nested paths generate correct name/id', () => {
    element.setAttribute('name', 'contacts');
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="address.city"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="address.city" type="text" />
      </template>
    `;
    document.body.appendChild(element);

    type RowData = { address: { city: string } };
    (element as unknown as { data: RowData[] }).data = [
      { address: { city: 'NYC' } },
    ];

    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement;
    toggleBtn?.click();

    const input = element.shadowRoot?.querySelector(
      '[data-bind="address.city"]'
    ) as HTMLInputElement;
    // Expected format: contacts[0].address.city
    expect(input?.name).toBe('contacts[0].address.city');
    // Expected format: contacts_0_address_city
    expect(input?.id).toBe('contacts_0_address_city');
  });
});

describe('FR-008: Attribute Sanitization (Security)', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-008-S01: Should sanitize component name with special characters', () => {
    element.setAttribute('name', 'items"onclick="alert(1)');
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="title"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="title" type="text" />
      </template>
    `;
    document.body.appendChild(element);
    
    (element as unknown as { data: { title: string }[] }).data = [
      { title: 'Test' }
    ];
    
    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
    toggleBtn?.click();
    
    const input = element.shadowRoot?.querySelector('[data-bind="title"]') as HTMLInputElement;
    
    // Verify dangerous characters are removed from name attribute
    expect(input).toBeDefined();
    expect(input?.name).toBeDefined();
    expect(input?.name).not.toContain('"');
    expect(input?.id).not.toContain('"');
  });

  test('TC-008-S02: Should sanitize aria-label with quotes', () => {
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="title"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="title" data-label='Title"Bad' type="text" />
      </template>
    `;
    document.body.appendChild(element);
    
    (element as unknown as { data: { title: string }[] }).data = [
      { title: 'Test' }
    ];
    
    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
    toggleBtn?.click();
    
    const input = element.shadowRoot?.querySelector('[data-bind="title"]') as HTMLInputElement;
    const ariaLabel = input?.getAttribute('aria-label');
    
    // Verify quotes are removed
    expect(input).toBeDefined();
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).not.toContain('"');
  });

  test('TC-008-S03: Should replace spaces with underscores in attributes', () => {
    element.setAttribute('name', 'my items list');
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="title"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="title" type="text" />
      </template>
    `;
    document.body.appendChild(element);
    
    (element as unknown as { data: { title: string }[] }).data = [
      { title: 'Test' }
    ];
    
    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
    toggleBtn?.click();
    
    const input = element.shadowRoot?.querySelector('[data-bind="title"]') as HTMLInputElement;
    
    // Verify spaces are replaced with underscores in component name
    expect(input).toBeDefined();
    expect(input?.name).toBeDefined();
    expect(input?.name).toContain('my_items_list');
  });

  test('TC-008-S04: Should limit attribute length to prevent DoS', () => {
    const longString = 'a'.repeat(500);
    element.setAttribute('name', longString);
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="title"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="title" type="text" />
      </template>
    `;
    document.body.appendChild(element);
    
    (element as unknown as { data: { title: string }[] }).data = [
      { title: 'Test' }
    ];
    
    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
    toggleBtn?.click();
    
    const input = element.shadowRoot?.querySelector('[data-bind="title"]') as HTMLInputElement;
    
    // Verify length is limited - the sanitized component name should be <= 255
    // The full attribute will have additional characters like [0].title
    expect(input).toBeDefined();
    expect(input?.name).toBeDefined();
    const sanitizedPart = input?.name.split('[')[0];
    expect(sanitizedPart?.length).toBeLessThanOrEqual(255);
  });

  test('TC-008-S05: Should sanitize angle brackets to prevent tag injection', () => {
    element.setAttribute('name', 'items<script>');
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="title"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="title" data-label="<img src=x>" type="text" />
      </template>
    `;
    document.body.appendChild(element);
    
    (element as unknown as { data: { title: string }[] }).data = [
      { title: 'Test' }
    ];
    
    // Enter edit mode
    const toggleBtn = element.shadowRoot?.querySelector('[data-action="toggle"]') as HTMLElement;
    toggleBtn?.click();
    
    const input = element.shadowRoot?.querySelector('[data-bind="title"]') as HTMLInputElement;
    const ariaLabel = input?.getAttribute('aria-label');
    
    // Verify angle brackets are removed
    expect(input).toBeDefined();
    expect(input?.name).toBeDefined();
    expect(input?.name).not.toContain('<');
    expect(input?.name).not.toContain('>');
    expect(ariaLabel).toBeDefined();
    expect(ariaLabel).not.toContain('<');
    expect(ariaLabel).not.toContain('>');
  });
});
