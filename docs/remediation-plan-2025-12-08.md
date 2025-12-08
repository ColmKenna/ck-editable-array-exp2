# Remediation Plan: CkEditableArray

**Generated:** 2025-12-08
**Based on:** code-review-2025-12-08.md
**Component:** CkEditableArray (src/components/ck-editable-array/ck-editable-array.ts)

---

## Executive Summary

**Total Issues:** 15 (3 High, 7 Medium, 5 Low)

**Key Risk Areas:**
- **Accessibility** (3 high-priority issues): Missing focus trap, incomplete keyboard navigation, focus management gaps
- **Performance** (1 medium-priority issue): Full re-render on all data changes via innerHTML
- **API Design** (3 medium-priority issues): Inconsistent attribute reflection, missing public API methods

**Estimated Complexity:** Medium
- High-priority fixes: 8-16 hours
- Medium-priority fixes: 16-24 hours
- Low-priority fixes: 8-12 hours
- **Total:** 32-52 hours (4-7 days)

**Recommended Approach:** Phased rollout
- Phase 1: Critical accessibility fixes (High-priority, WCAG compliance)
- Phase 2: Performance and lifecycle improvements (Medium-priority)
- Phase 3: API design and code quality (Medium/Low-priority)
- Phase 4: Documentation and refactoring (Low-priority)

Each phase should be independently deployable with passing tests.

---

## Phase 1: Critical Accessibility Fixes

