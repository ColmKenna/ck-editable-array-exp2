# TDD Plan: ck-editable-array

**Spec File**: `specs/ck-editable-array-spec.md`
**Date**: December 6, 2025
**Framework**: Jest + jsdom

---

## 1. Scope & Assumptions

### Summary
The `ck-editable-array` component is a template-driven web component that manages CRUD operations on array data. It uses slot-based templates for display/edit modes, supports validation, undo/redo history, batch selection, row reordering, and form integration.

### Assumptions
- Component uses Shadow DOM (`attachShadow({ mode: 'open' })`)
- Browser supports Custom Elements v1 and Shadow DOM
- Single-row edit locking (exclusive editing)
- Soft delete pattern with restore capability
- Deep cloning for data immutability

---

## 2. Architecture

### Chosen Architecture: Layered/Modular
- **CkEditableArray**: Main component class (orchestration)
- **Internal State**: `_data`, `_history`, `_selectedIndices`
- **Rendering**: Template cloning with data binding
- **Validation**: Schema-based with i18n support

### Trade-offs
- Shadow DOM provides encapsulation but limits external styling
- Snapshot-based rollback increases memory for large edits
- Single-row locking simplifies state but limits bulk inline editing

---

## 3. Testing Strategy (TDD)

### Framework & Runner
- **Jest** v30+ with `jest-environment-jsdom`
- **ts-jest** for TypeScript support

### Red/Green/Refactor Enforcement
1. Write failing test first (RED)
2. Implement minimal code to pass (GREEN)
3. Refactor while keeping tests green (REFACTOR)

### Coverage Targets
- Lines: >= 90%
- Branches: >= 80%

### Test Organization
```
tests/
├── ck-editable-array/
│   ├── core-data.test.ts           # FR-001
│   ├── add-row.test.ts             # FR-002
│   ├── edit-mode.test.ts           # FR-003, FR-004, FR-005
│   ├── delete-restore.test.ts      # FR-006, FR-007
│   ├── data-binding.test.ts        # FR-008, FR-009, FR-009a
│   ├── undo-redo.test.ts           # FR-010, FR-011, FR-012, FR-013
│   ├── reordering.test.ts          # FR-014, FR-015, FR-016
│   ├── selection.test.ts           # FR-017, FR-017a-e
│   ├── validation.test.ts          # FR-018, FR-019, FR-020, FR-021
│   ├── form-integration.test.ts    # FR-022, FR-023, FR-024, FR-025, FR-025a
│   ├── modal-edit.test.ts          # FR-026, FR-027
│   ├── readonly.test.ts            # FR-028
│   ├── error-handling.test.ts      # FR-029, FR-030
│   ├── accessibility.test.ts       # NFR-A-001 to NFR-A-004
│   └── performance.test.ts         # NFR-P-001 to NFR-P-003
```

---

## 4. Implementation Phases

### Phase 1: Foundation (Must-have Core)
**Priority**: Must-have
**FRs**: FR-001, FR-008, FR-009, FR-009a, FR-028

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [x] | TC-001-01 | FR-001 | Setting data property stores deep clone | core-data.test.ts |
| [x] | TC-001-02 | FR-001 | Getting data returns clean array without markers | core-data.test.ts |
| [x] | TC-001-03 | FR-001 | Setting data dispatches datachanged event | core-data.test.ts |
| [x] | TC-001-04 | FR-001 | Non-array data results in empty array | core-data.test.ts |
| [x] | TC-008-01 | FR-008 | data-bind sets text content from field | data-binding.test.ts |
| [x] | TC-008-02 | FR-008 | Nested paths work (person.address.city) | data-binding.test.ts |
| [x] | TC-008-03 | FR-008 | Array values joined with comma separator | data-binding.test.ts |
| [x] | TC-009-01 | FR-009 | Input value populated from data | data-binding.test.ts |
| [x] | TC-009-02 | FR-009 | Input changes update row data | data-binding.test.ts |
| [x] | TC-009a-01 | FR-009a | Input name attribute generated correctly | data-binding.test.ts |
| [x] | TC-009a-02 | FR-009a | Input id attribute generated correctly | data-binding.test.ts |
| [x] | TC-009a-03 | FR-009a | Nested paths generate correct name/id | data-binding.test.ts |
| [x] | TC-028-01 | FR-028 | readonly attribute blocks all modifications | readonly.test.ts |
| [x] | TC-028-02 | FR-028 | Inputs have readOnly property set | readonly.test.ts |

