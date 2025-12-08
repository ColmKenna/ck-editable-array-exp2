import { CkEditableArray } from '../../src/components/ck-editable-array/ck-editable-array';

// Register component
beforeAll(() => {
  if (!customElements.get('ck-editable-array')) {
    customElements.define('ck-editable-array', CkEditableArray);
  }
});

describe('FR-029: Error Boundary', () => {
  let element: CkEditableArray;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text">
        <button data-action="save">Save</button>
      </template>
    `;
    document.body.appendChild(element);
    
    // Spy on console.error for debug logging tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    element.remove();
    consoleErrorSpy.mockRestore();
  });

  test('TC-029-01: Rendering error sets hasError=true', () => {
    // RED -> GREEN: This test verifies that when a rendering error occurs,
    // the component sets hasError to true
    
    const elementWithError = element as any;
    
    // Initially, hasError should be false
    expect(elementWithError.hasError).toBe(false);
    
    // Trigger a rendering error by breaking the render process
    // We'll mock the render method to throw an error
    const originalBindData = elementWithError.bindElementData;
    elementWithError.bindElementData = () => {
      throw new Error('Simulated rendering error');
    };
    
    // Set data to trigger a render
    element.data = [{ name: 'Test' }];
    
    // Error should have been caught and hasError should be true
    expect(elementWithError.hasError).toBe(true);
    
    // Restore original method
    elementWithError.bindElementData = originalBindData;
  });

  test('TC-029-02: lastError contains Error object', () => {
    // RED -> GREEN: Verify that lastError property contains the actual Error object
    
    const elementWithError = element as any;
    
    // Initially, lastError should be null
    expect(elementWithError.lastError).toBeNull();
    
    // Trigger a rendering error
    const originalBindData = elementWithError.bindElementData;
    const testError = new Error('Test rendering error');
    elementWithError.bindElementData = () => {
      throw testError;
    };
    
    element.data = [{ name: 'Test' }];
    
    // lastError should now contain the error
    expect(elementWithError.lastError).toBeInstanceOf(Error);
    expect(elementWithError.lastError.message).toBe('Test rendering error');
    
    // Restore original method
    elementWithError.bindElementData = originalBindData;
  });

  test('TC-029-03: rendererror event dispatched', (done) => {
    // RED -> GREEN: Verify that rendererror event is dispatched with error details
    
    const elementWithError = element as any;
    
    element.addEventListener('rendererror', ((event: CustomEvent) => {
      expect(event.detail).toBeDefined();
      expect(event.detail.error).toBeInstanceOf(Error);
      expect(event.detail.error.message).toBe('Test event error');
      expect(event.detail.context).toBe('render');
      done();
    }) as EventListener);
    
    // Trigger a rendering error
    const originalBindData = elementWithError.bindElementData;
    elementWithError.bindElementData = () => {
      throw new Error('Test event error');
    };
    
    element.data = [{ name: 'Test' }];
    
    // Restore original method
    elementWithError.bindElementData = originalBindData;
  });

  test('TC-029-04: debug=true logs to console', () => {
    // RED -> GREEN: Verify that when debug is enabled, errors are logged
    
    const elementWithError = element as any;
    elementWithError.debug = true;
    
    // Trigger a rendering error
    const originalBindData = elementWithError.bindElementData;
    elementWithError.bindElementData = () => {
      throw new Error('Debug test error');
    };
    
    element.data = [{ name: 'Test' }];
    
    // Verify console.error was called
    expect(consoleErrorSpy).toHaveBeenCalled();
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('ck-editable-array');
    expect(consoleErrorSpy.mock.calls[0][0]).toContain('error');
    expect(consoleErrorSpy.mock.calls[0][1]).toBeInstanceOf(Error);
    
    // Restore original method
    elementWithError.bindElementData = originalBindData;
  });
});

describe('FR-030: Error Recovery', () => {
  let element: CkEditableArray;

  beforeEach(() => {
    element = document.createElement('ck-editable-array') as CkEditableArray;
    element.innerHTML = `
      <template data-slot="display">
        <span data-bind="name"></span>
      </template>
      <template data-slot="edit">
        <input data-bind="name" type="text">
        <button data-action="save">Save</button>
      </template>
    `;
    document.body.appendChild(element);
  });

  afterEach(() => {
    element.remove();
  });

  test('TC-030-01: clearError() resets hasError', () => {
    // RED -> GREEN: Verify that clearError() resets the hasError flag
    
    const elementWithError = element as any;
    
    // Simulate error state by triggering an actual error
    const originalBindData = elementWithError.bindElementData;
    elementWithError.bindElementData = () => {
      throw new Error('Test error for clear');
    };
    
    element.data = [{ name: 'Test' }];
    
    expect(elementWithError.hasError).toBe(true);
    
    // Clear the error
    elementWithError.clearError();
    
    expect(elementWithError.hasError).toBe(false);
    
    // Restore original method
    elementWithError.bindElementData = originalBindData;
  });

  test('TC-030-02: clearError() resets lastError', () => {
    // RED -> GREEN: Verify that clearError() resets the lastError property
    
    const elementWithError = element as any;
    
    // Simulate error state by triggering an actual error
    const originalBindData = elementWithError.bindElementData;
    elementWithError.bindElementData = () => {
      throw new Error('Test error for clear');
    };
    
    element.data = [{ name: 'Test' }];
    
    expect(elementWithError.lastError).toBeInstanceOf(Error);
    
    // Clear the error
    elementWithError.clearError();
    
    expect(elementWithError.lastError).toBeNull();
    
    // Restore original method
    elementWithError.bindElementData = originalBindData;
  });
});