**Goal:** Achieve WCAG 2.1 AA compliance for keyboard and screen reader users
**Risk Level:** High
**Dependencies:** None
**Estimated Effort:** M (8-16 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 1.1 | H-Acc-focustrap | Implement modal focus trap | • Tab/Shift+Tab trapped within modal<br>• Focus cycles between first and last focusable elements<br>• Works with keyboard-only navigation | None | +3: focus trap forward, focus trap backward, focus trap with dynamic content |
| 1.2 | H-Acc-keyboard | Add Escape key to cancel edit | • Escape key closes edit mode<br>• Works in both inline and modal modes<br>• Doesn't interfere with other keyboard events | modal-edit.test.ts (partial) | +2: Escape in inline mode, Escape in modal mode |
| 1.3 | H-Acc-keyboard | Add Enter/Space keyboard support | • Enter/Space activates action buttons<br>• Works consistently across all buttons | None | +4: Enter on toggle, Space on save, Enter on delete, Space on cancel |
| 1.4 | H-Acc-focus | Fix focus restoration in modal mode | • Focus returns to toggle button after save/cancel<br>• Works when modal closes via overlay click<br>• Stores last focused element before modal | modal-edit.test.ts (partial) | +3: focus after save, focus after cancel, focus after overlay click |
| 1.5 | H-Acc-focus | Track and restore focus globally | • Store last focused element on edit enter<br>• Restore focus on edit exit<br>• Handle edge cases (element removed, element disabled) | None | +2: focus restoration after row delete, focus on disabled element fallback |

**Phase 1 Deliverables:**
- [ ] Focus trap utility method
- [ ] Keyboard event handler with Escape support
- [ ] Enhanced focus management logic
- [ ] 14 new accessibility tests passing
- [ ] All existing 78 tests still passing
- [ ] Documentation update in readme.technical.md

---

## Phase 2: Performance & Lifecycle Improvements

**Goal:** Optimize rendering performance and fix lifecycle issues
**Risk Level:** Medium
**Dependencies:** None (can run parallel to Phase 1)
**Estimated Effort:** L (16-24 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 2.1 | M-Perf-innerHTML | Implement differential rendering | • Only changed rows are updated<br>• New rows appended, removed rows deleted<br>• Existing row references preserved | performance.test.ts (TC-P-001-01) | +3: add row doesn't re-render others, delete row preserves others, data change updates only affected rows |
| 2.2 | M-Perf-innerHTML | Add render mode flag for optimization | • `_renderMode` flag: 'full' \| 'partial'<br>• Full render on data set, partial on row updates<br>• Backwards compatible | None | +2: full render mode, partial render mode |
| 2.3 | M-Lifecycle-doublerender | Remove render() from property setters | • readonly setter only sets attribute<br>• modalEdit setter only sets attribute<br>• attributeChangedCallback handles render | readonly.test.ts, modal-edit.test.ts | +2: readonly attribute change renders once, modalEdit attribute change renders once |
| 2.4 | M-Error-clone | Add warnings for clone failures | • Console.warn on structuredClone failure<br>• Console.warn on JSON clone failure<br>• Console.warn on circular reference<br>• Include debug info in warning | core-data.test.ts | +3: warning on circular ref, warning on unserializable type, warning includes stack trace |
| 2.5 | M-Error-render | Add error boundary to render() | • Try-catch around render logic<br>• Set hasError flag on error<br>• Dispatch 'rendererror' event<br>• Display fallback UI on error | None | +4: render error sets hasError, rendererror event fired, fallback UI shown, recovery after error |

**Phase 2 Deliverables:**
- [ ] Differential rendering implementation
- [ ] Refactored attribute/property setters
- [ ] Error logging and boundary handling
- [ ] 14 new tests passing
- [ ] Performance improvement measurable (benchmark)
- [ ] Documentation update in readme.technical.md

---

## Phase 3: API Design & Code Quality

**Goal:** Improve public API consistency and message localization
**Risk Level:** Low
**Dependencies:** Phase 2 (for consistent setter patterns)
**Estimated Effort:** M (8-12 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 3.1 | M-API-publicmethods | Add public row manipulation methods | • getRow(index) returns row data clone<br>• updateRow(index, data) updates and validates<br>• Public API documented | None | +4: getRow returns clone, updateRow validates, updateRow triggers events, updateRow blocked in readonly |
| 3.2 | M-Quality-i18n | Extract validation messages to constants | • Messages in MESSAGE_DEFAULTS object<br>• Accept i18nMessages property for overrides<br>• Fallback to defaults if override missing | validation.test.ts | +3: default messages used, custom messages override, missing override falls back |
| 3.3 | L-Quality-types | Define helper types to reduce casting | • UnknownRecord, DataArray types exported<br>• Reduce `as unknown as` usage by 50%<br>• No runtime behavior change | All tests | 0 (refactor only, existing tests validate) |
| 3.4 | L-API-formassociation | Research ElementInternals integration | • Document findings on form-associated custom elements<br>• Prototype formAssociated implementation<br>• Evaluate browser support | None | Not required for research phase |

**Phase 3 Deliverables:**
- [ ] Public row manipulation API
- [ ] i18n message system
- [ ] Type definition improvements
- [ ] 7 new tests passing
- [ ] API documentation in README.md
- [ ] i18n documentation in readme.technical.md

---

## Phase 4: Code Refactoring & Documentation

**Goal:** Improve maintainability and developer experience
**Risk Level:** Low
**Dependencies:** Phases 1-3 complete
**Estimated Effort:** S (8-12 hours)

### Tasks

| Task # | Issue Reference | Task Description | Acceptance Criteria | Existing Tests | New Tests Required |
|--------|-----------------|------------------|---------------------|----------------|-------------------|
| 4.1 | L-Maintain-rendersize | Extract render() into smaller methods | • renderDefaultMessage(wrapper)<br>• renderRows(wrapper)<br>• renderModal()<br>• ensureWrapper(), ensureStyles(), applyStyling()<br>• Main render() < 50 lines | All tests | 0 (refactor only, existing tests validate) |
| 4.2 | L-Quality-deadcode | Remove _onResize placeholder | • Remove _onResize method and listener<br>• Remove from connectedCallback/disconnectedCallback<br>• Add TODO if needed for future | ck-editable-array.test.ts | +1: verify resize listener not registered (if removing) |
| 4.3 | L-Docs-jsdoc | Add JSDoc to complex methods | • deepClone has JSDoc<br>• bindElementData has JSDoc<br>• validateRow has JSDoc<br>• All public methods have JSDoc | None | 0 (documentation only) |
| 4.4 | L-Docs-examples | Update examples/demo.html | • Show keyboard navigation<br>• Show i18n messages<br>• Show public API usage (getRow, updateRow) | None | 0 (demo only) |

**Phase 4 Deliverables:**
- [ ] Refactored render() method (6 extracted methods)
- [ ] JSDoc comments on 15+ methods
- [ ] Updated demo with new features
- [ ] 1 new test passing
- [ ] Code complexity reduced (measurable via linter)

---

## Risk Assessment

| Risk | Likelihood | Impact | Mitigation Strategy |
|------|------------|--------|---------------------|
| Focus trap breaks existing functionality | Medium | High | • Implement behind feature flag initially<br>• Extensive testing with screen readers<br>• Fallback to current behavior on error |
| Differential rendering introduces bugs | Medium | High | • Implement feature flag for full/partial render<br>• Compare rendered output before/after<br>• Performance tests for regression detection |
| Breaking changes to public API | Low | Medium | • Only add new methods, don't change existing<br>• Mark any deprecated methods clearly<br>• Provide migration guide |
| i18n adds complexity | Low | Medium | • Keep simple: just message overrides<br>• Default to current English messages<br>• Document clearly in README |
| Type refactoring breaks builds | Low | Low | • Run full TypeScript compilation after each change<br>• Keep type changes minimal and incremental |

---

## Test Plan

### Phase 1: Accessibility Tests

| Issue Reference | Test Type | Test Description | Test File Location |
|-----------------|-----------|------------------|-------------------|
| H-Acc-focustrap | Validation | Focus trap prevents Tab from exiting modal | accessibility.test.ts |
| H-Acc-focustrap | Edge Case | Focus trap handles last element to first element | accessibility.test.ts |
| H-Acc-focustrap | Edge Case | Focus trap with Shift+Tab (backward) | accessibility.test.ts |
| H-Acc-keyboard | Validation | Escape key cancels edit in inline mode | edit-mode.test.ts |
| H-Acc-keyboard | Validation | Escape key closes modal and cancels edit | modal-edit.test.ts |
| H-Acc-keyboard | Validation | Enter activates toggle button | edit-mode.test.ts |
| H-Acc-keyboard | Validation | Space activates save button | edit-mode.test.ts |
| H-Acc-focus | Validation | Focus returns to toggle after save in modal | modal-edit.test.ts |
| H-Acc-focus | Validation | Focus returns after cancel in modal | modal-edit.test.ts |
| H-Acc-focus | Edge Case | Focus after overlay click cancel | modal-edit.test.ts |
| H-Acc-focus | Edge Case | Focus restoration when row deleted | edit-mode.test.ts |
| H-Acc-focus | Edge Case | Focus fallback when element disabled | edit-mode.test.ts |

### Phase 2: Performance & Error Handling Tests

| Issue Reference | Test Type | Test Description | Test File Location |
|-----------------|-----------|------------------|-------------------|
| M-Perf-innerHTML | Validation | Adding row doesn't re-render existing rows | performance.test.ts |
| M-Perf-innerHTML | Validation | Deleting row preserves other row references | performance.test.ts |
| M-Perf-innerHTML | Validation | Data change updates only affected rows | performance.test.ts |
| M-Lifecycle-doublerender | Regression | Setting readonly attribute renders once | readonly.test.ts |
| M-Lifecycle-doublerender | Regression | Setting modalEdit attribute renders once | modal-edit.test.ts |
| M-Error-clone | Validation | Circular reference logs warning | core-data.test.ts |
| M-Error-clone | Validation | Unserializable type logs warning | core-data.test.ts |
| M-Error-render | Validation | Render error sets hasError flag | error-handling.test.ts (new) |
| M-Error-render | Validation | rendererror event dispatched on error | error-handling.test.ts (new) |
| M-Error-render | Edge Case | Fallback UI displayed on render error | error-handling.test.ts (new) |
| M-Error-render | Edge Case | Component recovers after error fixed | error-handling.test.ts (new) |

### Phase 3: API & Localization Tests

| Issue Reference | Test Type | Test Description | Test File Location |
|-----------------|-----------|------------------|-------------------|
| M-API-publicmethods | Validation | getRow returns clone, not reference | add-row.test.ts |
| M-API-publicmethods | Validation | updateRow validates data | validation.test.ts |
| M-API-publicmethods | Validation | updateRow dispatches datachanged event | add-row.test.ts |
| M-API-publicmethods | Edge Case | updateRow blocked in readonly mode | readonly.test.ts |
| M-Quality-i18n | Validation | Default messages used when no override | validation.test.ts |
| M-Quality-i18n | Validation | Custom messages override defaults | validation.test.ts |
| M-Quality-i18n | Edge Case | Missing override falls back to default | validation.test.ts |

### Phase 4: Refactoring Tests

| Issue Reference | Test Type | Test Description | Test File Location |
|-----------------|-----------|------------------|-------------------|
| L-Quality-deadcode | Regression | Resize listener not registered (if removed) | ck-editable-array.test.ts |

---

## Code Change Previews

### High Priority: Issue H-Acc-focustrap (Focus Trap)

**Before:**
```typescript
// Modal shown, but no focus trap
modal.classList.remove('ck-hidden');
modal.setAttribute('aria-hidden', 'false');
```

**After:**
```typescript
private setupFocusTrap(modal: HTMLElement): void {
  const focusableSelector =
    'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';

  const handleKeydown = (e: KeyboardEvent) => {
    if (e.key !== 'Tab') return;

    const focusableElements = modal.querySelectorAll(focusableSelector);
    const firstFocusable = focusableElements[0] as HTMLElement;
    const lastFocusable = focusableElements[
      focusableElements.length - 1
    ] as HTMLElement;

    if (!firstFocusable || !lastFocusable) return;

    if (e.shiftKey) {
      // Shift+Tab: wrap from first to last
      if (document.activeElement === firstFocusable) {
        lastFocusable.focus();
        e.preventDefault();
      }
    } else {
      // Tab: wrap from last to first
      if (document.activeElement === lastFocusable) {
        firstFocusable.focus();
        e.preventDefault();
      }
    }
  };

  // Store handler for cleanup
  (modal as any)._focusTrapHandler = handleKeydown;
  modal.addEventListener('keydown', handleKeydown);
}

// In render(), when showing modal:
modal.classList.remove('ck-hidden');
modal.setAttribute('aria-hidden', 'false');
this.setupFocusTrap(modal); // Add focus trap
```

**Explanation:** This implements a proper focus trap by listening for Tab/Shift+Tab and wrapping focus between the first and last focusable elements. This ensures keyboard users cannot Tab out of the modal dialog, meeting WCAG 2.1 guideline 2.4.3 (Focus Order).

---

### High Priority: Issue H-Acc-keyboard (Escape Key)

**Before:**
```typescript
// No Escape key handler
private handleWrapperClick = (e: Event): void => {
  // Only handles click events
};
```

**After:**
```typescript
private handleWrapperKeydown = (e: KeyboardEvent): void => {
  if (e.key === 'Escape') {
    const editingIndex = this.getEditingRowIndex();
    if (editingIndex !== -1) {
      this.cancelEdit(editingIndex);
      e.preventDefault();
      e.stopPropagation();
    }
  }
};

// In render(), add keyboard listener:
wrapper.addEventListener('keydown', this.handleWrapperKeydown);

// In disconnectedCallback(), clean up:
wrapper.removeEventListener('keydown', this.handleWrapperKeydown);
```

**Explanation:** Adding Escape key support allows keyboard users to quickly exit edit mode without navigating to the cancel button. This improves user experience and aligns with common modal dialog patterns (WCAG 2.1 guideline 2.1.1 - Keyboard).

---

### Medium Priority: Issue M-Perf-innerHTML (Differential Rendering)

**Before:**
```typescript
private render() {
  // ... setup code
  wrapper.innerHTML = ''; // ❌ Clears everything

  this._data.forEach((rowData, index) => {
    const rowEl = document.createElement('div');
    // ... create row from scratch
    wrapper.appendChild(rowEl);
  });
}
```

**After:**
```typescript
private _renderMode: 'full' | 'partial' = 'full';

private render() {
  // ... setup code

  if (this._renderMode === 'full') {
    wrapper.innerHTML = '';
    this.renderAllRows(wrapper);
  } else {
    this.updateExistingRows(wrapper);
  }
}

private renderAllRows(wrapper: HTMLElement): void {
  this._data.forEach((rowData, index) => {
    const rowEl = this.createRowElement(rowData, index);
    wrapper.appendChild(rowEl);
  });
}

private updateExistingRows(wrapper: HTMLElement): void {
  const existingRows = Array.from(
    wrapper.querySelectorAll('[data-row-index]')
  ) as HTMLElement[];

  // Remove rows that no longer exist in data
  existingRows.forEach(row => {
    const index = parseInt(row.getAttribute('data-row-index')!, 10);
    if (index >= this._data.length) {
      row.remove();
    }
  });

  // Update or create rows
  this._data.forEach((rowData, index) => {
    let rowEl = wrapper.querySelector(
      `[data-row-index="${index}"]`
    ) as HTMLElement | null;

    if (!rowEl) {
      // Create new row
      rowEl = this.createRowElement(rowData, index);
      wrapper.appendChild(rowEl);
    } else {
      // Update existing row (only if needed)
      this.updateRowElement(rowEl, rowData, index);
    }
  });
}

// Usage: set mode before render
set data(value: unknown[]) {
  // ... existing code
  this._renderMode = 'full';
  this.render();
}

private saveRow(index: number): void {
  // ... existing code
  this._renderMode = 'partial';
  this.render();
}
```

**Explanation:** Differential rendering avoids destroying and recreating DOM elements unnecessarily. Full render mode is used when data array changes (set data), while partial mode updates only changed rows (save, cancel, validation). This preserves element references, improves performance, and prevents issues with CSS animations and transitions.

---

### Medium Priority: Issue M-Lifecycle-doublerender (Double Render)

**Before:**
```typescript
set readonly(value: boolean) {
  this._readonly = value;
  if (value) {
    this.setAttribute('readonly', '');
  } else {
    this.removeAttribute('readonly');
  }
  this.render(); // ❌ Causes double render
}

attributeChangedCallback(attrName: string, oldValue: string, newValue: string) {
  if (oldValue !== newValue) {
    if (attrName === 'readonly') {
      this._readonly = newValue !== null;
    }
    this.render(); // Also renders
  }
}
```

**After:**
```typescript
set readonly(value: boolean) {
  if (value) {
    this.setAttribute('readonly', '');
  } else {
    this.removeAttribute('readonly');
  }
  // Don't call render() - let attributeChangedCallback handle it
}

attributeChangedCallback(attrName: string, oldValue: string, newValue: string) {
  if (oldValue !== newValue) {
    if (attrName === 'readonly') {
      this._readonly = newValue !== null;
      this.render(); // Single render
    }
    // ... other attributes
  }
}
```

**Explanation:** Setting the property should only update the attribute; the attributeChangedCallback will update the internal state and render. This follows the standard web component pattern and prevents unnecessary double renders, improving performance.

---

## Implementation Order

### Recommended Sequence

1. **Week 1: Phase 1** (Critical Accessibility)
   - Days 1-2: Implement focus trap (Task 1.1)
   - Day 3: Add Escape key handler (Task 1.2)
   - Day 4: Implement keyboard support for buttons (Task 1.3)
   - Day 5: Fix focus restoration (Tasks 1.4, 1.5)
   - All 14 new tests passing before merge

2. **Week 2: Phase 2** (Performance & Lifecycle)
   - Days 1-3: Implement differential rendering (Tasks 2.1, 2.2)
   - Day 4: Fix double render issues (Task 2.3)
   - Day 5: Add error logging and boundaries (Tasks 2.4, 2.5)
   - All 14 new tests passing, performance benchmarks improved

3. **Week 3: Phase 3** (API & Quality)
   - Days 1-2: Add public API methods (Task 3.1)
   - Days 3-4: Implement i18n messages (Task 3.2)
   - Day 5: Type refactoring and ElementInternals research (Tasks 3.3, 3.4)
   - All 7 new tests passing

4. **Week 4: Phase 4** (Refactoring & Docs)
   - Days 1-2: Refactor render() method (Task 4.1)
   - Day 3: Remove dead code (Task 4.2)
   - Days 4-5: Add JSDoc and update examples (Tasks 4.3, 4.4)
   - All tests passing, code quality metrics improved

### Parallel Work Opportunities

- **Phase 1 and Phase 2 can run in parallel** (separate developers)
  - Phase 1 touches: focus management, keyboard handlers
  - Phase 2 touches: render logic, lifecycle callbacks
  - Minimal overlap in code areas

- **Phase 3 can start while Phase 2 completes**
  - Public API methods don't depend on differential rendering
  - i18n messages are independent

---

## Success Metrics

### Phase 1 Success Criteria
- ✅ All 78 existing tests pass
- ✅ 14 new accessibility tests pass
- ✅ Manual testing with screen reader (NVDA/JAWS)
- ✅ Manual testing with keyboard-only navigation
- ✅ Focus trap works in all browsers (Chrome, Firefox, Safari, Edge)

### Phase 2 Success Criteria
- ✅ All 92 tests pass (78 + 14 from Phase 1)
- ✅ 14 new tests pass (total: 106)
- ✅ Performance benchmark: 100 row render < 100ms (down from 150ms)
- ✅ Performance benchmark: Add/delete row < 10ms
- ✅ No double renders (verified with render counter test)

### Phase 3 Success Criteria
- ✅ All 106 tests pass
- ✅ 7 new tests pass (total: 113)
- ✅ Public API documented in README.md
- ✅ i18n example in demo
- ✅ Type casting reduced by 50% (measured by grep count)

### Phase 4 Success Criteria
- ✅ All 113 tests pass
- ✅ 1 new test passes (total: 114)
- ✅ Cyclomatic complexity of render() < 10 (was ~20)
- ✅ All public methods have JSDoc
- ✅ Demo showcases all new features

---

## Migration Guide (for consuming applications)

### Breaking Changes

**None anticipated** - All changes are additive or internal refactorings.

### New Features to Adopt

1. **Keyboard Navigation** (Phase 1)
   ```html
   <!-- No code changes needed - keyboard support is automatic -->
   <!-- Escape now cancels edit mode -->
   <!-- Enter/Space now activates buttons -->
   ```

2. **i18n Messages** (Phase 3)
   ```javascript
   const element = document.querySelector('ck-editable-array');
   element.i18nMessages = {
     required: 'Campo obligatorio',
     minLength: 'Longitud mínima: {min}',
     // ... other messages
   };
   ```

3. **Public API** (Phase 3)
   ```javascript
   // Get row data
   const row = element.getRow(0);

   // Update row
   element.updateRow(0, { name: 'Updated', email: 'new@email.com' });
   ```

### Deprecations

**None** - No existing functionality will be removed or deprecated.

---

## Rollback Plan

Each phase is independently deployable. If issues arise:

1. **Phase 1 Rollback:**
   - Remove keyboard event listener
   - Remove focus trap logic
   - Revert to commit before Phase 1
   - Tests will still pass (removed tests don't break existing functionality)

2. **Phase 2 Rollback:**
   - Set `_renderMode = 'full'` permanently
   - Revert property setter changes
   - Remove error boundary
   - Performance reverts to baseline (acceptable)

3. **Phase 3 Rollback:**
   - Public API methods are additive - no rollback needed
   - i18n is opt-in - default behavior unchanged

4. **Phase 4 Rollback:**
   - Refactoring is internal - behavior unchanged
   - Can revert without user impact

---

## Appendix: Related Specifications

- **WCAG 2.1 Guidelines:**
  - 2.1.1 Keyboard (Level A) - All functionality available via keyboard
  - 2.1.2 No Keyboard Trap (Level A) - Focus can move away from component
  - 2.4.3 Focus Order (Level A) - Focus order preserves meaning
  - 2.4.7 Focus Visible (Level AA) - Keyboard focus indicator visible

- **ARIA Authoring Practices:**
  - Dialog (Modal) Pattern: https://www.w3.org/WAI/ARIA/apg/patterns/dialog-modal/
  - Grid Pattern (for editable array): https://www.w3.org/WAI/ARIA/apg/patterns/grid/

- **HTML Living Standard:**
  - Form-associated custom elements: https://html.spec.whatwg.org/multipage/custom-elements.html#form-associated-custom-elements

---

## Conclusion

This remediation plan addresses all 15 identified issues across 4 phases, with clear tasks, acceptance criteria, and test plans. The phased approach allows for incremental delivery and reduces risk. Phase 1 (accessibility) should be prioritized for WCAG compliance before production deployment to users who rely on keyboard or screen readers.

**Estimated Timeline:** 4 weeks (with 1-2 developers)
**Total New Tests:** 36 (114 total, up from 78)
**Total Lines Changed:** ~500-800 lines (estimated)
**Risk Level:** Low-Medium (with proper testing and feature flags)