### Phase 2: CRUD Operations (Must-have)
**Priority**: Must-have
**FRs**: FR-002, FR-003, FR-004, FR-005, FR-006, FR-007

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-002-01 | FR-002 | data-action="add" creates new row | add-row.test.ts |
| [ ] | TC-002-02 | FR-002 | New row uses newItemFactory | add-row.test.ts |
| [ ] | TC-002-03 | FR-002 | New row marked with __isNew | add-row.test.ts |
| [ ] | TC-002-04 | FR-002 | New row enters edit mode automatically | add-row.test.ts |
| [ ] | TC-002-05 | FR-002 | Add blocked when another row editing | add-row.test.ts |
| [ ] | TC-002-06 | FR-002 | Add blocked in readonly mode | add-row.test.ts |
| [ ] | TC-003-01 | FR-003 | data-action="toggle" enters edit mode | edit-mode.test.ts |
| [ ] | TC-003-02 | FR-003 | beforetogglemode event fired (cancelable) | edit-mode.test.ts |
| [ ] | TC-003-03 | FR-003 | Original state stored as snapshot | edit-mode.test.ts |
| [ ] | TC-003-04 | FR-003 | Row editing property set to true | edit-mode.test.ts |
| [ ] | TC-003-05 | FR-003 | Display hidden, edit shown | edit-mode.test.ts |
| [ ] | TC-003-06 | FR-003 | Focus moves to first input | edit-mode.test.ts |
| [ ] | TC-003-07 | FR-003 | aftertogglemode event fired | edit-mode.test.ts |
| [ ] | TC-003-08 | FR-003 | Exclusive locking - only one row editable | edit-mode.test.ts |
| [ ] | TC-004-01 | FR-004 | data-action="save" exits edit mode | edit-mode.test.ts |
| [ ] | TC-004-02 | FR-004 | Save removes editing flag and markers | edit-mode.test.ts |
| [ ] | TC-004-03 | FR-004 | datachanged event dispatched | edit-mode.test.ts |
| [ ] | TC-004-04 | FR-004 | Focus returns to toggle button | edit-mode.test.ts |
| [ ] | TC-004-05 | FR-004 | Save blocked if validation fails | edit-mode.test.ts |
| [ ] | TC-005-01 | FR-005 | data-action="cancel" exits edit mode | edit-mode.test.ts |
| [ ] | TC-005-02 | FR-005 | Cancel restores original data from snapshot | edit-mode.test.ts |
| [ ] | TC-005-03 | FR-005 | Cancel removes new row (__isNew) | edit-mode.test.ts |
| [ ] | TC-005-04 | FR-005 | beforetogglemode event fired (cancelable) | edit-mode.test.ts |
| [ ] | TC-005-05 | FR-005 | aftertogglemode event fired | edit-mode.test.ts |
| [ ] | TC-006-01 | FR-006 | data-action="delete" sets deleted:true | delete-restore.test.ts |
| [ ] | TC-006-02 | FR-006 | Row receives ck-deleted class | delete-restore.test.ts |
| [ ] | TC-006-03 | FR-006 | datachanged event dispatched | delete-restore.test.ts |
| [ ] | TC-006-04 | FR-006 | Delete blocked when row editing | delete-restore.test.ts |
| [ ] | TC-006-05 | FR-006 | Delete blocked in readonly mode | delete-restore.test.ts |
| [ ] | TC-007-01 | FR-007 | data-action="restore" sets deleted:false | delete-restore.test.ts |
| [ ] | TC-007-02 | FR-007 | ck-deleted class removed | delete-restore.test.ts |
| [ ] | TC-007-03 | FR-007 | datachanged event dispatched | delete-restore.test.ts |

