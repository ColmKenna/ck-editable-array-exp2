# CkEditableArray - Docs

This `docs` folder contains implementation and step-by-step TDD notes for the `ck-editable-array` Web Component.

## Quick Usage

### Basic Setup with Templates

```html
<ck-editable-array name="contacts">
  <!-- Display template -->
  <template data-slot="display">
    <span data-bind="name"></span>
    <span data-bind="email"></span>
    <button data-action="toggle">Edit</button>
    <button data-action="delete">Delete</button>
  </template>

  <!-- Edit template -->
  <template data-slot="edit">
    <input data-bind="name" type="text" />
    <input data-bind="email" type="email" />
    <button data-action="save">Save</button>
    <button data-action="cancel">Cancel</button>
  </template>
</ck-editable-array>

<script>
  const el = document.querySelector('ck-editable-array');
  el.data = [
    { name: 'Alice', email: 'alice@example.com' },
    { name: 'Bob', email: 'bob@example.com' }
  ];
</script>
```

### CRUD Operations

```javascript
const el = document.querySelector('ck-editable-array');

// Add a new row (enters edit mode automatically)
el.addRow();

// Custom factory for new items
el.newItemFactory = () => ({ name: '', email: '', status: 'pending' });

// Soft delete a row (sets deleted: true)
el.deleteRow(0);

// Restore a deleted row
el.restoreRow(0);
```

### Events

```javascript
// Data changed (after add, save, delete, restore)
el.addEventListener('datachanged', (e) => {
  console.log('New data:', e.detail.data);
});

// Before entering/exiting edit mode (cancelable)
el.addEventListener('beforetogglemode', (e) => {
  if (!confirm('Continue?')) e.preventDefault();
});

// After mode change
el.addEventListener('aftertogglemode', (e) => {
  console.log('Row', e.detail.index, 'editing:', e.detail.editing);
});
```

### Validation

```javascript
el.validationSchema = {
  name: { required: true, minLength: 2 },
  email: { pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
};
// Save is blocked if validation fails
```

### Readonly Mode

```html
<ck-editable-array readonly>...</ck-editable-array>
```
Or programmatically: `el.readonly = true;`

## Data Actions

Use `data-action` attributes on buttons within templates:

| Action | Description |
|--------|-------------|
| `toggle` | Enter edit mode for the row |
| `save` | Save changes and exit edit mode |
| `cancel` | Discard changes and exit edit mode |
| `add` | Add a new row (global, not row-specific) |
| `delete` | Soft delete the row |
| `restore` | Restore a deleted row |

See `docs/readme.technical.md` for implementation details.
