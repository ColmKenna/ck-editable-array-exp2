# Technical Notes - CkEditableArray

## Data Property Implementation (FR-001)

- `data` property is now implemented on the `CkEditableArray` custom element.
- Behavior:
  - Setting the `data` property deep clones the input array to preserve immutability of external data sources.
  - Uses `structuredClone` when available, with fallback to manual deep clone supporting Date objects and circular reference detection.
  - Getting the `data` property returns a cloned value (so consumers cannot mutate internal state via the returned reference).
  - Non-array values assigned to `data` are treated as an empty array.

## CRUD Operations (Phase 2)

### Add Row (FR-002)

- `addRow()` method creates a new row using `newItemFactory` function
- New rows are marked with `__isNew: true` internal marker
- New rows automatically enter edit mode
- Adding is blocked when:
  - Component is in readonly mode
  - Another row is currently being edited (exclusive locking)

### Edit Mode (FR-003, FR-004, FR-005)

**Toggle Edit Mode:**
- `data-action="toggle"` enters edit mode for a row
- `beforetogglemode` event fired (cancelable via `preventDefault()`)
- Original row data stored as snapshot for rollback
- `aftertogglemode` event fired after mode change
- Only one row can be in edit mode at a time (exclusive locking)

**Save Row:**
- `data-action="save"` exits edit mode and commits changes
- Removes `__isNew` marker from new rows
- Validates against `validationSchema` if defined
- Save blocked if validation fails
- `datachanged` event dispatched with updated data
- Focus returns to toggle button

**Cancel Edit:**
- `data-action="cancel"` exits edit mode
- Restores original data from snapshot for existing rows
- Removes new rows entirely (rows with `__isNew` marker)
- `beforetogglemode` event fired (cancelable)
- `aftertogglemode` event fired after mode change

### Delete/Restore (FR-006, FR-007)

**Soft Delete:**
- `deleteRow(index)` sets `deleted: true` on the row
- Row receives `ck-deleted` CSS class for styling
- Delete blocked when row is being edited or in readonly mode
- `datachanged` event dispatched

**Restore:**
- `restoreRow(index)` sets `deleted: false`
- `ck-deleted` class removed
- `datachanged` event dispatched

## Validation Schema

```typescript
validationSchema: Record<string, {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
}>
```

Validation runs before save; if any field fails, save is blocked.

## Internal State Management

- `_data`: Internal data array (cloned on set/get)
- `_rowStates`: Map<number, RowState> tracking editing status and snapshots
- `_newItemFactory`: Factory function for creating new items
- `_validationSchema`: Validation rules for fields

## Event Delegation

Single click and input listeners on the wrapper element handle all interactions:
- Click events: `data-action` buttons
- Input events: `data-bind` elements for two-way binding

## Security

- Path validation prevents prototype pollution attacks
- Color values sanitized via browser CSS parsing
- No innerHTML usage for user data (textContent only)

## Rationale
- Deep cloning ensures external changes to the source object do not affect component internal state, which simplifies predictable rendering and state management.
- Soft delete pattern allows undo/restore and preserves data for form submission.
- Exclusive edit locking prevents conflicting edits across rows.

## Performance (Phase 12)

### NFR-P-001: Efficient DOM Updates

Input changes do not trigger full component re-renders:
- `handleWrapperInput` updates data directly without calling `render()`
- Only validation state is updated via `updateUiValidationState()`
- DOM element references are preserved across input changes
- Validation is debounced (150ms) to avoid excessive processing

### NFR-P-003: Initial Render Performance

Verified through automated testing:
- 100 rows render in < 150ms in test environment
- Performance optimizations include:
  - Cached template references (`_displayTemplate`, `_editTemplate`)
  - Cached color validation results
  - Event delegation (single listener on wrapper)
  - Minimal DOM operations during render

## Notes / Future Improvements
- Consider using a deep cloning library or structured cloning algorithm for better performance and broader type support.
- Consider adding a `dataImmutable` property to toggle cloning behavior for advanced use cases.
- Validation error display (FR-019, FR-020) not yet implemented.
- History/undo-redo performance (NFR-P-002) to be validated when Phase 4 is implemented.

## Modal Edit Mode (FR-026, FR-027, FR-028, FR-029)

### Overview

Modal edit mode allows editing a single row at a time in a modal dialog instead of inline.

### FR-029: Hidden Row Edits for Form Submission

When `modalEdit` is enabled, the modal renders edit templates for ALL rows:
- **Visible Row:** The currently editing row is visible (no `ck-hidden` class)
- **Hidden Rows:** Non-editing rows have `ck-hidden` class (display: none via CSS)
- **Input Binding:** All hidden inputs are still bound to row data and can be modified
- **Form Submission:** `toFormData()` includes all rows, not just the editing row
- **Validation:** Validation applies to both visible and hidden rows

### Implementation Details

```typescript
// Modal rendering loop (lines ~1677-1707)
for (let i = 0; i < this._data.length; i++) {
  const rowData = this._data[i];
  const isEditingRow = i === editingIndex;

  // Clone and bind edit template
  const clone = this._editTemplate.content.cloneNode(true) as DocumentFragment;
  const modalRowEl = document.createElement('div');
  modalRowEl.setAttribute('data-row-index', String(i));
  
  // Hide non-editing rows
  if (!isEditingRow) {
    modalRowEl.classList.add('ck-hidden');
  }

  // Bind data (works for both visible and hidden rows)
  this.bindElementData(clone, rowData, i, componentName);
  
  // Apply validation to hidden rows too
  if (Object.keys(this._validationSchema).length > 0) {
    this.updateRowValidation(modalRowEl, i);
  }
}
```

### Benefits

1. **Form Completeness:** Forms that wrap the component can access all row data via `toFormData()`
2. **No Data Loss:** Hidden inputs prevent accidental loss of row data during form submission
3. **Transparent Validation:** Hidden rows are validated just like visible ones
4. **User Simplicity:** Users only see and edit one row at a time, simplifying UI

### Usage Example

```html
<form id="myForm">
  <ck-editable-array modal-edit>
    <template data-slot="display">
      <span data-bind="name"></span>
      <button data-action="toggle">Edit</button>
    </template>
    <template data-slot="edit">
      <input data-bind="name" type="text" required />
      <input data-bind="email" type="email" required />
      <button data-action="save">Save</button>
      <button data-action="cancel">Cancel</button>
    </template>
  </ck-editable-array>
  <button type="submit">Submit All</button>
</form>

<script>
const form = document.getElementById('myForm');
form.addEventListener('submit', (e) => {
  e.preventDefault();
  
  const array = form.querySelector('ck-editable-array');
  // FormData now includes all rows, even those not being edited
  const formData = array.toFormData();
  
  // Submit to server
  fetch('/api/items', {
    method: 'POST',
    body: formData
  });
});
</script>
```

#### CSS for Hidden Rows

The component includes a `ck-hidden` CSS class for display: none:

```css
.ck-hidden {
  display: none;
}
```

This can be customized via CSS custom properties if needed in the component's stylesheet.