### Phase 3: Validation (Must-have)
**Priority**: Must-have
**FRs**: FR-018, FR-019, FR-020

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-018-01 | FR-018 | Schema validates required fields | validation.test.ts |
| [ ] | TC-018-02 | FR-018 | Schema validates minLength | validation.test.ts |
| [ ] | TC-018-03 | FR-018 | Schema validates maxLength | validation.test.ts |
| [ ] | TC-018-04 | FR-018 | Schema validates pattern (regex) | validation.test.ts |
| [ ] | TC-018-05 | FR-018 | Schema supports custom validator | validation.test.ts |
| [ ] | TC-018-06 | FR-018 | Save button disabled when invalid | validation.test.ts |
| [ ] | TC-019-01 | FR-019 | Invalid input gets aria-invalid="true" | validation.test.ts |
| [ ] | TC-019-02 | FR-019 | Invalid input gets data-invalid="true" | validation.test.ts |
| [ ] | TC-019-03 | FR-019 | Error message shown in data-field-error | validation.test.ts |
| [ ] | TC-019-04 | FR-019 | aria-describedby links input to error | validation.test.ts |
| [ ] | TC-020-01 | FR-020 | Edit wrapper gets data-row-invalid="true" | validation.test.ts |
| [ ] | TC-020-02 | FR-020 | data-error-count shows error count | validation.test.ts |
| [ ] | TC-020-03 | FR-020 | data-error-summary shows all errors | validation.test.ts |

### Phase 4: Undo/Redo History (Should-have)
**Priority**: Should-have
**FRs**: FR-010, FR-011, FR-012, FR-013

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-010-01 | FR-010 | undo() restores previous state | undo-redo.test.ts |
| [ ] | TC-010-02 | FR-010 | canUndo returns true when history exists | undo-redo.test.ts |
| [ ] | TC-010-03 | FR-010 | datachanged event dispatched on undo | undo-redo.test.ts |
| [ ] | TC-010-04 | FR-010 | undo event dispatched with data | undo-redo.test.ts |
| [ ] | TC-011-01 | FR-011 | redo() restores next state | undo-redo.test.ts |
| [ ] | TC-011-02 | FR-011 | canRedo returns true after undo | undo-redo.test.ts |
| [ ] | TC-011-03 | FR-011 | datachanged event dispatched on redo | undo-redo.test.ts |
| [ ] | TC-011-04 | FR-011 | redo event dispatched with data | undo-redo.test.ts |
| [ ] | TC-012-01 | FR-012 | History respects maxHistorySize | undo-redo.test.ts |
| [ ] | TC-012-02 | FR-012 | Oldest entries removed when limit exceeded | undo-redo.test.ts |
| [ ] | TC-013-01 | FR-013 | clearHistory() empties history | undo-redo.test.ts |
| [ ] | TC-013-02 | FR-013 | canUndo/canRedo false after clear | undo-redo.test.ts |

### Phase 5: Row Reordering (Should-have)
**Priority**: Should-have
**FRs**: FR-014, FR-015, FR-016

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-014-01 | FR-014 | moveUp() swaps with row above | reordering.test.ts |
| [ ] | TC-014-02 | FR-014 | moveUp() no-op for first row | reordering.test.ts |
| [ ] | TC-014-03 | FR-014 | data-action="move-up" triggers moveUp | reordering.test.ts |
| [ ] | TC-014-04 | FR-014 | reorder event dispatched | reordering.test.ts |
| [ ] | TC-014-05 | FR-014 | moveUp blocked when row editing | reordering.test.ts |
| [ ] | TC-015-01 | FR-015 | moveDown() swaps with row below | reordering.test.ts |
| [ ] | TC-015-02 | FR-015 | moveDown() no-op for last row | reordering.test.ts |
| [ ] | TC-015-03 | FR-015 | data-action="move-down" triggers moveDown | reordering.test.ts |
| [ ] | TC-015-04 | FR-015 | reorder event dispatched | reordering.test.ts |
| [ ] | TC-016-01 | FR-016 | moveTo() moves row to target position | reordering.test.ts |
| [ ] | TC-016-02 | FR-016 | moveTo() clamps to valid range | reordering.test.ts |
| [ ] | TC-016-03 | FR-016 | reorder event dispatched | reordering.test.ts |

