# Remediation Plan: ck-editable-array Component

**Generated:** December 8, 2025  
**Based on:** code-review-2025-12-08.md  
**Component:** `src/components/ck-editable-array/ck-editable-array.ts`

## Executive Summary

The code review identified **12 issues** across 3 priority levels:
- **3 High-priority** (code complexity, magic numbers, error recovery)
- **5 Medium-priority** (performance, API design, lifecycle, documentation)
- **4 Low-priority** (code quality improvements)

**Key Risk Areas:**
1. Component size (1743 lines) makes maintenance and testing difficult
2. Event listener cleanup missing, potential memory leak
3. Error recovery incomplete after render failures

**Estimated Complexity:** Medium-Large (40-60 hours total)

**Recommended Approach:** Phased implementation over 4 sprints, starting with high-priority items. Each phase is independently deployable and testable.

---

## Phase 1: High-Priority Fixes (Critical Path)

**Goal:** Address code maintainability, configuration clarity, and error resilience  
**Risk Level:** Medium  
**Dependencies:** None  
**Estimated Effort:** L (16-20 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 1.1 | High-CodeQuality-Constants | Extract magic numbers to named constants | All hardcoded timeouts/limits replaced with named constants at file top | All 152 tests pass | None (refactor only) |
| 1.2 | High-ErrorHandling-Recovery | Add render retry mechanism | `retry()` method exists, `_isRendering` flag prevents loops, tests verify | error-handling.test.ts | 2 new: retry success, retry prevents loop |
| 1.3 | High-Maintainability-ModuleSize | Extract validation logic to separate file | New `validation.ts` module exports validation functions, component imports and uses them | validation.test.ts, all tests pass | None (tests already exist) |

### Code Change Previews

#### Task 1.1: Extract Magic Numbers

**Before:**
```typescript
private _validationTimeout: ReturnType<typeof setTimeout> | null = null;
// ... later in code
clearTimeout(this._validationTimeout);
this._validationTimeout = setTimeout(() => {
  this.updateUiValidationState(index);
}, 150); // What is 150? Why 150?
```

**After:**
```typescript
// At top of file
const VALIDATION_DEBOUNCE_MS = 150; // Debounce validation to avoid excessive updates during typing
const DEFAULT_HISTORY_SIZE = 50; // Undo/redo stack size limit
const MAX_RENDER_TIME_MS = 150; // Performance target for 100-row render

private _validationTimeout: ReturnType<typeof setTimeout> | null = null;
// ... later in code
clearTimeout(this._validationTimeout);
this._validationTimeout = setTimeout(() => {
  this.updateUiValidationState(index);
}, VALIDATION_DEBOUNCE_MS);
```

**Explanation:** Named constants make the codebase self-documenting and easier to configure.

#### Task 1.2: Error Recovery

**Before:**
```typescript
private render() {
  try {
    // ... rendering logic
  } catch (error) {
    this.handleRenderError(/*...*/);
    // Component may be in broken state, no way to recover
  }
}
```

**After:**
```typescript
private _isRendering = false;

private render() {
  if (this._isRendering) return; // Prevent re-render loops
  this._isRendering = true;
  
  try {
    // ... rendering logic
    this._isRendering = false;
  } catch (error) {
    this._isRendering = false;
    this.handleRenderError(/*...*/);
  }
}

// FR-030 extension: Retry rendering after error
retry(): boolean {
  if (!this._hasError) return true;
  this.clearError();
  try {
    this.render();
    return !this._hasError;
  } catch {
    return false;
  }
}
```

**Explanation:** Adds safety guard against render loops and provides recovery mechanism.

---

## Phase 2: Medium-Priority Performance & Lifecycle

**Goal:** Optimize validation behavior and prevent memory leaks  
**Risk Level:** Low  
**Dependencies:** None  
**Estimated Effort:** M (12-16 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 2.1 | Medium-Performance-ValidationDebounce | Implement per-field validation debounce | Each input field has its own debounce timeout | validation.test.ts | 1 new: rapid multi-field typing test |
| 2.2 | Medium-Lifecycle-Cleanup | Add disconnectedCallback cleanup | Event listeners removed in disconnectedCallback | All tests pass | 1 new: verify no memory leak after remove |
| 2.3 | Medium-CodeQuality-DeepClone | Add max depth to deepClone() | deepClone throws error if depth > 10 | core-data.test.ts | 2 new: deeply nested object, depth limit error |

### Code Change Previews

#### Task 2.1: Per-Field Debounce

**Before:**
```typescript
private _validationTimeout: ReturnType<typeof setTimeout> | null = null;

private handleWrapperInput = (e: Event) => {
  // Single timeout for all fields
  clearTimeout(this._validationTimeout);
  this._validationTimeout = setTimeout(() => {
    // validate...
  }, 150);
};
```

**After:**
```typescript
private _validationTimeouts: Map<string, ReturnType<typeof setTimeout>> = new Map();

private handleWrapperInput = (e: Event) => {
  const target = e.target as HTMLInputElement;
  const field = target.getAttribute('data-bind');
  if (!field) return;
  
  // Per-field debounce
  const existing = this._validationTimeouts.get(field);
  if (existing) clearTimeout(existing);
  
  const timeout = setTimeout(() => {
    this._validationTimeouts.delete(field);
    // validate field...
  }, VALIDATION_DEBOUNCE_MS);
  
  this._validationTimeouts.set(field, timeout);
};
```

**Explanation:** Prevents validation skipping when user rapidly types across multiple fields.

#### Task 2.2: Lifecycle Cleanup

**Before:**
```typescript
disconnectedCallback() {
  // Event listeners never removed - potential memory leak!
}
```

**After:**
```typescript
connectedCallback() {
  // Store bound references for later cleanup
  this._boundWrapperClick = this.handleWrapperClick.bind(this);
  this._boundWrapperInput = this.handleWrapperInput.bind(this);
  // Attach listeners...
}

disconnectedCallback() {
  // Clean up event listeners
  const wrapper = this.shadow.querySelector('.ck-editable-array');
  if (wrapper) {
    wrapper.removeEventListener('click', this._boundWrapperClick);
    wrapper.removeEventListener('input', this._boundWrapperInput);
  }
  
  // Clear any pending timeouts
  this._validationTimeouts.forEach(t => clearTimeout(t));
  this._validationTimeouts.clear();
}
```

**Explanation:** Prevents memory leaks when component is removed from DOM.

---

## Phase 3: Medium-Priority API & Documentation

**Goal:** Clean up API inconsistencies and improve developer experience  
**Risk Level:** Low  
**Dependencies:** None  
**Estimated Effort:** M (10-14 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 3.1 | Medium-APIDesign-DuplicateMethods | Deprecate deselectAll(), keep clearSelection() | Console warning when deselectAll() used, both methods work | selection.test.ts | None (update existing test comments) |
| 3.2 | Medium-Documentation-JSDoc | Add JSDoc to all public methods | Every public method has JSDoc with @param, @returns, @example | N/A (documentation) | None |

### Code Change Previews

#### Task 3.1: API Consolidation

**Before:**
```typescript
clearSelection(): void {
  this._selectedIndices = [];
  // ...
}

deselectAll(): void {
  this.clearSelection(); // Why two methods?
}
```

**After:**
```typescript
clearSelection(): void {
  this._selectedIndices = [];
  // ...
}

/**
 * @deprecated Use clearSelection() instead. Will be removed in v2.0.
 */
deselectAll(): void {
  console.warn('[ck-editable-array] deselectAll() is deprecated. Use clearSelection() instead.');
  this.clearSelection();
}
```

**Explanation:** Maintains backward compatibility while guiding developers to preferred API.

#### Task 3.2: JSDoc Example

**Before:**
```typescript
addRow(): void {
  // No documentation
  const newItem = this._newItemFactory();
  // ...
}
```

**After:**
```typescript
/**
 * Adds a new row to the array using the configured newItemFactory.
 * The new row enters edit mode automatically.
 * 
 * @throws {Error} If readonly mode is enabled
 * @throws {Error} If another row is currently being edited
 * @fires CkEditableArray#datachanged - After row is added
 * 
 * @example
 * element.newItemFactory = () => ({ name: '', email: '' });
 * element.addRow(); // Adds empty user
 */
addRow(): void {
  const newItem = this._newItemFactory();
  // ...
}
```

**Explanation:** Improves IDE autocomplete and reduces need to read source code.

---

## Phase 4: Low-Priority Code Quality

**Goal:** Address remaining code quality issues  
**Risk Level:** Very Low  
**Dependencies:** None  
**Estimated Effort:** S (8-12 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 4.1 | Low-CodeQuality-GetNestedValue | Return { found, value } from getNestedValue | Method signature changed, callers updated | data-binding.test.ts | 1 new: distinguish undefined value vs missing path |
| 4.2 | Low-Maintainability-ValidationTypes | Extract ValidationSchema type | Type defined at module level, used consistently | N/A (types) | None |
| 4.3 | Low-Performance-RegexConstant | Move color regex to class constant | Regex defined once, reused in getSanitizedColor | All tests pass | None (performance optimization) |
| 4.4 | Low-CodeQuality-EventHandlers | Convert arrow functions to bound methods | Named methods with .bind(this) in constructor | All tests pass | None (refactor only) |

---

## Test Plan

### Regression Tests
| Issue Reference | Test Type | Test Description | Test File Location |
|-----------------|-----------|------------------|-------------------|
| High-ErrorHandling-Recovery | Regression | Verify retry() recovers from render error | error-handling.test.ts |
| High-ErrorHandling-Recovery | Validation | Test _isRendering prevents infinite loops | error-handling.test.ts |
| Medium-Performance-ValidationDebounce | Validation | Multi-field rapid typing validates all fields | validation.test.ts |
| Medium-Lifecycle-Cleanup | Regression | Component removal doesn't leak memory | ck-editable-array.test.ts |
| Medium-CodeQuality-DeepClone | Edge Case | Deeply nested objects clone correctly | core-data.test.ts |
| Medium-CodeQuality-DeepClone | Validation | Max depth exceeded throws error | core-data.test.ts |
| Low-CodeQuality-GetNestedValue | Edge Case | Distinguish undefined value vs missing path | data-binding.test.ts |

### Existing Tests to Update
- `selection.test.ts`: Add deprecation notice comment for deselectAll()
- `validation.test.ts`: Update constants references
- All test files: Verify no regressions after refactoring

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Refactoring breaks existing functionality | Low | High | Run full test suite after each task, use TypeScript compiler to catch signature changes |
| Per-field debounce increases memory | Low | Low | Clear timeouts in disconnectedCallback, monitor with memory profiling |
| Module extraction causes import issues | Low | Medium | Keep module in same directory, use relative imports, test build process |
| API deprecation breaks downstream | Very Low | Medium | Use console.warn, document in CHANGELOG, wait 2 versions before removal |
| Documentation adds maintenance burden | Low | Low | Use automated doc generation tools (TypeDoc), keep examples runnable |

---

## Success Metrics

- **Code Complexity:** Reduce main file from 1743 lines to <800 lines (Phase 1, Task 1.3)
- **Test Coverage:** Maintain 95%+ coverage, add 9 new tests
- **Performance:** No regression in render times (<150ms for 100 rows)
- **Memory:** No leaks detected in Chrome DevTools after component removal
- **Developer Experience:** JSDoc coverage 100% for public API

---

## Implementation Schedule

| Phase | Duration | Start | End | Deliverables |
|-------|----------|-------|-----|-------------|
| Phase 1 | 3 weeks | Sprint 1 | Sprint 1 | Constants, retry mechanism, validation module |
| Phase 2 | 2 weeks | Sprint 2 | Sprint 2 | Per-field debounce, lifecycle cleanup, deep clone safety |
| Phase 3 | 2 weeks | Sprint 3 | Sprint 3 | API deprecations, JSDoc documentation |
| Phase 4 | 1.5 weeks | Sprint 4 | Sprint 4 | Code quality improvements |

**Total Timeline:** 8.5 weeks (~2 months)

---

## Approval & Sign-Off

| Role | Name | Date | Signature |
|------|------|------|-----------|
| Tech Lead | | | |
| Product Owner | | | |
| QA Lead | | | |

---

## Notes

- All phases are independently deployable
- Phases 2-4 can be reordered based on business priorities
- Phase 1 should be completed first due to high impact
- Consider feature freeze during Phase 1 to minimize merge conflicts
