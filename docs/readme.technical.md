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

---

## CSS Class Reference (Phase 4.1)

The CkEditableArray component applies various CSS classes to elements for styling and state management. This reference documents all customizable CSS classes.

### Wrapper & Row Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-wrapper` | Root shadow DOM container | Main wrapper element | Style the entire table container |
| `.ck-row` | Each row div | Base styling for rows | Style row containers |
| `.ck-row--editing` | Row in edit mode | Highlight edited rows | Show different background/border when editing |
| `.ck-row--selected` | Selected rows | Highlight selected rows | Show selection state (e.g., highlight color) |
| `.ck-row--deleted` | Soft-deleted rows | Show deleted state | Gray out or hide deleted rows (display: none) |

### Field State Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-field-error` | Input/textarea with validation error | Show field error state | Red border, error background, icon, etc. |
| `.ck-field-valid` | Input/textarea that passed validation | Show valid state | Green border, checkmark icon, etc. |
| `.ck-field-required` | Required fields | Mark required fields | Add asterisk (*) using CSS ::after |
| `.ck-field-invalid-pattern` | Pattern validation failure | Specific error type | Different styling for pattern vs other errors |

### Display & Edit Mode Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-display` | Display template content | Show when not editing | Default: `display: contents` |
| `.ck-edit` | Edit template content | Show when editing | Default: `display: contents` |
| `.ck-hidden` | Hidden rows/fields | Hide with display: none | Can be overridden for custom hiding logic |

### Modal Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-modal` | Modal overlay | Background overlay | Style the modal backdrop (semi-transparent) |
| `.ck-modal-content` | Modal dialog content | Modal dialog box | Style modal size, border-radius, shadow, etc. |
| `.ck-modal-header` | Modal title area | Header section | Style the modal title/header area |
| `.ck-modal-body` | Modal form content | Body section | Style the form inside modal |
| `.ck-modal-footer` | Modal actions footer | Footer section | Style button area |

### Button & Control Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-btn` | All buttons | Base button styling | Style buttons (padding, font, hover) |
| `.ck-btn--primary` | Save buttons | Primary action | Style save button as primary CTA |
| `.ck-btn--secondary` | Cancel/Delete buttons | Secondary action | Style cancel/delete as secondary |
| `.ck-btn--icon` | Icon buttons | Icon-only buttons | Style icon buttons (square, circular) |

### Selection & Checkbox Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-checkbox` | Selection checkboxes | Row selection control | Style checkboxes (size, color) |
| `.ck-checkbox--checked` | Selected row checkbox | Checked state | Show when row is selected |

### Error & Validation Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-error-summary` | Error message container | Show all errors for a row | Style error box (red background, padding) |
| `.ck-error-message` | Individual error message | Single field error | Style individual error text |
| `.ck-validation-pending` | Row being validated | Show validation in progress | Opacity/spinner animation |

### State Classes

| Class | Applied To | Purpose | Customization |
|-------|-----------|---------|----------------|
| `.ck-readonly` | Component when readonly | Read-only state | Disable pointer events, gray out, etc. |
| `.ck-busy` | Component during processing | Processing state | Show loading spinner, disable interactions |
| `.ck-error` | Component with error | Error state | Border color, background, error icon |

---

## CSS Customization Examples

### Example 1: Custom Row Styling

```css
/* Highlight edited rows with light blue background */
ck-editable-array::part(row--editing) .ck-row--editing {
  background-color: #e3f2fd;
  border-left: 4px solid #2196F3;
}

/* Highlight selected rows */
ck-editable-array::part(row--selected) .ck-row--selected {
  background-color: #fff3e0;
}

/* Gray out deleted rows */
ck-editable-array::part(row--deleted) .ck-row--deleted {
  opacity: 0.5;
  text-decoration: line-through;
}
```

### Example 2: Custom Validation Styling

