# Technical Notes - CkEditableArray

## Data Property Implementation (FR-001)

- `data` property is now implemented on the `CkEditableArray` custom element.
- Behavior:
  - Setting the `data` property deep clones the input array to preserve immutability of external data sources using JSON cloning.
  - A fallback shallow copy is applied if deep cloning fails (e.g., circular references).
  - Getting the `data` property returns a cloned value (so consumers cannot mutate internal state via the returned reference).
  - Non-array values assigned to `data` are treated as an empty array.

## Rationale
- Deep cloning ensures external changes to the source object do not affect component internal state, which simplifies predictable rendering and state management.
- This is a minimal clone implementation using JSON methods for structured data; a later refactor can replace it with a robust deep clone utility to support functions, dates, Maps, etc.

## Notes / Future Improvements
- Consider using a deep cloning library or structured cloning algorithm for better performance and broader type support.
- Consider adding a `dataImmutable` property to toggle cloning behavior for advanced use cases.