### Phase 6: Selection & Batch Operations (Should-have)
**Priority**: Should-have
**FRs**: FR-017, FR-017a, FR-017b, FR-017c, FR-017d, FR-017e

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-017-01 | FR-017 | select() adds index to selectedIndices | selection.test.ts |
| [ ] | TC-017-02 | FR-017 | Row gets data-selected="true" | selection.test.ts |
| [ ] | TC-017-03 | FR-017 | Row gets aria-selected="true" | selection.test.ts |
| [ ] | TC-017-04 | FR-017 | selectionchanged event dispatched | selection.test.ts |
| [ ] | TC-017-05 | FR-017 | deselect() removes index | selection.test.ts |
| [ ] | TC-017-06 | FR-017 | toggleSelection() toggles state | selection.test.ts |
| [ ] | TC-017-07 | FR-017 | isSelected() returns correct state | selection.test.ts |
| [ ] | TC-017a-01 | FR-017a | selectAll() selects all rows | selection.test.ts |
| [ ] | TC-017b-01 | FR-017b | clearSelection() clears all | selection.test.ts |
| [ ] | TC-017b-02 | FR-017b | deselectAll() clears all | selection.test.ts |
| [ ] | TC-017c-01 | FR-017c | deleteSelected() removes rows | selection.test.ts |
| [ ] | TC-017c-02 | FR-017c | Selection cleared after delete | selection.test.ts |
| [ ] | TC-017d-01 | FR-017d | markSelectedDeleted() soft deletes | selection.test.ts |
| [ ] | TC-017e-01 | FR-017e | bulkUpdate() updates selected rows | selection.test.ts |
| [ ] | TC-017e-02 | FR-017e | getSelectedData() returns selected data | selection.test.ts |

### Phase 7: Form Integration (Should-have)
**Priority**: Should-have
**FRs**: FR-022, FR-023, FR-024, FR-025, FR-025a

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-022-01 | FR-022 | value getter returns JSON string | form-integration.test.ts |
| [ ] | TC-022-02 | FR-022 | value setter parses JSON | form-integration.test.ts |
| [ ] | TC-022-03 | FR-022 | Invalid JSON handled gracefully | form-integration.test.ts |
| [ ] | TC-023-01 | FR-023 | toFormData() returns FormData | form-integration.test.ts |
| [ ] | TC-023-02 | FR-023 | FormData keys follow pattern | form-integration.test.ts |
| [ ] | TC-023-03 | FR-023 | Internal properties excluded | form-integration.test.ts |
| [ ] | TC-023-04 | FR-023 | Nested objects flattened | form-integration.test.ts |
| [ ] | TC-024-01 | FR-024 | checkValidity() validates all rows | form-integration.test.ts |
| [ ] | TC-024-02 | FR-024 | Returns true when all valid | form-integration.test.ts |
| [ ] | TC-024-03 | FR-024 | Returns false when any invalid | form-integration.test.ts |
| [ ] | TC-025-01 | FR-025 | reportValidity() updates UI | form-integration.test.ts |
| [ ] | TC-025a-01 | FR-025a | formAssociated static property | form-integration.test.ts |
| [ ] | TC-025a-02 | FR-025a | form property returns parent form | form-integration.test.ts |
| [ ] | TC-025a-03 | FR-025a | formResetCallback clears data | form-integration.test.ts |
| [ ] | TC-025a-04 | FR-025a | formDisabledCallback sets readonly | form-integration.test.ts |

### Phase 8: Modal Edit Mode (Should-have)
**Priority**: Should-have
**FRs**: FR-026, FR-027

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-026-01 | FR-026 | modalEdit=true renders edit in modal | modal-edit.test.ts |
| [ ] | TC-026-02 | FR-026 | modal-edit attribute enables modal | modal-edit.test.ts |
| [ ] | TC-026-03 | FR-026 | Modal overlay shown (ck-hidden removed) | modal-edit.test.ts |
| [ ] | TC-026-04 | FR-026 | aria-hidden="false" on modal | modal-edit.test.ts |
| [ ] | TC-026-05 | FR-026 | Focus trapped in modal | modal-edit.test.ts |
| [ ] | TC-027-01 | FR-027 | Save closes modal | modal-edit.test.ts |
| [ ] | TC-027-02 | FR-027 | Cancel closes modal | modal-edit.test.ts |
| [ ] | TC-027-03 | FR-027 | aria-hidden="true" when closed | modal-edit.test.ts |
| [ ] | TC-027-04 | FR-027 | Focus returns to toggle button | modal-edit.test.ts |

### Phase 9: i18n Support (Should-have)
**Priority**: Should-have
**FRs**: FR-021

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-021-01 | FR-021 | i18n messages used for required | validation.test.ts |
| [ ] | TC-021-02 | FR-021 | i18n messages used for minLength | validation.test.ts |
| [ ] | TC-021-03 | FR-021 | i18n messages used for maxLength | validation.test.ts |
| [ ] | TC-021-04 | FR-021 | i18n messages used for pattern | validation.test.ts |

### Phase 10: Error Handling (Should-have)
**Priority**: Should-have
**FRs**: FR-029, FR-030

