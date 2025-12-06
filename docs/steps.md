## TDD Steps Log

### 2025-12-06 - Cycle 1: FR-001 Data Property Deep Clone
- Baseline: Ran all tests; initial suite passed (8 tests).
- RED: Added failing test `TC-001-01` in `tests/ck-editable-array/core-data.test.ts` verifying that setting `data` deep clones the input array so later mutations of the source do not affect the component's data. The test failed as expected.
- GREEN: Implemented minimal `data` getter/setter on `CkEditableArray` (`src/components/ck-editable-array/ck-editable-array.ts`) to deep clone on set and return clone on get. Re-ran all tests; suite passed (9 tests).
- GREEN: Implemented minimal `data` getter/setter on `CkEditableArray` (`src/components/ck-editable-array/ck-editable-array.ts`) to deep clone on set and return clone on get. Re-ran all tests; suite passed (9 tests). Added test to confirm getter returns a clone (TC-001-02) and the suite now has 10 tests passing.
- REFACTOR: Extracted deep clone logic into a private `deepClone<T>` method to keep code clean and provide fallback behavior for circular refs.

### 2025-12-06 - Cycle 2: Render, Cloning, Lifecycle, and Color Sanitization
- RED: Added failing tests covering:
	- `TC-001-03`: Fallback style presence after render and idempotent behavior.
	- `TC-002-01`: Date objects preserved by deep clone conversion.
	- `TC-003-01`: connectedCallback adds global listener and disconnectedCallback removes it.
	- `TC-005-01`: Invalid color inputs are sanitized and do not inject into styling.
- GREEN: Implemented fixes:
	- Replaced `innerHTML` usage with programmatic DOM building to avoid wiping style nodes and remove XSS injection risk.
	- Added `disconnectedCallback` to remove `window` listeners registered in `connectedCallback` for cleanup.
	- Rewrote `deepClone` to prefer `structuredClone` and added a robust manual clone fallback that preserves Date objects and guards against circular references.
	- Sanitized `color` assignment via `getSanitizedColor()` that uses the browser's CSS parsing for validation and falls back to `#333` if invalid.
- REFACTOR: Improved method naming and added `_onResize` handler stub. Kept `render()` idempotent and style-safe by reusing existing wrapper elements.

Files changed in this cycle:
- `src/components/ck-editable-array/ck-editable-array.ts` - refactor render to avoid innerHTML, add lifecycle cleanup, change deep clone logic, sanitization function.
- `tests/ck-editable-array/core-data.test.ts` - new tests for above cases.

Notes:
- These changes fix the immediately identified security and lifecycle issues from the code review. The `deepClone` implementation improves the cloning semantics and avoids transforming Dates into strings.
- Next steps: add more tests to validate deep clone for Maps, Sets (if required), and add documentation for deepClone limitations.

Files changed in this cycle:
- `src/components/ck-editable-array/ck-editable-array.ts` - added `_data` backing store and `data` getter/setter with deep clone. Extracted `deepClone` helper.
- `tests/ck-editable-array/core-data.test.ts` - test `TC-001-01` added.

Notes:
- This is the first step: data immutability is implemented via deep clone on setter and getter clone to avoid external mutation.
- Next: Expand tests for data getter behavior (ensure returned value mutations don't affect internal state), form integration (`value` property) and clone performance considerations.

### 2025-12-06 - Cycle 3: Linting, Type Safety, & Formatting
- RED: Ran `npm run lint` to surface issues - found `no-explicit-any` warnings in tests and sources, unused catch variables, and Prettier formatting errors.
- GREEN: Fixed lint issues by:
	- Replacing `any` with `unknown` where appropriate in code and tests.
	- Adding typed helper getters in tests to avoid `any` usage.
	- Removed unused catch parameters and used bare `catch {}` blocks.
	- Used `npx eslint --fix` to correct Prettier-related formatting issues and made manual formatting adjustments.
	- Resolved TypeScript type errors in the `deepClone` logic by casting where necessary.
- REFACTOR: Improved type safety and code clarity in `deepClone`, and updated tests to be more explicit about data shapes.

Files changed in this cycle:
- `src/components/ck-editable-array/ck-editable-array.ts` - improved typing in `deepClone`, added safe structuredClone usage, sanitized color method, and lifecycle cleanup.
- `tests/ck-editable-array/core-data.test.ts` - introduced typed helper getters and removed `any` usage.

Notes:
- Lint now passes and all tests pass (`npm test`). The repository adheres to the lint and formatting rules.
