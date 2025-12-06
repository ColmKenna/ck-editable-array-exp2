# Requirements Document: ck-editable-array

**Date**: December 3, 2025
**Version**: 1.1
**Status**: Specification from Existing Implementation
**TDD Workflow**: Integrates with `webcomponent.addfeature.thenreview.md`

---

## Table of Contents
1. [Executive Summary](#1-executive-summary)
2. [Documentation Protocol](#2-documentation-protocol)
3. [Clarifications & Assumptions](#3-clarifications--assumptions)
4. [Scope & Constraints](#4-scope--constraints)
5. [Generated Element Naming Specification](#5-generated-element-naming-specification)
6. [Functional Requirements](#6-functional-requirements)
7. [Non-Functional Requirements](#7-non-functional-requirements)
8. [Component Blueprint](#8-component-blueprint)
9. [Implementation Verification](#9-implementation-verification)
10. [Next Steps](#10-next-steps)

---

## 1. Executive Summary

The `ck-editable-array` component is a template-driven web component that enables users to manage a collection of data items through create, read, update, and delete (CRUD) operations. It supports both inline and modal editing modes, provides undo/redo history, batch selection operations, row reordering, schema-based validation with i18n support, and integrates seamlessly with HTML forms. The component uses a slot-based architecture allowing complete customization of display and edit templates while managing all data binding and state internally.

**Primary Use Cases:**
- Editable lists of structured data (contacts, addresses, line items)
- Form arrays within larger forms
- Data management interfaces requiring validation
- Any repeating data structure needing CRUD operations

---

## 2. Documentation Protocol

This specification integrates with the TDD workflow defined in `webcomponent.addfeature.thenreview.md`.

### 2.1 Required Checkpoints

Before implementing any feature, create:
- `docs/checkpoint-YYYY-MM-DD.md` — Pre-implementation state snapshot
- `docs/steps.md` entry — Baseline verification results

After completing each phase, create:
- `docs/checkpoint-YYYY-MM-DD-phase-N-complete.md` — Post-implementation snapshot
- `docs/code-review-YYYY-MM-DD.md` — Code review findings
- `docs/remediation-plan-YYYY-MM-DD.md` — If issues found during review

### 2.2 Feature-to-Test Mapping

Every Functional Requirement (FR-XXX) must have:
1. **Test Case IDs**: Reference to specific test cases in the TDD plan
2. **Regression Tests**: List of existing tests that must continue passing
3. **Validation Tests**: New tests required to verify the feature
4. **Edge Case Tests**: Boundary condition tests specific to this feature

### 2.3 Code Review Triggers

Trigger a code review (Phase B from TDD workflow) after:
- Completing any Phase from the implementation roadmap
- Implementing any "Must-have" priority feature
- Before merging any PR with 100+ lines changed

### 2.4 Test Commands

```bash
# Run all tests
npm test

# Run tests for specific FR
npm test -- --grep "FR-001"

# Run regression tests only
npm test -- --grep "@regression"

# Run with coverage
npm test -- --coverage
```

---

## 3. Clarifications & Assumptions

### 3.1 Design Decisions Observed in Implementation

**D1: Template-Based Rendering**
- The component uses light DOM slots (`display` and `edit`) as templates
- Templates are cloned for each row, enabling complete UI customization
- Data binding uses `data-bind` attributes with dot-notation path support

**D2: Single-Row Edit Locking**
- Only one row can be in edit mode at a time (exclusive locking)
- This prevents data conflicts and simplifies state management

**D3: Soft Delete with Restore**
- Delete operations mark rows with a `deleted` flag rather than removing them
- This allows restore functionality and tracking of deletions
- Batch operations can perform hard deletes (actual removal)

**D4: Snapshot-Based Rollback**
- When entering edit mode, the row's original state is preserved as a snapshot
- Cancel operations restore from this snapshot
- New rows added during a session are fully removed on cancel

### 3.2 Assumptions

**Assumption 1**: Data Immutability Pattern
- **Rationale**: Component maintains immutability by cloning data on operations
- **Impact**: Safe state management but increased memory usage for large datasets
- **Verification**: Performance testing with large datasets (1000+ rows)

**Assumption 2**: Browser Shadow DOM Support
- **Rationale**: Uses `attachShadow({ mode: 'open' })` for encapsulation
- **Impact**: Requires modern browser or polyfill
- **Verification**: Browser compatibility matrix

---

## 3. Scope & Constraints

### In Scope
- CRUD operations for array data (add, edit, delete, restore)
- Two display modes: inline and modal editing
- Undo/redo history with configurable depth
- Row selection and batch operations
- Row reordering (move up, down, to specific position)
- Schema-based validation with field-level error display
- Form integration (value getter/setter, FormData conversion)
- Template-based rendering with data binding
- Accessibility features (ARIA attributes, keyboard navigation, focus management)
- CSS Custom Properties for theming
- Style slot for custom CSS injection into shadow DOM

### Out of Scope
- Server-side persistence (component is data-bound only)
- Drag-and-drop reordering (programmatic only via API)
- Virtual scrolling for large datasets
- Column-based sorting/filtering
- Export functionality (CSV, Excel)
- Inline cell editing (row-level editing only)

### Technical Constraints
- **Browser Support**: Modern browsers with Shadow DOM and Custom Elements v1
- **Framework Integration**: Framework-agnostic (vanilla Web Component)
- **Dependencies**: None (pure vanilla JavaScript/TypeScript)
- **Accessibility Standard**: WCAG 2.1 AA compliance

### Environmental Context
- **Primary Use Case**: Form-based data management interfaces
- **Target Audience**: Developers building data entry forms
- **Integration Requirements**: Works within standard HTML forms, emits standard events
- **Deployment Environment**: Any web application (static, SPA, SSR)

---

## 4. Generated Element Naming Specification

This section defines the naming conventions for all DOM elements, CSS classes, data attributes, parts, and slots generated or expected by the component.

### 4.1 Custom Element Tag

| Element Tag | Description |
|-------------|-------------|
| `ck-editable-array` | The custom element tag name for the component |

### 4.2 Shadow DOM Parts (for `::part()` styling)

| Part Name | Constant | Description |
|-----------|----------|-------------|
| `root` | `PART_ROOT` | The root container element wrapping all content |
| `rows` | `PART_ROWS` | Container element holding all rendered row elements |
| `add-button` | `PART_ADD_BUTTON` | Container for the add button (rendered from template) |
| `modal` | `PART_MODAL` | The modal overlay element (when modal-edit is enabled) |
| `modal-surface` | `PART_MODAL_SURFACE` | The modal content surface/dialog box |

**Usage Example:**
```css
ck-editable-array::part(root) { padding: 16px; }
ck-editable-array::part(rows) { display: flex; flex-direction: column; gap: 8px; }
ck-editable-array::part(modal) { background: rgba(0,0,0,0.5); }
ck-editable-array::part(modal-surface) { max-width: 600px; }
```

### 4.3 Slots (Light DOM Content Projection)

| Slot Name | Constant | Purpose | Expected Content |
|-----------|----------|---------|------------------|
| `styles` | `SLOT_STYLES` | Custom CSS injection into shadow DOM | `<style slot="styles">...</style>` |
| `display` | `SLOT_DISPLAY` | Template for row display mode | HTML template with `data-bind` attributes |
| `edit` | `SLOT_EDIT` | Template for row edit mode | HTML template with `data-bind` and `data-action` attributes |

**Usage Example:**
```html
<ck-editable-array>
  <style slot="styles">.row { border: 1px solid #ccc; }</style>
  <template slot="display">...</template>
  <template slot="edit">...</template>
</ck-editable-array>
```

### 4.4 Data Attributes (for Data Binding & Actions)

| Attribute | Constant | Purpose | Values |
|-----------|----------|---------|--------|
| `data-bind` | `ATTR_DATA_BIND` | Binds element to a data field | Field name (supports dot-notation: `person.name`) |
| `data-action` | `ATTR_DATA_ACTION` | Defines click action for element | `toggle`, `save`, `cancel`, `delete`, `restore`, `add`, `move-up`, `move-down`, `select` |
| `data-row` | `ATTR_DATA_ROW` | Identifies the row index | Integer (0-based index) |
| `data-mode` | `ATTR_DATA_MODE` | Indicates current row mode | `display` or `edit` |

**Generated During Rendering:**

| Attribute | Purpose | Applied To |
|-----------|---------|------------|
| `data-row="{index}"` | Row identification | Row wrapper elements |
| `data-selected="true"` | Selection state indicator | Selected row wrappers |
| `data-invalid="true"` | Field-level validation failure | Invalid input elements |
| `data-row-invalid="true"` | Row-level validation failure | Edit wrapper of invalid rows |
| `data-field-error="{fieldName}"` | Error message display | Error message elements |
| `data-error-count` | Total error count display | Error count elements |
| `data-error-summary` | Accessibility error summary | Error summary elements |
| `data-mirrored="true"` | Marks mirrored style elements | Style elements in shadow DOM |

### 4.5 CSS Classes (Generated)

| Class Name | Constant | Purpose | Applied To |
|------------|----------|---------|------------|
| `ck-hidden` | `CLASS_HIDDEN` | Hides elements with `display: none !important` | Elements that should be hidden |
| `ck-deleted` | `CLASS_DELETED` | Marks rows as deleted (for styling) | Row wrappers with `deleted: true` |
| `display-content` | `CLASS_DISPLAY_CONTENT` | Identifies display mode wrapper | Cloned display template content |
| `edit-content` | `CLASS_EDIT_CONTENT` | Identifies edit mode wrapper | Cloned edit template content |
| `ck-modal-overlay` | `CLASS_MODAL_OVERLAY` | Modal backdrop styling | Modal overlay element |
| `ck-modal-surface` | `CLASS_MODAL_SURFACE` | Modal content surface styling | Modal surface element |

**CSS Class Application Rules:**
- `display-content` is applied to the wrapper containing cloned display template content
- `edit-content` is applied to the wrapper containing cloned edit template content
- `ck-hidden` is toggled based on the row's `editing` state to show/hide appropriate mode
- `ck-deleted` is added when `row.deleted === true`

### 4.6 ARIA Attributes (Generated for Accessibility)

| Attribute | Value | Purpose | Applied To |
|-----------|-------|---------|------------|
| `aria-hidden` | `"true"` / `"false"` | Hide modal from assistive tech when closed | Modal overlay |
| `aria-modal` | `"true"` | Indicates modal dialog | Modal surface |
| `aria-invalid` | `"true"` | Indicates invalid field | Invalid input elements |
| `aria-disabled` | `"true"` | Indicates disabled button | Disabled save buttons |
| `aria-selected` | `"true"` | Indicates selected row | Selected row wrappers |
| `aria-describedby` | `"{error-id}"` | Links input to error message | Invalid inputs with error messages |
| `role` | `"dialog"` | Identifies modal dialog | Modal surface |

### 4.7 Internal ID Generation

| Pattern | Example | Purpose |
|---------|---------|---------|
| `row-{counter}` | `row-0`, `row-1`, `row-42` | Unique row keys for DOM reconciliation |
| `error-{rowIndex}-{fieldName}` | `error-2-email` | Error element IDs for ARIA relationships |
| `{name}__{index}__{field}` | `items__2__email` | Field ID pattern for form and DOM `id` attributes |

### 4.8 Component Attribute Names (HTML Attributes)

| Attribute | Type | Default | Description |
|-----------|------|---------|-------------|
| `name` | string | `"items"` | Form field name, used in FormData keys |
| `readonly` | boolean | `false` | When present, disables all editing operations |
| `modal-edit` | boolean | `false` | When present, edit mode opens in modal dialog |

### 4.9 Constants Export Reference

```typescript
// Static constants exported from the class

// Shadow DOM part names
CkEditableArray.PART_ROOT         // "root"
CkEditableArray.PART_ROWS         // "rows"  
CkEditableArray.PART_ADD_BUTTON   // "add-button"
CkEditableArray.PART_MODAL        // "modal"
CkEditableArray.PART_MODAL_SURFACE // "modal-surface"

// Slot names
CkEditableArray.SLOT_STYLES       // "styles"
CkEditableArray.SLOT_DISPLAY      // "display"
CkEditableArray.SLOT_EDIT         // "edit"

// Data attribute names
CkEditableArray.ATTR_DATA_BIND    // "data-bind"
CkEditableArray.ATTR_DATA_ACTION  // "data-action"
CkEditableArray.ATTR_DATA_ROW     // "data-row"
CkEditableArray.ATTR_DATA_MODE    // "data-mode"

// CSS class names
CkEditableArray.CLASS_HIDDEN      // "ck-hidden"
CkEditableArray.CLASS_DELETED     // "ck-deleted"
CkEditableArray.CLASS_DISPLAY_CONTENT  // "display-content"
CkEditableArray.CLASS_EDIT_CONTENT     // "edit-content"
CkEditableArray.CLASS_MODAL_OVERLAY    // "ck-modal-overlay"
CkEditableArray.CLASS_MODAL_SURFACE    // "ck-modal-surface"

// Event name constants (for consistent event handling)
CkEditableArray.EVENT_DATA_CHANGED       // "datachanged"
CkEditableArray.EVENT_SELECTION_CHANGED  // "selectionchanged"
CkEditableArray.EVENT_BEFORE_TOGGLE_MODE // "beforetogglemode"
CkEditableArray.EVENT_AFTER_TOGGLE_MODE  // "aftertogglemode"
CkEditableArray.EVENT_UNDO               // "undo"
CkEditableArray.EVENT_REDO               // "redo"
CkEditableArray.EVENT_REORDER            // "reorder"
```

---

## 5. Functional Requirements

### 5.1 Core Data Management

**FR-001: Data Property Getter/Setter**
- **Description**: Component exposes a `data` property that accepts and returns an array of row objects or primitives
- **Acceptance Criteria**:
  - Given an empty component
  - When `component.data = [{name: "John"}, {name: "Jane"}]` is set
  - Then the component stores the data internally with deep cloning
  - And `component.data` returns a new array without internal markers (`__originalSnapshot`, `__isNew`)
  - And a `datachanged` event is dispatched
- **Priority**: Must-have
- **Dependencies**: None

**FR-002: Add New Row**
- **Description**: Users can add new rows to the array via add button action
- **Acceptance Criteria**:
  - Given the component is not in readonly mode
  - And no other row is currently in edit mode
  - When a button with `data-action="add"` is clicked
  - Then a new row is created using the `newItemFactory` function
  - And the new row is added to the data array in editing mode
  - And the new row is marked with `__isNew: true` internally
  - And the component re-renders showing the new row in edit mode
  - And a `datachanged` event is dispatched
- **Priority**: Must-have
- **Dependencies**: FR-003 (Edit Mode)

**FR-003: Enter Edit Mode**
- **Description**: Users can toggle a row into edit mode for modification
- **Acceptance Criteria**:
  - Given the component is not in readonly mode
  - And no other row is currently in edit mode (exclusive locking)
  - When a button with `data-action="toggle"` is clicked on a row in display mode
  - Then a `beforetogglemode` event is dispatched (cancelable)
  - And if not canceled, the row's current state is stored as a snapshot
  - And the row's `editing` property is set to `true`
  - And the display template is hidden and edit template is shown
  - And focus moves to the first input element in the edit template
  - And an `aftertogglemode` event is dispatched with `mode: 'edit'`
- **Priority**: Must-have
- **Dependencies**: None

**FR-004: Save Row Changes**
- **Description**: Users can save changes made in edit mode
- **Acceptance Criteria**:
  - Given a row is in edit mode
  - And all field validations pass
  - When a button with `data-action="save"` is clicked
  - Then the `editing` flag and internal markers are removed from the row
  - And the component re-renders showing the row in display mode
  - And a `datachanged` event is dispatched
  - And focus moves to the toggle button on the saved row
- **Priority**: Must-have
- **Dependencies**: FR-003, FR-018 (Validation)

**FR-005: Cancel Row Editing**
- **Description**: Users can cancel edit mode and discard changes
- **Acceptance Criteria**:
  - Given a row is in edit mode
  - When a button with `data-action="cancel"` is clicked
  - Then a `beforetogglemode` event is dispatched (cancelable)
  - And if not canceled:
    - If the row was newly added (`__isNew: true`), it is removed from the array
    - If the row was existing, its data is restored from the snapshot
  - And the component re-renders
  - And an `aftertogglemode` event is dispatched with `mode: 'display'`
- **Priority**: Must-have
- **Dependencies**: FR-003

**FR-006: Delete Row (Soft Delete)**
- **Description**: Users can mark a row as deleted without removing it from the array
- **Acceptance Criteria**:
  - Given a row is in display mode
  - And the component is not in readonly mode
  - And no other row is in edit mode
  - When a button with `data-action="delete"` is clicked
  - Then the row's `deleted` property is set to `true`
  - And the row wrapper receives the `ck-deleted` CSS class
  - And a `datachanged` event is dispatched
- **Priority**: Must-have
- **Dependencies**: None

**FR-007: Restore Deleted Row**
- **Description**: Users can restore a soft-deleted row
- **Acceptance Criteria**:
  - Given a row has `deleted: true`
  - And the component is not in readonly mode
  - And no other row is in edit mode
  - When a button with `data-action="restore"` is clicked
  - Then the row's `deleted` property is set to `false`
  - And the `ck-deleted` CSS class is removed
  - And a `datachanged` event is dispatched
- **Priority**: Must-have
- **Dependencies**: FR-006

**FR-008: Data Binding - Text Content**
- **Description**: Elements with `data-bind` attribute display bound data values
- **Acceptance Criteria**:
  - Given a template element has `data-bind="fieldName"`
  - When the row is rendered
  - Then the element's text content is set to the value of `row.fieldName`
  - And nested paths are supported (e.g., `data-bind="person.address.city"`)
  - And array values are joined with `, ` separator
- **Priority**: Must-have
- **Dependencies**: None

**FR-009: Data Binding - Input Values**
- **Description**: Input elements with `data-bind` are two-way bound to data
- **Acceptance Criteria**:
  - Given an input element has `data-bind="fieldName"`
  - When the row is rendered
  - Then the input's value is populated from `row.fieldName`
  - And when the user changes the input value
  - Then `row.fieldName` is updated internally
  - And validation is re-run for the row
- **Priority**: Must-have
- **Dependencies**: FR-008

**FR-009a: Input Name and ID Generation**
- **Description**: Input elements with `data-bind` receive generated `name` and `id` attributes for form integration
- **Acceptance Criteria**:
  - Given an input element has `data-bind="fieldName"`
  - And the component has `name="contacts"`
  - And the row index is `2`
  - When the row is rendered
  - Then the input's `name` attribute is set to `contacts[2].fieldName`
  - And the input's `id` attribute is set to `contacts__2__fieldName`
  - And nested paths are supported (e.g., `data-bind="person.name"` → `name="contacts[2].person.name"`, `id="contacts__2__person.name"`)
  - And when rows are reordered, the `name` and `id` attributes are updated to reflect new indices
  - And when rows are hard-deleted, remaining rows have their `name` and `id` attributes updated
- **Priority**: Must-have
- **Dependencies**: FR-008, FR-009

### 5.2 Undo/Redo History

**FR-010: Undo Operation**
- **Description**: Users can undo the last data change
- **Acceptance Criteria**:
  - Given `component.canUndo` returns `true`
  - When `component.undo()` is called
  - Then the data is restored to the previous history state
  - And the component re-renders
  - And a `datachanged` event is dispatched
  - And an `undo` event is dispatched with `detail.data`
- **Priority**: Should-have
- **Dependencies**: FR-001

**FR-011: Redo Operation**
- **Description**: Users can redo an undone change
- **Acceptance Criteria**:
  - Given `component.canRedo` returns `true`
  - When `component.redo()` is called
  - Then the data is restored to the next history state
  - And the component re-renders
  - And a `datachanged` event is dispatched
  - And a `redo` event is dispatched with `detail.data`
- **Priority**: Should-have
- **Dependencies**: FR-010

**FR-012: History Size Limit**
- **Description**: History can be configured with a maximum size
- **Acceptance Criteria**:
  - Given `component.maxHistorySize = 50` (default)
  - When more than 50 data changes occur
  - Then the oldest history entries are removed
  - And `_historyIndex` is adjusted to remain valid
- **Priority**: Should-have
- **Dependencies**: FR-010

**FR-013: Clear History**
- **Description**: History can be cleared programmatically
- **Acceptance Criteria**:
  - When `component.clearHistory()` is called
  - Then `_history` is emptied
  - And `_historyIndex` is reset to `-1`
  - And `canUndo` and `canRedo` return `false`
- **Priority**: Should-have
- **Dependencies**: FR-010

### 5.3 Row Reordering

**FR-014: Move Row Up**
- **Description**: Users can move a row up in the array
- **Acceptance Criteria**:
  - Given a row is not the first row
  - And the component is not readonly
  - And no row is in edit mode
  - When `component.moveUp(rowIndex)` is called or `data-action="move-up"` is clicked
  - Then the row swaps position with the row above it
  - And a `reorder` event is dispatched with `{ fromIndex, toIndex, data }`
  - And a `datachanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: None

**FR-015: Move Row Down**
- **Description**: Users can move a row down in the array
- **Acceptance Criteria**:
  - Given a row is not the last row
  - And the component is not readonly
  - And no row is in edit mode
  - When `component.moveDown(rowIndex)` is called or `data-action="move-down"` is clicked
  - Then the row swaps position with the row below it
  - And a `reorder` event is dispatched with `{ fromIndex, toIndex, data }`
  - And a `datachanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: None

**FR-016: Move Row to Position**
- **Description**: Users can move a row to a specific index
- **Acceptance Criteria**:
  - Given a valid source index
  - And the component is not readonly
  - And no row is in edit mode
  - When `component.moveTo(fromIndex, toIndex)` is called
  - Then the row is moved to the target position (clamped to valid range)
  - And a `reorder` event is dispatched
  - And a `datachanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: None

### 5.4 Selection & Batch Operations

**FR-017: Row Selection**
- **Description**: Users can select/deselect individual rows for batch operations
- **Acceptance Criteria**:
  - When `component.select(rowIndex)` is called
  - Then the row index is added to `_selectedIndices`
  - And the row wrapper receives `data-selected="true"` and `aria-selected="true"`
  - And a `selectionchanged` event is dispatched with `{ selectedIndices }`
- **Priority**: Should-have
- **Dependencies**: None

**FR-017a: Select All Rows**
- **Description**: All rows can be selected at once
- **Acceptance Criteria**:
  - When `component.selectAll()` is called
  - Then all row indices are added to `_selectedIndices`
  - And `selectionchanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: FR-017

**FR-017b: Clear Selection**
- **Description**: All selections can be cleared at once
- **Acceptance Criteria**:
  - When `component.clearSelection()` or `deselectAll()` is called
  - Then `_selectedIndices` is emptied
  - And `selectionchanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: FR-017

**FR-017c: Delete Selected Rows (Hard Delete)**
- **Description**: All selected rows can be permanently removed
- **Acceptance Criteria**:
  - When `component.deleteSelected()` is called
  - Then selected rows are removed from the data array (not soft delete)
  - And selection is cleared
  - And `datachanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: FR-017

**FR-017d: Mark Selected as Deleted (Soft Delete)**
- **Description**: All selected rows can be soft-deleted
- **Acceptance Criteria**:
  - When `component.markSelectedDeleted()` is called
  - Then selected rows have `deleted: true` set
  - And selection is cleared
  - And `datachanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: FR-017, FR-006

**FR-017e: Bulk Update Selected**
- **Description**: Apply updates to all selected rows
- **Acceptance Criteria**:
  - When `component.bulkUpdate({ status: 'approved' })` is called
  - Then all selected rows receive the provided properties
  - And `datachanged` event is dispatched
- **Priority**: Should-have
- **Dependencies**: FR-017

### 5.5 Validation

**FR-018: Schema-Based Validation**
- **Description**: Rows are validated against a provided schema
- **Acceptance Criteria**:
  - Given `component.schema` is set with field rules
  - When a row is in edit mode
  - And the user modifies input values
  - Then the row is validated against the schema
  - And the save button is disabled if validation fails
  - And field-level error indicators are displayed
- **Priority**: Must-have
- **Dependencies**: FR-003

**FR-019: Field-Level Error Display**
- **Description**: Validation errors are displayed at the field level
- **Acceptance Criteria**:
  - Given a field fails validation
  - When the validation runs
  - Then the input receives `aria-invalid="true"` and `data-invalid="true"`
  - And an element with `data-field-error="{fieldName}"` displays the error message
  - And `aria-describedby` links the input to the error element
- **Priority**: Must-have
- **Dependencies**: FR-018

**FR-020: Row-Level Validation State**
- **Description**: The overall row validation state is indicated
- **Acceptance Criteria**:
  - Given one or more fields fail validation
  - Then the edit wrapper receives `data-row-invalid="true"`
  - And an element with `data-error-count` displays the error count
  - And an element with `data-error-summary` displays all errors for screen readers
- **Priority**: Must-have
- **Dependencies**: FR-018

**FR-021: i18n Support for Validation Messages**
- **Description**: Validation messages can be localized
- **Acceptance Criteria**:
  - Given `component.i18n` is set with localized messages
  - When validation errors occur
  - Then error messages use the i18n values
- **Priority**: Should-have
- **Dependencies**: FR-018

### 5.6 Form Integration

**FR-022: Value Property (JSON)**
- **Description**: Component provides a `value` property for form integration
- **Acceptance Criteria**:
  - When `component.value` is read
  - Then a JSON string of the data array is returned
  - When `component.value = '[]'` is set with valid JSON
  - Then the data is parsed and applied
- **Priority**: Should-have
- **Dependencies**: FR-001

**FR-023: FormData Conversion**
- **Description**: Data can be converted to FormData format
- **Acceptance Criteria**:
  - When `component.toFormData()` is called
  - Then a FormData object is returned
  - And entries are keyed as `{name}[{index}].[{field}]`
  - And nested objects are flattened
  - And internal properties (`editing`, `deleted`, `__*`) are excluded
  - And a corresponding `id` for each field is generated using the pattern `{name}__{index}__{field}`
- **Priority**: Should-have
- **Dependencies**: FR-001

**FR-024: Check Validity**
- **Description**: Component validates all rows and returns overall validity
- **Acceptance Criteria**:
  - When `component.checkValidity()` is called
  - Then all rows are validated against the schema
  - And `true` is returned if all rows are valid, `false` otherwise
- **Priority**: Should-have
- **Dependencies**: FR-018

**FR-025: Report Validity**
- **Description**: Component validates and updates UI to show validation state
- **Acceptance Criteria**:
  - When `component.reportValidity()` is called
  - Then all rows are validated
  - And validation UI is updated for invalid rows
  - And `true/false` is returned
- **Priority**: Should-have
- **Dependencies**: FR-024

**FR-025a: Form-Associated Custom Elements**
- **Description**: Component implements the Form-Associated Custom Elements API for native form participation
- **Acceptance Criteria**:
  - Given the component has `static formAssociated = true`
  - And the component calls `attachInternals()` in the constructor
  - When the component is placed inside a `<form>` element
  - Then `component.form` returns the parent form element
  - And `new FormData(form)` automatically includes the component's data
  - And data is serialized as `{name}[{index}].{field}` entries
  - When `form.reset()` is called
  - Then the component's data is cleared via `formResetCallback()`
  - When a parent `<fieldset>` is disabled
  - Then the component becomes readonly via `formDisabledCallback()`
  - And the component exposes `validity`, `validationMessage`, `willValidate` properties
  - And the component exposes `checkValidity()` and `reportValidity()` methods
- **Priority**: Should-have
- **Dependencies**: FR-001, FR-022

### 5.7 Modal Edit Mode

**FR-026: Modal Edit Toggle**
- **Description**: Edit mode can render in a modal dialog
- **Acceptance Criteria**:
  - Given `component.modalEdit = true` or `modal-edit` attribute is present
  - When a row enters edit mode
  - Then the edit template is rendered inside the modal surface
  - And the modal overlay is shown (`ck-hidden` class removed)
  - And `aria-hidden="false"` is set on the modal
  - And focus is trapped within the modal
- **Priority**: Should-have
- **Dependencies**: FR-003

**FR-027: Modal Close on Save/Cancel**
- **Description**: Modal closes when save or cancel is triggered
- **Acceptance Criteria**:
  - Given modal edit mode is active
  - When save or cancel is clicked
  - Then the modal is hidden (`ck-hidden` class added)
  - And `aria-hidden="true"` is set on the modal
  - And focus returns to the originating row's toggle button
- **Priority**: Should-have
- **Dependencies**: FR-026

### 5.8 Readonly Mode

**FR-028: Readonly Attribute**
- **Description**: Component can be set to readonly mode
- **Acceptance Criteria**:
  - Given the `readonly` attribute is present
  - When any modifying action is attempted (add, delete, toggle, save, reorder)
  - Then the action is blocked and has no effect
  - And input elements should have `readOnly` property set
- **Priority**: Must-have
- **Dependencies**: None

### 5.9 Error Handling

**FR-029: Error Boundary**
- **Description**: Component catches and reports errors during rendering
- **Acceptance Criteria**:
  - Given a rendering error occurs
  - When the error is caught
  - Then `component.hasError` returns `true`
  - And `component.lastError` contains the Error object
  - And a `rendererror` event is dispatched with `{ error, context }`
  - And if `component.debug = true`, errors are logged to console
- **Priority**: Should-have
- **Dependencies**: None

**FR-030: Error Recovery**
- **Description**: Error state can be cleared for retry
- **Acceptance Criteria**:
  - When `component.clearError()` is called
  - Then `hasError` becomes `false`
  - And `lastError` becomes `null`
- **Priority**: Should-have
- **Dependencies**: FR-029

---

## 6. Non-Functional Requirements

### 6.1 Performance (NFR-P-###)

**NFR-P-001: Efficient DOM Updates**
- **Description**: Component should minimize DOM operations by updating only changed elements
- **Measurement**: Count of DOM operations per data change
- **Target**: Only bound elements for the affected row are updated on input changes (not full re-render)
- **Priority**: Must-have

**NFR-P-002: History Memory Management**
- **Description**: Undo/redo history should be bounded to prevent memory leaks
- **Measurement**: Memory usage over time with frequent changes
- **Target**: Memory growth is capped by `maxHistorySize` (default: 50 states)
- **Priority**: Should-have

**NFR-P-003: Initial Render Performance**
- **Description**: Component should render quickly with typical data sizes
- **Measurement**: Time from `connectedCallback` to first meaningful paint
- **Target**: < 100ms for up to 100 rows on mid-range hardware
- **Priority**: Should-have

### 6.2 Accessibility (NFR-A-###)

**NFR-A-001: ARIA Invalid State**
- **Description**: Invalid form fields must be programmatically identifiable
- **Measurement**: ARIA audit tools (axe, Lighthouse)
- **Target**: All invalid inputs have `aria-invalid="true"` and `aria-describedby` pointing to error message
- **Priority**: Must-have

**NFR-A-002: Focus Management**
- **Description**: Focus must be managed appropriately during mode transitions
- **Measurement**: Manual keyboard testing
- **Target**: 
  - Entering edit mode: focus moves to first input
  - Saving/canceling: focus returns to toggle button
  - Modal: focus trapped within dialog
- **Priority**: Must-have

**NFR-A-003: Modal Dialog Accessibility**
- **Description**: Modal must follow WAI-ARIA dialog pattern
- **Measurement**: Screen reader testing
- **Target**: Modal has `role="dialog"`, `aria-modal="true"`, and overlay has `aria-hidden` toggled appropriately
- **Priority**: Must-have

**NFR-A-004: Selection State Announcement**
- **Description**: Selected rows must be identifiable to assistive technology
- **Measurement**: Screen reader testing
- **Target**: Selected rows have `aria-selected="true"`
- **Priority**: Should-have

### 6.3 Usability (NFR-U-###)

**NFR-U-001: Template Flexibility**
- **Description**: Developers can fully customize row appearance via templates
- **Measurement**: Ability to implement varied designs without component modification
- **Target**: Any HTML structure can be used in slots; component manages only data binding
- **Priority**: Must-have

**NFR-U-002: CSS Custom Property Theming**
- **Description**: Visual styling can be customized via CSS custom properties
- **Measurement**: Ability to theme without deep CSS specificity
- **Target**: Key visual properties (colors, spacing, borders) are controllable via `--ck-*` properties
- **Priority**: Should-have

### 6.4 Reliability (NFR-R-###)

**NFR-R-001: Data Immutability**
- **Description**: External data manipulation should not affect internal state
- **Measurement**: Unit test with object mutation after assignment
- **Target**: Setting `data` property deep clones the input; mutations don't affect component
- **Priority**: Must-have

**NFR-R-002: Circular Reference Handling**
- **Description**: Component should handle circular references gracefully
- **Measurement**: Unit test with circular object structures
- **Target**: Falls back to shallow copy with console warning if JSON serialization fails
- **Priority**: Should-have

**NFR-R-003: Invalid Data Handling**
- **Description**: Component should handle non-array data assignments gracefully
- **Measurement**: Unit test with invalid data types
- **Target**: Non-array values result in empty array; no exceptions thrown
- **Priority**: Must-have

### 6.5 Compatibility (NFR-C-###)

**NFR-C-001: Modern Browser Support**
- **Description**: Component works in modern browsers
- **Measurement**: Cross-browser testing
- **Target**: Chrome 80+, Firefox 80+, Safari 14+, Edge 80+
- **Priority**: Must-have

**NFR-C-002: Shadow DOM Requirement**
- **Description**: Component requires Shadow DOM support
- **Measurement**: Feature detection
- **Target**: Uses `attachShadow({ mode: 'open' })`; polyfill needed for older browsers
- **Priority**: Must-have

### 6.6 Maintainability (NFR-M-###)

**NFR-M-001: Separation of Concerns**
- **Description**: Rendering logic is separated from data management
- **Measurement**: Code architecture review
- **Target**: `DomRenderer` class handles DOM; `ValidationManager` handles validation
- **Priority**: Should-have

**NFR-M-002: TypeScript Types**
- **Description**: All public APIs are fully typed
- **Measurement**: TypeScript compilation with strict mode
- **Target**: No `any` types in public API; interfaces exported for consumers
- **Priority**: Should-have

---

## 7. Component Blueprint

### Overall Summary

`ck-editable-array` is a Web Component that manages an array of data items with full CRUD capabilities. It uses slot-based templates for display and edit modes, supports schema-based validation, provides undo/redo history, and integrates with HTML forms. The component emphasizes accessibility with ARIA attributes and focus management, and offers theming via CSS Custom Properties and the `::part()` selector.

### Technical Specification

#### Properties (Inputs)

| Property | Type | Default | Required | Description |
|----------|------|---------|----------|-------------|
| `data` | `EditableRow[]` | `[]` | No | Array of row data (objects or strings) |
| `schema` | `ValidationSchema \| null` | `null` | No | Validation schema for field rules |
| `i18n` | `I18nMessages \| undefined` | `undefined` | No | Localized validation messages |
| `newItemFactory` | `() => EditableRow` | `() => ({})` | No | Factory function for creating new rows |
| `modalEdit` | `boolean` | `false` | No | Enable modal dialog for edit mode |
| `maxHistorySize` | `number` | `50` | No | Maximum undo/redo history depth |
| `debug` | `boolean` | `false` | No | Enable debug logging |

**Type Definitions:**

```typescript
type EditableRow = string | InternalRowData;

interface InternalRowData {
  [key: string]: unknown;
  editing?: boolean;
  deleted?: boolean;
  __originalSnapshot?: Record<string, unknown>;
  __isNew?: boolean;
}

interface ValidationSchema {
  [fieldName: string]: FieldValidation;
}

interface FieldValidation {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  pattern?: RegExp;
  custom?: (value: unknown, row: InternalRowData) => string | null;
}

interface I18nMessages {
  required?: string;
  minLength?: string;
  maxLength?: string;
  pattern?: string;
  [key: string]: string | undefined;
}

interface ValidationResult {
  isValid: boolean;
  errors: { [fieldName: string]: string[] };
}
```

#### Attributes (HTML)

| Attribute | Values | Observed | Description |
|-----------|--------|----------|-------------|
| `name` | string | Yes | Form field name for FormData |
| `readonly` | boolean (presence) | Yes | Disables all editing operations |
| `modal-edit` | boolean (presence) | Yes | Enables modal edit mode |

#### Events (Outputs)

| Event Name | Payload Type | Bubbles | Composed | Description |
|------------|--------------|---------|----------|-------------|
| `datachanged` | `{ data: unknown[] }` | Yes | Yes | Fired when data array changes |
| `selectionchanged` | `{ selectedIndices: number[] }` | Yes | Yes | Fired when selection changes |
| `beforetogglemode` | `{ index: number, from: string, to: string }` | Yes | Yes | Fired before mode change (cancelable) |
| `aftertogglemode` | `{ index: number, mode: string }` | Yes | Yes | Fired after mode change completes |
| `reorder` | `{ fromIndex: number, toIndex: number, data: unknown[] }` | Yes | Yes | Fired when row position changes |
| `undo` | `{ data: unknown[] }` | Yes | Yes | Fired after undo operation |
| `redo` | `{ data: unknown[] }` | Yes | Yes | Fired after redo operation |
| `rendererror` | `{ error: Error, context: string }` | Yes | Yes | Fired when rendering error occurs |

#### Slots

| Slot Name | Purpose | Expected Content |
|-----------|---------|------------------|
| `styles` | Custom CSS to inject into shadow DOM | `<style slot="styles">...</style>` |
| `display` | Template for row display mode | `<template slot="display">` with `data-bind` attributes |
| `edit` | Template for row edit mode | `<template slot="edit">` with `data-bind` and `data-action` attributes |

#### CSS Parts (::part selectors)

| Part Name | Description |
|-----------|-------------|
| `root` | Root container wrapping all content |
| `rows` | Container for all row elements |
| `add-button` | Container for add button |
| `modal` | Modal overlay element |
| `modal-surface` | Modal content surface |

#### CSS Custom Properties

| Property | Default | Description |
|----------|---------|-------------|
| `--ck-row-padding` | `12px` | Default padding for rows |
| `--ck-error-color` | `#dc3545` | Color for error states |
| `--ck-border-radius` | `4px` | Border radius for elements |
| `--ck-border-color` | `#ddd` | Default border color |
| `--ck-focus-color` | `#0066cc` | Focus indicator color |
| `--ck-disabled-opacity` | `0.5` | Opacity for disabled elements |

#### Public Methods

| Method | Parameters | Returns | Description |
|--------|------------|---------|-------------|
| `undo()` | none | `void` | Undo last data change |
| `redo()` | none | `void` | Redo last undone change |
| `clearHistory()` | none | `void` | Clear undo/redo history |
| `moveUp(index)` | `index: number` | `void` | Move row up one position |
| `moveDown(index)` | `index: number` | `void` | Move row down one position |
| `moveTo(from, to)` | `from: number, to: number` | `void` | Move row to specific position |
| `select(index)` | `index: number` | `void` | Select a row |
| `deselect(index)` | `index: number` | `void` | Deselect a row |
| `toggleSelection(index)` | `index: number` | `void` | Toggle row selection |
| `selectAll()` | none | `void` | Select all rows |
| `deselectAll()` | none | `void` | Deselect all rows |
| `clearSelection()` | none | `void` | Clear all selections |
| `isSelected(index)` | `index: number` | `boolean` | Check if row is selected |
| `deleteSelected()` | none | `void` | Hard delete selected rows |
| `markSelectedDeleted()` | none | `void` | Soft delete selected rows |
| `bulkUpdate(updates)` | `updates: Record<string, unknown>` | `void` | Update all selected rows |
| `getSelectedData()` | none | `unknown[]` | Get data for selected rows |
| `toFormData()` | none | `FormData` | Convert data to FormData |
| `toJSON(space?)` | `space?: number` | `string` | Convert data to JSON string |
| `checkValidity()` | none | `boolean` | Validate all rows |
| `reportValidity()` | none | `boolean` | Validate and update UI |
| `validateRowDetailed(index)` | `index: number` | `ValidationResult` | Get detailed validation for row |
| `clearError()` | none | `void` | Clear error boundary state |

#### Read-Only Properties

| Property | Type | Description |
|----------|------|-------------|
| `canUndo` | `boolean` | Whether undo is available |
| `canRedo` | `boolean` | Whether redo is available |
| `selectedIndices` | `number[]` | Array of selected row indices |
| `form` | `HTMLFormElement \| null` | Associated form element |
| `value` | `string` | JSON string of data (also settable) |
| `hasError` | `boolean` | Whether component has an error |
| `lastError` | `Error \| null` | Last error that occurred |

### Visual/Interaction Summary

The component renders as a container with a rows section and an add button section. Each row can display in two modes: display (showing data) or edit (allowing modification). Only one row can be in edit mode at a time.

**Default Layout:**
```
┌─────────────────────────────────────┐
│ [part="root"]                       │
│  ┌───────────────────────────────┐  │
│  │ [part="rows"]                 │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Row 0 (display/edit)    │  │  │
│  │  └─────────────────────────┘  │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Row 1 (display/edit)    │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
│  ┌───────────────────────────────┐  │
│  │ [part="add-button"]           │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Modal Layout (when modal-edit enabled):**
```
┌─────────────────────────────────────┐
│ [part="modal"] (overlay)            │
│  ┌───────────────────────────────┐  │
│  │ [part="modal-surface"]        │  │
│  │  ┌─────────────────────────┐  │  │
│  │  │ Edit template content   │  │  │
│  │  └─────────────────────────┘  │  │
│  └───────────────────────────────┘  │
└─────────────────────────────────────┘
```

**Interaction Flow:**
1. User clicks toggle button → Row enters edit mode
2. User modifies inputs → Data bindings update, validation runs
3. User clicks save → If valid, changes committed, row returns to display
4. User clicks cancel → Changes discarded, row returns to display (or removed if new)

---

## 9. Implementation Verification

### 9.1 Per-Feature Checklist

Before marking any FR as complete, verify:

- [ ] **RED**: Failing test(s) written and committed
- [ ] **GREEN**: Minimal code passes test(s)
- [ ] **REFACTOR**: Code cleaned up, tests still pass
- [ ] **Regression**: All existing tests pass (`npm test`)
- [ ] **Lint**: No ESLint warnings (`npm run lint`)
- [ ] **Types**: TypeScript compiles (`npm run build`)
- [ ] **Demo**: Feature visible in `examples/demo.html`
- [ ] **Docs**: Spec updated if behavior changed
- [ ] **Steps**: `docs/steps.md` entry added with TDD cycle log

### 9.2 Phase Completion Checklist

Before moving to next implementation phase:

- [ ] All phase FRs verified per above checklist
- [ ] Code review completed (see `docs/code-review-YYYY-MM-DD.md`)
- [ ] Remediation plan created for any High-priority issues
- [ ] High-priority issues from review addressed
- [ ] Post-phase checkpoint created (`docs/checkpoint-YYYY-MM-DD-phase-N-complete.md`)

### 9.3 Security Review Requirements

Every feature must be reviewed for:

| Category | Check | Required Test |
|----------|-------|---------------|
| XSS | No innerHTML with user data | `Security - XSS` test suite |
| Injection | User input validated | `Security - Input Validation` tests |
| Prototype Pollution | Safe object handling | `Security - Prototype` tests |

### 9.4 Accessibility Review Requirements

Every feature must be reviewed for:

| Category | Check | Required Test |
|----------|-------|---------------|
| ARIA | Correct roles/attributes | `Accessibility - ARIA` test suite |
| Keyboard | All controls reachable | `Accessibility - Keyboard` tests |
| Focus | Logical focus management | `Accessibility - Focus` tests |
| Screen Reader | Content announced | Manual testing required |

### 9.5 Quality Gates

No feature is complete until ALL gates pass:

| Gate | Command | Pass Criteria |
|------|---------|---------------|
| Unit Tests | `npm test` | 0 failures |
| Lint | `npm run lint` | 0 warnings |
| Types | `npm run build` | 0 errors |
| Coverage | `npm test -- --coverage` | ≥90% lines |

---

## 10. Next Steps

### Immediate Actions
1. **Review & Validation**: Share this document with stakeholders for feedback
2. **Type Definition Export**: Ensure all TypeScript interfaces are exported for consumers
3. **Documentation**: Create API documentation and usage examples

### Development Planning
4. **Test Coverage**: Develop comprehensive unit tests based on acceptance criteria
5. **Accessibility Audit**: Conduct WCAG 2.1 AA compliance testing
6. **Performance Benchmarking**: Test with large datasets (500-1000 rows)

### Future Considerations
7. **Virtual Scrolling**: Add support for virtualized rendering of large lists
8. **Drag-and-Drop**: Implement drag-and-drop reordering
9. **Column Sorting**: Add optional column-based sorting
10. **Keyboard Shortcuts**: Add comprehensive keyboard navigation shortcuts

### Questions for Development Team
- Should the component support multi-row editing in the future (removing exclusive lock)?
- Is there a need for row grouping or nested arrays?
- Should validation support async validators (e.g., server-side uniqueness checks)?

---

**Document Control**
- **Last Updated**: December 5, 2025
- **Updated By**: Requirements Analyst AI
- **Review Status**: Enhanced with TDD workflow integration
- **Source File**: `ck-editable-array.ts` (1767 lines)
- **Related Documents**:
  - `docs/webcomponent.addfeature.thenreview.md` — Master TDD workflow
  - `docs/ck-editable-array-tdd-plan.md` — Detailed test scenarios
  - `docs/implementation-roadmap.md` — Phase-by-phase implementation plan
  - `docs/testing-guidelines.md` — Edge case and error testing patterns