| Done | Test Case ID | FR | Description | Test File |
|------|--------------|----|----|------------|
| [ ] | TC-029-01 | FR-029 | Rendering error sets hasError=true | error-handling.test.ts |
| [ ] | TC-029-02 | FR-029 | lastError contains Error object | error-handling.test.ts |
| [ ] | TC-029-03 | FR-029 | rendererror event dispatched | error-handling.test.ts |
| [ ] | TC-029-04 | FR-029 | debug=true logs to console | error-handling.test.ts |
| [ ] | TC-030-01 | FR-030 | clearError() resets hasError | error-handling.test.ts |
| [ ] | TC-030-02 | FR-030 | clearError() resets lastError | error-handling.test.ts |

### Phase 11: Accessibility (NFR)
**Priority**: Must-have (NFR-A)

| Done | Test Case ID | NFR | Description | Test File |
|------|--------------|-----|-------------|------------|
| [ ] | TC-A-001-01 | NFR-A-001 | Invalid inputs have aria-invalid | accessibility.test.ts |
| [ ] | TC-A-001-02 | NFR-A-001 | aria-describedby links to error | accessibility.test.ts |
| [ ] | TC-A-002-01 | NFR-A-002 | Focus moves to first input on edit | accessibility.test.ts |
| [ ] | TC-A-002-02 | NFR-A-002 | Focus returns to toggle on save | accessibility.test.ts |
| [ ] | TC-A-002-03 | NFR-A-002 | Focus trapped in modal | accessibility.test.ts |
| [ ] | TC-A-003-01 | NFR-A-003 | Modal has role="dialog" | accessibility.test.ts |
| [ ] | TC-A-003-02 | NFR-A-003 | Modal has aria-modal="true" | accessibility.test.ts |
| [ ] | TC-A-003-03 | NFR-A-003 | Overlay has aria-hidden toggled | accessibility.test.ts |
| [ ] | TC-A-004-01 | NFR-A-004 | Selected rows have aria-selected | accessibility.test.ts |

### Phase 12: Performance & Reliability (NFR)
**Priority**: Should-have (NFR-P, NFR-R)

| Done | Test Case ID | NFR | Description | Test File |
|------|--------------|-----|-------------|------------|
| [ ] | TC-P-001-01 | NFR-P-001 | Input changes don't full re-render | performance.test.ts |
| [ ] | TC-P-002-01 | NFR-P-002 | History bounded by maxHistorySize | performance.test.ts |
| [ ] | TC-P-003-01 | NFR-P-003 | 100 rows render < 100ms | performance.test.ts |
| [x] | TC-R-001-01 | NFR-R-001 | External mutation doesn't affect state | core-data.test.ts |
| [x] | TC-R-002-01 | NFR-R-002 | Circular references handled | core-data.test.ts |
| [x] | TC-R-003-01 | NFR-R-003 | Non-array data handled gracefully | core-data.test.ts |

---

## 5. Libraries & Versions

| Library | Version | Purpose |
|---------|---------|---------|
| TypeScript | ^5.3.3 | Type safety |
| Jest | ^30.1.1 | Test runner |
| jest-environment-jsdom | ^30.1.1 | DOM environment |
| ts-jest | ^29.4.1 | TypeScript compilation |

---

## 6. Security Considerations

| Category | Implementation |
|----------|----------------|
| XSS Prevention | Use textContent, not innerHTML for user data |
| Input Validation | Schema-based validation before save |
| Prototype Pollution | Safe object cloning with null prototype checks |

---

## 7. Running Tests

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific FR tests
npm test -- --grep "FR-001"

# Run specific test file
npm test -- tests/ck-editable-array/core-data.test.ts

