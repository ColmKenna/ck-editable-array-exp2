## TDD Steps Log

### 2025-12-06 - Cycle 1: FR-001 Data Property Deep Clone
- Baseline: Ran all tests; initial suite passed (8 tests).
- RED: Added failing test `TC-001-01` in `tests/ck-editable-array/core-data.test.ts` verifying that setting `data` deep clones the input array so later mutations of the source do not affect the component's data. The test failed as expected.
- GREEN: Implemented minimal `data` getter/setter on `CkEditableArray` (`src/components/ck-editable-array/ck-editable-array.ts`) to deep clone on set and return clone on get. Re-ran all tests; suite passed (9 tests).
- GREEN: Implemented minimal `data` getter/setter on `CkEditableArray` (`src/components/ck-editable-array/ck-editable-array.ts`) to deep clone on set and return clone on get. Re-ran all tests; suite passed (9 tests). Added test to confirm getter returns a clone (TC-001-02) and the suite now has 10 tests passing.
- REFACTOR: Extracted deep clone logic into a private `deepClone<T>` method to keep code clean and provide fallback behavior for circular refs.

Files changed in this cycle:
- `src/components/ck-editable-array/ck-editable-array.ts` - added `_data` backing store and `data` getter/setter with deep clone. Extracted `deepClone` helper.
- `tests/ck-editable-array/core-data.test.ts` - test `TC-001-01` added.

Notes:
- This is the first step: data immutability is implemented via deep clone on setter and getter clone to avoid external mutation.
- Next: Expand tests for data getter behavior (ensure returned value mutations don't affect internal state), form integration (`value` property) and clone performance considerations.
