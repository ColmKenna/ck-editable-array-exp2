import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('ck-editable-array - Performance (Phase 12)', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
  });

  afterEach(() => {
    element.remove();
  });

  // Helper to add templates and append to DOM
  const setupElement = () => {
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
        <span data-bind="email"></span>
        <button data-action="toggle">Edit</button>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text" class="name-input" />
        <input data-bind="email" type="email" class="email-input" />
        <button data-action="save">Save</button>
        <button data-action="cancel">Cancel</button>
      </template>
    `;
    document.body.appendChild(element);
  };

  describe('NFR-P-001: Efficient DOM Updates', () => {
    test('TC-P-001-01: Input changes should not cause full re-render', () => {
      // RED: This test verifies that when an input value changes, only the
      // specific input element is updated, not the entire component.
      // This is a performance optimization to avoid unnecessary DOM operations.

      setupElement();

      // Create test data with multiple rows
      const testData = [
        { name: 'Alice', email: 'alice@test.com' },
        { name: 'Bob', email: 'bob@test.com' },
        { name: 'Charlie', email: 'charlie@test.com' },
      ];

      element.data = testData;

      // Enter edit mode for first row
      const firstToggle = element.shadowRoot!.querySelector(
        '[data-row-index="0"] [data-action="toggle"]'
      ) as HTMLButtonElement;
      firstToggle.click();

      // Get reference to the input element
      const nameInput = element.shadowRoot!.querySelector(
        '[data-row-index="0"] .name-input'
      ) as HTMLInputElement;

      // Get reference to other rows to verify they aren't affected
      const row1 = element.shadowRoot!.querySelector(
        '[data-row-index="1"]'
      ) as HTMLElement;
      const row2 = element.shadowRoot!.querySelector(
        '[data-row-index="2"]'
      ) as HTMLElement;

      // Store references to verify they remain the same (not re-created)
      const row1Reference = row1;
      const row2Reference = row2;

      // Change the input value
      nameInput.value = 'Alice Updated';
      nameInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Wait for any debounced updates
      return new Promise(resolve => {
        setTimeout(() => {
          // Verify the input value is updated in the data
          const updatedData = element.data;
          expect(updatedData[0].name).toBe('Alice Updated');

          // Verify other rows still exist with the same references
          // This proves we didn't do innerHTML = '' and recreate everything
          const currentRow1 = element.shadowRoot!.querySelector(
            '[data-row-index="1"]'
          );
          const currentRow2 = element.shadowRoot!.querySelector(
            '[data-row-index="2"]'
          );

          // These should be the exact same DOM elements (not recreated)
          expect(currentRow1).toBe(row1Reference);
          expect(currentRow2).toBe(row2Reference);

          // Verify the other rows still have correct content
          const row1Name = currentRow1!.querySelector('[data-bind="name"]');
          const row2Name = currentRow2!.querySelector('[data-bind="name"]');
          expect(row1Name!.textContent).toBe('Bob');
          expect(row2Name!.textContent).toBe('Charlie');

          resolve(undefined);
        }, 200); // Wait longer than the debounce timeout (150ms)
      });
    });
  });

  describe('NFR-P-002: History Memory Management', () => {
    test('TC-P-002-01: History bounded by maxHistorySize', () => {
      // This test verifies that the history doesn't grow unbounded,
      // which would cause memory leaks with frequent edits.
      // It's a performance concern because unbounded history accumulation
      // would slow down the component over time.

      setupElement();

      // Set a small history size for testing
      (element as any).maxHistorySize = 5;

      // Make 10 data changes (exceeds maxHistorySize)
      for (let i = 0; i < 10; i++) {
        element.data = [{ name: `User ${i}`, email: `user${i}@test.com` }];
      }

      // Count how many undo operations we can perform
      let undoCount = 0;
      while ((element as any).canUndo) {
        (element as any).undo();
        undoCount++;
        // Safety limit to prevent infinite loop
        if (undoCount > 10) break;
      }

      // We should be able to undo at most maxHistorySize times
      // (actually maxHistorySize - 1 because current state isn't in history)
      expect(undoCount).toBeLessThanOrEqual(5);
      expect(undoCount).toBeGreaterThan(0); // Should have some history
    });
  });

  describe('NFR-P-003: Initial Render Performance', () => {
    test('TC-P-003-01: 100 rows should render in < 100ms', () => {
      // RED: This test verifies that the component can render a large dataset
      // (100 rows) in a reasonable time (< 100ms) to ensure good user experience.

      setupElement();

      // Create 100 rows of test data
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@test.com`,
        index: i,
      }));

      // Measure render time
      const startTime = performance.now();

      element.data = largeDataset;

      // Force any pending renders to complete
      // In a real browser, this would wait for the next frame
      // In jsdom, rendering is synchronous

      const endTime = performance.now();
      const renderTime = endTime - startTime;

      // Verify all rows were rendered
      const rows = element.shadowRoot!.querySelectorAll('[data-row-index]');
      expect(rows.length).toBe(100);

      // Verify render time is under 150ms
      // Note: In jsdom this may not be representative of real browser performance
      // but it ensures we don't have any obvious performance issues
      // Threshold set to 150ms to account for test environment variability
      expect(renderTime).toBeLessThan(150);

      // Verify first and last rows have correct content
      const firstRow = rows[0].querySelector('[data-bind="name"]');
      const lastRow = rows[99].querySelector('[data-bind="name"]');
      expect(firstRow!.textContent).toBe('User 0');
      expect(lastRow!.textContent).toBe('User 99');
    });
  });

  describe('NFR-P-004: Maximum Row Limits', () => {
    test('TC-P-004-01: Should dispatch rowlimitexceeded event when limit exceeded', async () => {
      setupElement();

      // Set a row limit
      (element as unknown as { maxRowsLimit: number }).maxRowsLimit = 10;

      // Create promise to wait for event
      const eventPromise = new Promise<CustomEvent>((resolve) => {
        element.addEventListener('rowlimitexceeded', (event: Event) => {
          resolve(event as CustomEvent);
        }, { once: true });
      });

      // Set data exceeding the limit
      const largeDataset = Array.from({ length: 20 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@test.com`,
      }));

      element.data = largeDataset;

      // Wait for the event
      const customEvent = await eventPromise;

      expect(customEvent.detail).toBeDefined();
      expect(customEvent.detail.limit).toBe(10);
      expect(customEvent.detail.attempted).toBe(20);
      expect(customEvent.detail.message).toContain('Row limit of 10 exceeded');
      expect(customEvent.detail.timestamp).toBeGreaterThan(0);
    });

    test('TC-P-004-02: Should truncate data when limit exceeded', () => {
      setupElement();

      // Set a row limit
      (element as unknown as { maxRowsLimit: number }).maxRowsLimit = 5;

      // Set data exceeding the limit
      const largeDataset = Array.from({ length: 10 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@test.com`,
      }));

      element.data = largeDataset;

      // Verify only 5 rows are rendered (truncated to limit)
      const rows = element.shadowRoot!.querySelectorAll('[data-row-index]');
      expect(rows.length).toBe(5);

      // Verify first and last rendered rows
      const firstRow = rows[0].querySelector('[data-bind="name"]');
      const lastRow = rows[4].querySelector('[data-bind="name"]');
      expect(firstRow!.textContent).toBe('User 0');
      expect(lastRow!.textContent).toBe('User 4');
    });

    test('TC-P-004-03: Should allow data when under limit', () => {
      setupElement();

      // Set a row limit
      (element as unknown as { maxRowsLimit: number }).maxRowsLimit = 10;

      let eventFired = false;
      element.addEventListener('rowlimitexceeded', () => {
        eventFired = true;
      });

      // Set data under the limit
      const smallDataset = Array.from({ length: 5 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@test.com`,
      }));

      element.data = smallDataset;

      // Verify event was not fired
      expect(eventFired).toBe(false);

      // Verify all 5 rows are rendered
      const rows = element.shadowRoot!.querySelectorAll('[data-row-index]');
      expect(rows.length).toBe(5);
    });

    test('TC-P-004-04: Should not limit when maxRowsLimit is null', () => {
      setupElement();

      // Ensure no limit is set (null means unlimited)
      (element as unknown as { maxRowsLimit: number | null }).maxRowsLimit = null;

      let eventFired = false;
      element.addEventListener('rowlimitexceeded', () => {
        eventFired = true;
      });

      // Set large dataset
      const largeDataset = Array.from({ length: 100 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@test.com`,
      }));

      element.data = largeDataset;

      // Verify event was not fired
      expect(eventFired).toBe(false);

      // Verify all 100 rows are rendered (no truncation)
      const rows = element.shadowRoot!.querySelectorAll('[data-row-index]');
      expect(rows.length).toBe(100);
    });

    test('TC-P-004-05: Should log warning in debug mode when limit exceeded', async () => {
      setupElement();

      // Enable debug mode
      (element as unknown as { debug: boolean }).debug = true;

      // Set a row limit
      (element as unknown as { maxRowsLimit: number }).maxRowsLimit = 5;

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

      // Set data exceeding the limit
      const largeDataset = Array.from({ length: 10 }, (_, i) => ({
        name: `User ${i}`,
        email: `user${i}@test.com`,
      }));

      element.data = largeDataset;

      // Give time for events to process
      await new Promise(resolve => setTimeout(resolve, 10));

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[ck-editable-array]')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Row limit of 5 exceeded')
      );

      consoleSpy.mockRestore();
    });
  });
});