# Watch mode
npm test:watch
```

---

## 8. Implementation Order (TDD Cycles)

### Cycle 1: Core Data Foundation
1. [x] RED: Write TC-001-01 (data setter stores deep clone)
2. [x] GREEN: Implement data setter with JSON clone
3. [x] REFACTOR: Extract deepClone utility
4. [x] RED: Write TC-001-02 (data getter returns clean array)
5. [x] GREEN: Implement getter that strips markers
6. Continue for remaining Phase 1 tests...

### Cycle 2: Template Rendering
1. RED: Write TC-008-01 (data-bind text content)
2. GREEN: Implement basic slot parsing and binding
3. REFACTOR: Extract template rendering logic
4. Continue with remaining binding tests...

### Cycle 3: Edit Mode
1. RED: Write TC-003-01 (toggle enters edit)
2. GREEN: Implement action handler and mode toggle
3. REFACTOR: Extract action dispatcher
4. Continue with save/cancel tests...

### Subsequent Cycles
Continue pattern for each phase, always RED → GREEN → REFACTOR

---

## 9. Traceability Matrix

| FR | Test Cases | Priority |
|----|------------|----------|
| FR-001 | TC-001-01, TC-001-02, TC-001-03, TC-001-04 | Must-have |
| FR-002 | TC-002-01 to TC-002-06 | Must-have |
| FR-003 | TC-003-01 to TC-003-08 | Must-have |
| FR-004 | TC-004-01 to TC-004-05 | Must-have |
| FR-005 | TC-005-01 to TC-005-05 | Must-have |
| FR-006 | TC-006-01 to TC-006-05 | Must-have |
| FR-007 | TC-007-01 to TC-007-03 | Must-have |
| FR-008 | TC-008-01 to TC-008-03 | Must-have |
| FR-009 | TC-009-01, TC-009-02 | Must-have |
| FR-009a | TC-009a-01 to TC-009a-03 | Must-have |
| FR-010 | TC-010-01 to TC-010-04 | Should-have |
| FR-011 | TC-011-01 to TC-011-04 | Should-have |
| FR-012 | TC-012-01, TC-012-02 | Should-have |
| FR-013 | TC-013-01, TC-013-02 | Should-have |
| FR-014 | TC-014-01 to TC-014-05 | Should-have |
| FR-015 | TC-015-01 to TC-015-04 | Should-have |
| FR-016 | TC-016-01 to TC-016-03 | Should-have |
| FR-017 | TC-017-01 to TC-017-07 | Should-have |
| FR-017a | TC-017a-01 | Should-have |
| FR-017b | TC-017b-01, TC-017b-02 | Should-have |
| FR-017c | TC-017c-01, TC-017c-02 | Should-have |
| FR-017d | TC-017d-01 | Should-have |
| FR-017e | TC-017e-01, TC-017e-02 | Should-have |
| FR-018 | TC-018-01 to TC-018-06 | Must-have |
| FR-019 | TC-019-01 to TC-019-04 | Must-have |
| FR-020 | TC-020-01 to TC-020-03 | Must-have |
| FR-021 | TC-021-01 to TC-021-04 | Should-have |
| FR-022 | TC-022-01 to TC-022-03 | Should-have |
| FR-023 | TC-023-01 to TC-023-04 | Should-have |
| FR-024 | TC-024-01 to TC-024-03 | Should-have |
| FR-025 | TC-025-01 | Should-have |
| FR-025a | TC-025a-01 to TC-025a-04 | Should-have |
| FR-026 | TC-026-01 to TC-026-05 | Should-have |
| FR-027 | TC-027-01 to TC-027-04 | Should-have |
| FR-028 | TC-028-01, TC-028-02 | Must-have |
| FR-029 | TC-029-01 to TC-029-04 | Should-have |
| FR-030 | TC-030-01, TC-030-02 | Should-have |

---

## 10. Extending Tests

### Adding New Tests
1. Identify the FR or NFR the test covers
2. Add test to appropriate file based on Phase organization
3. Follow naming convention: `TC-{FR}-{sequence}`
4. Tag with `@regression` if it covers existing functionality

### Test File Template
```typescript
describe('FR-XXX: Feature Name', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = new CkEditableArray();
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-XXX-01: description', () => {
    // Arrange
    // Act
    // Assert
  });
});
```

---

## 11. Auto-Verification Checklist

Before completing each phase:

- [ ] All phase FRs have passing tests
- [ ] Coverage meets targets (90% lines, 80% branches)
- [x] No lint warnings (`npm run lint`)
- [x] TypeScript compiles (`npm run build`)
- [x] All existing tests still pass
- [ ] No TODO comments without issue references
- [ ] Security tests pass (XSS, input validation)
- [ ] Accessibility tests pass (ARIA)
- [x] Documentation updated if API changed

---

**Document Control**
- **Created**: December 6, 2025
- **Spec Reference**: `specs/ck-editable-array-spec.md` v1.1
- **Total Test Cases**: 124
- **Must-have Test Cases**: 51
- **Should-have Test Cases**: 73