```css
/* Red border for fields with errors */
.ck-field-error {
  border: 2px solid #f44336 !important;
  background-color: #ffebee;
}

/* Green border for valid fields */
.ck-field-valid {
  border: 2px solid #4caf50 !important;
}

/* Asterisk for required fields */
.ck-field-required::after {
  content: " *";
  color: red;
  font-weight: bold;
}

/* Error message styling */
.ck-error-message {
  color: #d32f2f;
  font-size: 0.875rem;
  margin-top: 4px;
}
```

### Example 3: Custom Modal Styling

```css
/* Dark modal backdrop */
.ck-modal {
  background-color: rgba(0, 0, 0, 0.7);
}

/* Styled modal dialog */
.ck-modal-content {
  border-radius: 8px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.3);
  max-width: 600px;
}

/* Modal header styling */
.ck-modal-header {
  /* Use a single solid color instead of a gradient for consistency */
  background: #667eea;
  color: white;
  padding: 20px;
  border-radius: 8px 8px 0 0;
  font-size: 1.25rem;
  font-weight: bold;
}
```

### Example 4: Custom Button Styling

```css
/* Primary buttons (Save) */
.ck-btn--primary {
  background-color: #2196F3;
  color: white;
  border: none;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
  font-weight: 600;
}

.ck-btn--primary:hover {
  background-color: #1976D2;
}

.ck-btn--primary:disabled {
  background-color: #bdbdbd;
  cursor: not-allowed;
}

/* Secondary buttons (Cancel) */
.ck-btn--secondary {
  background-color: #f5f5f5;
  color: #333;
  border: 1px solid #ddd;
  padding: 8px 16px;
  border-radius: 4px;
  cursor: pointer;
}

.ck-btn--secondary:hover {
  background-color: #eeeeee;
}
```

### Example 5: Responsive Design

```css
/* Stack columns on mobile */
@media (max-width: 768px) {
  .ck-wrapper {
    font-size: 0.875rem;
  }
  
  .ck-row {
    display: block;
    border-bottom: 2px solid #ddd;
    margin-bottom: 1rem;
  }
  
  /* Hide action column label on mobile */
  .ck-action-header {
    display: none;
  }
}
```

---

## Design System Integration

The component uses semantic CSS class names that follow BEM (Block Element Modifier) conventions:

- **Block**: `.ck-wrapper`, `.ck-row`, `.ck-modal`
- **Element**: `.ck-row__cell`, `.ck-modal__header`, `.ck-btn__icon`
- **Modifier**: `.ck-row--editing`, `.ck-row--selected`, `.ck-btn--primary`

This makes it easy to override styles in your own CSS while maintaining consistency.

### CSS Custom Properties (Theming)

The component exposes a small set of CSS custom properties to make theming simple and non-invasive. Default values are chosen to provide a clear, modern appearance, but you can override them in your application or on a per-page basis.

Key properties:

```css
:root {
  /* Component background and text (neutral defaults) */
  --ck-editable-array-bg: #ffffff; /* default component background */
  --ck-editable-array-color: #111827; /* default component text color */

  /* Visual: border, shadow, and radius */
  --ck-editable-array-border: #e5e7eb;
  --ck-editable-array-shadow: 0 4px 6px rgba(0, 0, 0, 0.06);
  --ck-editable-array-radius: 8px;

  /* Modal / edit panel */
  --ck-editable-array-modal-backdrop: rgba(0, 0, 0, 0.5);
  --ck-editable-array-edit-panel-bg: #f8fafc;
}
```

Example: set a neutral / light theme for your examples or application:

```css
:root {
  --ck-editable-array-bg: #ffffff;
  --ck-editable-array-color: #111827;
  --ck-editable-array-edit-panel-bg: #f8fafc;
}
```

Example: switch to a dark theme variant:

```css
:root.theme-dark {
  --ck-editable-array-bg: #111827;
  --ck-editable-array-color: #f9fafb;
  --ck-editable-array-edit-panel-bg: #0f172a;
  --ck-editable-array-border: rgba(255,255,255,0.04);
  --ck-editable-array-shadow: none;
}
```

---

