import {
  ckEditableArraySheet,
  ckEditableArrayCSS,
} from './ck-editable-array.styles';

type RowState = {
  editing: boolean;
  snapshot?: Record<string, unknown>;
};

// Forbidden property names to prevent prototype pollution
const FORBIDDEN_PATHS = new Set([
  '__proto__',
  'constructor',
  'prototype',
  '__defineGetter__',
  '__defineSetter__',
  '__lookupGetter__',
  '__lookupSetter__',
]);

export class CkEditableArray extends HTMLElement {
  // FR-025a: Form Association
  static get formAssociated() {
    return true;
  }

  private shadow: ShadowRoot;
  private _internals: ElementInternals;
  private _data: Record<string, unknown>[] = [];
  private _rowStates: Map<number, RowState> = new Map();
  private _readonly = false;
  private _modalEdit = false;
  private _editingRowIndex = -1;
  private _lastFocusedToggleButton: HTMLElement | null = null;
  private _modalElement: HTMLElement | null = null;
  // Cached template references
  private _displayTemplate: HTMLTemplateElement | null = null;
  private _editTemplate: HTMLTemplateElement | null = null;
  private _templatesInitialized = false;
  private _templateErrorDispatched = false;
  // Cache for validated colors to avoid repeated DOM element creation
  private _colorCache: Map<string, string> = new Map();
  // Debounce timeout for validation
  private _validationTimeout: ReturnType<typeof setTimeout> | null = null;
  // RAF throttling for input validation (Phase 3.3)
  private _validationRafId: number | null = null;
  private _pendingValidationIndices: Set<number> = new Set();
  // Modal focus trap handler
  private handleModalKeydown = (e: KeyboardEvent): void => {
    this.handleModalFocusTrap(e);
  };

  // Undo/Redo history (FR-010, FR-011, FR-012, FR-013)
  private _history: Record<string, unknown>[][] = [];
  private _redoStack: Record<string, unknown>[][] = [];
  private _maxHistorySize = 50;
  private _skipHistoryPush = false;

  // Selection state (FR-017)
  private _selectedIndices: number[] = [];

  // Factory function for creating new items (FR-002)
  private _newItemFactory: () => Record<string, unknown> = () => ({});

  // i18n configuration (FR-021)
  private _i18n: Record<string, string> = {};

  // Error handling (FR-029, FR-030)
  private _hasError = false;
  private _lastError: Error | null = null;
  private _debug = false;

  // Performance: Maximum number of rows to render (optional limit)
  private _maxRowsLimit: number | null = null;

  // Validation schema for form validation (FR-018)
  private _validationSchema: Record<
    string,
    {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number; // for numeric validation
      max?: number; // for numeric validation
      email?: boolean; // simple email validation
      url?: boolean; // simple URL validation
      pattern?: RegExp;
      custom?: (value: unknown, row: Record<string, unknown>) => boolean;
      async?: (value: unknown, row: Record<string, unknown>) => Promise<boolean>; // async validator
    }
  > = {};

  /**
   * Gets or sets the factory function for creating new items.
   * @example
   * element.newItemFactory = () => ({ name: '', email: '' });
   */
  get newItemFactory(): () => Record<string, unknown> {
    return this._newItemFactory;
  }

  set newItemFactory(factory: () => Record<string, unknown>) {
    this._newItemFactory = factory;
  }

  /**
   * Gets or sets the validation schema for form validation.
   * Supports required, minLength, maxLength, min, max, email, url, pattern, custom, and async validators.
   * @example
   * element.validationSchema = {
   *   email: { email: true, required: true },
   *   age: { min: 18, max: 120 },
   *   website: { url: true },
   *   custom: (value) => value !== 'forbidden'
   * };
   */
  get validationSchema(): Record<
    string,
    {
      required?: boolean;
      minLength?: number;
      maxLength?: number;
      min?: number;
      max?: number;
      email?: boolean;
      url?: boolean;
      pattern?: RegExp;
      custom?: (value: unknown, row: Record<string, unknown>) => boolean;
      async?: (value: unknown, row: Record<string, unknown>) => Promise<boolean>;
    }
  > {
    return this._validationSchema;
  }

  set validationSchema(
    schema: Record<
      string,
      {
        required?: boolean;
        minLength?: number;
        maxLength?: number;
        min?: number;
        max?: number;
        email?: boolean;
        url?: boolean;
        pattern?: RegExp;
        custom?: (value: unknown, row: Record<string, unknown>) => boolean;
        async?: (value: unknown, row: Record<string, unknown>) => Promise<boolean>;
      }
    >
  ) {
    this._validationSchema = schema;
  }

  /**
   * Gets or sets internationalization messages for validation errors.
   * @example
   * element.i18n = {
   *   required: 'Ce champ est obligatoire',
   *   minLength: 'Longueur minimale {min}',
   *   email: 'Adresse email invalide'
   * };
   */
  get i18n(): Record<string, string> {
    return this._i18n;
  }

  set i18n(value: Record<string, string>) {
    this._i18n = value;
  }

  /**
   * Gets the maximum number of rows allowed. Null means unlimited.
   */
  get maxRowsLimit(): number | null {
    return this._maxRowsLimit;
  }

  /**
   * Sets the maximum number of rows allowed. Null means unlimited.
   * When set, data exceeding this limit will trigger a rowlimitexceeded event.
   */
  set maxRowsLimit(value: number | null) {
    if (value !== null && (typeof value !== 'number' || value < 1)) {
      console.warn('[ck-editable-array] maxRowsLimit must be a positive number or null');
      return;
    }
    this._maxRowsLimit = value;
  }

  /**
   * Gets the error state of the component.
   * @returns {boolean} True if an error occurred, false otherwise
   */
  get hasError(): boolean {
    return this._hasError;
  }

  /**
   * Gets the last error that occurred in the component.
   * @returns {Error | null} The last error object or null if no error
   */
  get lastError(): Error | null {
    return this._lastError;
  }

  /**
   * Gets or sets debug mode for logging.
   * @example
   * element.debug = true; // Enable debug logging
   */
  get debug(): boolean {
    return this._debug;
  }

  set debug(value: boolean) {
    this._debug = value;
  }

  /**
   * Clears the current error state.
   * @example
   * element.clearError();
   */
  clearError(): void {
    this._hasError = false;
    this._lastError = null;
  }

  // FR-029: Handle rendering errors
  private handleRenderError(error: Error, context: string): void {
    this._hasError = true;
    this._lastError = error;

    // Log to console if debug mode enabled
    if (this._debug) {
      console.error(`[ck-editable-array] Rendering error in ${context}:`, error);
    }

    // Dispatch rendererror event
    this.dispatchEvent(
      new CustomEvent('rendererror', {
        detail: { error, context },
        bubbles: true,
        composed: true
      })
    );
  }

  /**
   * Gets whether undo is available.
   * @returns {boolean} True if there is a previous state to undo to
   */
  get canUndo(): boolean {
    return this._history.length > 0;
  }

  /**
   * Gets whether redo is available.
   * @returns {boolean} True if there is a next state to redo to
   */
  get canRedo(): boolean {
    return this._redoStack.length > 0;
  }

  /**
   * Gets or sets the maximum history size for undo/redo.
   * @example
   * element.maxHistorySize = 50; // Keep 50 undo steps
   */
  get maxHistorySize(): number {
    return this._maxHistorySize;
  }

  set maxHistorySize(value: number) {
    this._maxHistorySize = Math.max(1, value);
    // Trim history if needed
    while (this._history.length > this._maxHistorySize) {
      this._history.shift();
    }
  }

  /**
   * Undoes the last change.
   * @example
   * element.undo();
   */
  undo(): void {
    if (this._readonly || !this.canUndo) return;

    // Push current state to redo stack
    this._redoStack.push(this.deepClone(this._data));

    // Pop previous state from history
    const previousState = this._history.pop()!;

    // Restore state without pushing to history
    this._skipHistoryPush = true;
    this._data = this.deepClone(previousState);
    this._skipHistoryPush = false;

    // Dispatch events
    this.dispatchEvent(
      new CustomEvent('undo', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    this.render();
  }

  /**
   * Redoes the last undo action.
   * @example
   * element.redo();
   */
  redo(): void {
    if (this._readonly || !this.canRedo) return;

    // Push current state to history
    this._history.push(this.deepClone(this._data));

    // Pop next state from redo stack
    const nextState = this._redoStack.pop()!;

    // Restore state without pushing to history
    this._skipHistoryPush = true;
    this._data = this.deepClone(nextState);
    this._skipHistoryPush = false;

    // Dispatch events
    this.dispatchEvent(
      new CustomEvent('redo', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    this.render();
  }

  /**
   * Clears all undo and redo history.
   * @example
   * element.clearHistory();
   */
  clearHistory(): void {
    this._history = [];
    this._redoStack = [];
  }

  /**
   * Moves a row up by one position (swaps with row above).
   * @param {number} index - The index of the row to move
   * @example
   * element.moveUp(2); // Move row at index 2 to index 1
   */
  moveUp(index: number): void {
    // Block if readonly or editing
    if (this._readonly || this.getEditingRowIndex() !== -1) return;
    // Can't move first row up
    if (index <= 0 || index >= this._data.length) return;

    // Swap with row above
    const temp = this._data[index - 1];
    this._data[index - 1] = this._data[index];
    this._data[index] = temp;

    // Dispatch reorder event
    this.dispatchEvent(
      new CustomEvent('reorder', {
        bubbles: true,
        detail: {
          fromIndex: index,
          toIndex: index - 1,
          data: this.deepClone(this._data),
        },
      })
    );

    // Dispatch datachanged event
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    this.render();
  }

  /**
   * Moves a row down by one position (swaps with row below).
   * @param {number} index - The index of the row to move
   * @example
   * element.moveDown(1); // Move row at index 1 to index 2
   */
  moveDown(index: number): void {
    // Block if readonly or editing
    if (this._readonly || this.getEditingRowIndex() !== -1) return;
    // Can't move last row down
    if (index < 0 || index >= this._data.length - 1) return;

    // Swap with row below
    const temp = this._data[index + 1];
    this._data[index + 1] = this._data[index];
    this._data[index] = temp;

    // Dispatch reorder event
    this.dispatchEvent(
      new CustomEvent('reorder', {
        bubbles: true,
        detail: {
          fromIndex: index,
          toIndex: index + 1,
          data: this.deepClone(this._data),
        },
      })
    );

    // Dispatch datachanged event
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    this.render();
  }

  // FR-016: Move row to specific position
  /**
   * Moves a row from one index to another.
   * Dispatches moveerror event if indices are invalid.
   * @param fromIndex - Source index of the row to move
   * @param toIndex - Destination index for the row
   */
  moveTo(fromIndex: number, toIndex: number): void {
    // Block if readonly or editing
    if (this._readonly) {
      this.dispatchEvent(
        new CustomEvent('moveerror', {
          bubbles: true,
          composed: true,
          detail: {
            fromIndex,
            toIndex,
            reason: 'readonly',
            message: 'Cannot move rows when component is in readonly mode',
            timestamp: Date.now()
          }
        })
      );
      return;
    }
    
    if (this.getEditingRowIndex() !== -1) {
      this.dispatchEvent(
        new CustomEvent('moveerror', {
          bubbles: true,
          composed: true,
          detail: {
            fromIndex,
            toIndex,
            reason: 'editing',
            message: 'Cannot move rows while a row is being edited',
            timestamp: Date.now()
          }
        })
      );
      return;
    }
    
    // Validate fromIndex
    if (fromIndex < 0 || fromIndex >= this._data.length) {
      this.dispatchEvent(
        new CustomEvent('moveerror', {
          bubbles: true,
          composed: true,
          detail: {
            fromIndex,
            toIndex,
            reason: 'invalid_from_index',
            message: `Invalid fromIndex: ${fromIndex}. Must be between 0 and ${this._data.length - 1}`,
            timestamp: Date.now()
          }
        })
      );
      
      if (this._debug) {
        console.warn(
          `[ck-editable-array] moveTo: Invalid fromIndex ${fromIndex}. ` +
          `Must be between 0 and ${this._data.length - 1}`
        );
      }
      
      return;
    }

    // Clamp toIndex to valid range
    const clampedToIndex = Math.max(
      0,
      Math.min(toIndex, this._data.length - 1)
    );

    // Warn if toIndex was clamped
    if (toIndex !== clampedToIndex) {
      this.dispatchEvent(
        new CustomEvent('moveerror', {
          bubbles: true,
          composed: true,
          detail: {
            fromIndex,
            toIndex,
            clampedToIndex,
            reason: 'invalid_to_index',
            message: `Invalid toIndex: ${toIndex}. Clamped to ${clampedToIndex}`,
            timestamp: Date.now()
          }
        })
      );
      
      if (this._debug) {
        console.warn(
          `[ck-editable-array] moveTo: Invalid toIndex ${toIndex}. ` +
          `Clamped to ${clampedToIndex}`
        );
      }
    }

    // No-op if moving to same position
    if (fromIndex === clampedToIndex) return;

    // Remove the item and insert at new position
    const [item] = this._data.splice(fromIndex, 1);
    this._data.splice(clampedToIndex, 0, item);

    // Dispatch reorder event
    this.dispatchEvent(
      new CustomEvent('reorder', {
        bubbles: true,
        detail: {
          fromIndex,
          toIndex: clampedToIndex,
          data: this.deepClone(this._data),
        },
      })
    );

    // Dispatch datachanged event
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    this.render();
  }

  /**
   * Deep clone a value with safeguards against circular references, 
   * excessive depth, and too many properties.
   * @param value - The value to clone
   * @returns A deep clone of the value
   */
  private deepClone<T>(value: T): T {
    // Configuration for clone limits
    const MAX_DEPTH = 50; // Prevent stack overflow
    const MAX_PROPERTIES = 10000; // Prevent DoS from objects with millions of properties
    
    // Use structuredClone when available for broader type support
    try {
      const structuredCloneFn = (
        globalThis as unknown as {
          structuredClone?: (v: unknown) => unknown;
        }
      ).structuredClone;
      if (typeof structuredCloneFn === 'function') {
        return structuredCloneFn(value as unknown) as T;
      }
    } catch (err) {
      // structuredClone may throw for unserializable types or circular refs
      if (this._debug) {
        console.warn('[ck-editable-array] structuredClone failed, using fallback:', err);
      }
    }

    // Try a manual deep clone with limits
    const seen = new Map<unknown, unknown>();
    let propertyCount = 0;

    const clone = (v: unknown, depth: number): unknown => {
      // Check depth limit
      if (depth > MAX_DEPTH) {
        if (this._debug) {
          console.warn(`[ck-editable-array] deepClone depth limit (${MAX_DEPTH}) exceeded. Returning shallow copy.`);
        }
        throw new Error('Max clone depth exceeded');
      }
      
      // Check property count limit
      if (propertyCount > MAX_PROPERTIES) {
        if (this._debug) {
          console.warn(`[ck-editable-array] deepClone property limit (${MAX_PROPERTIES}) exceeded. Returning shallow copy.`);
        }
        throw new Error('Max property count exceeded');
      }

      if (v === null || typeof v !== 'object') return v;
      if (v instanceof Date) return new Date(v.getTime());
      
      // Check for circular references
      if (seen.has(v)) {
        if (this._debug) {
          console.warn('[ck-editable-array] Circular reference detected in deepClone');
        }
        return seen.get(v);
      }
      
      if (Array.isArray(v)) {
        const arrCopy: unknown[] = [];
        seen.set(v, arrCopy);
        propertyCount += v.length;
        for (const item of v) {
          arrCopy.push(clone(item, depth + 1));
        }
        return arrCopy;
      }
      
      const objCopy: Record<string, unknown> = {};
      seen.set(v, objCopy);
      const objKeys = Object.keys(v as Record<string, unknown>);
      propertyCount += objKeys.length;
      
      for (const key of objKeys) {
        objCopy[key] = clone((v as Record<string, unknown>)[key], depth + 1);
      }
      return objCopy;
    };

    try {
      return clone(value, 0) as unknown as T;
    } catch (err) {
      // If manual clone fails, fallback to shallow copy
      if (this._debug) {
        console.warn('[ck-editable-array] deepClone failed, returning shallow copy:', err);
      }
      
      // Return shallow copy based on type
      if (Array.isArray(value)) {
        return [...(value as unknown[])] as unknown as T;
      }
      if (typeof value === 'object' && value !== null) {
        return { ...(value as Record<string, unknown>) } as T;
      }
      return value;
    }
  }

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });
    this._internals = this.attachInternals();

    const adopted = (
      this.shadow as unknown as ShadowRoot & {
        adoptedStyleSheets?: CSSStyleSheet[];
      }
    ).adoptedStyleSheets;
    if (ckEditableArraySheet && adopted !== undefined) {
      (
        this.shadow as unknown as ShadowRoot & {
          adoptedStyleSheets: CSSStyleSheet[];
        }
      ).adoptedStyleSheets = [...adopted, ckEditableArraySheet];
    }
  }

  connectedCallback() {
    // Ensure rendering
    this.render();
  }

  disconnectedCallback() {
    // Cleanup listeners to avoid memory leaks

    // Clean up modal element and reset state
    if (this._modalElement) {
      this._modalElement.remove();
      this._modalElement = null;
    }
    this._editingRowIndex = -1;
    this._lastFocusedToggleButton = null;

    // Clear any pending validation timeout
    if (this._validationTimeout) {
      clearTimeout(this._validationTimeout);
      this._validationTimeout = null;
    }

    // Clear any pending RAF validation request
    if (this._validationRafId !== null) {
      cancelAnimationFrame(this._validationRafId);
      this._validationRafId = null;
    }

    // Clear pending validation indices
    this._pendingValidationIndices.clear();

    // Clear history to prevent memory leaks
    this._history = [];
    this._redoStack = [];
  }

  static get observedAttributes() {
    return ['name', 'color', 'readonly', 'modal-edit'];
  }

  get readonly(): boolean {
    return this._readonly;
  }

  set readonly(value: boolean) {
    this._readonly = value;
    if (value) {
      this.setAttribute('readonly', '');
    } else {
      this.removeAttribute('readonly');
    }
    this.render();
  }

  get modalEdit(): boolean {
    return this._modalEdit;
  }

  set modalEdit(value: boolean) {
    this._modalEdit = value;
    if (value) {
      this.setAttribute('modal-edit', '');
    } else {
      this.removeAttribute('modal-edit');
    }
    this.render();
  }

  attributeChangedCallback(
    attrName: string,
    oldValue: string,
    newValue: string
  ) {
    if (oldValue !== newValue) {
      if (attrName === 'readonly') {
        this._readonly = newValue !== null;
      }
      if (attrName === 'modal-edit') {
        this._modalEdit = newValue !== null;
      }
      this.render();
    }
  }

  /**
   * Gets or sets the component name attribute.
   */
  get name() {
    return this.getAttribute('name') || 'World';
  }

  set name(value: string) {
    this.setAttribute('name', value);
  }

  /**
   * Gets or sets the color attribute for styling.
   */
  get color() {
    return this.getAttribute('color') || '#333';
  }

  set color(value: string) {
    this.setAttribute('color', value);
  }

  /**
   * Gets or sets the data array. Returns a deep clone to maintain immutability.
   * Dispatches datachanged event and automatically manages undo/redo history.
   * If maxRowsLimit is set and exceeded, data will be truncated with rowlimitexceeded event.
   * @example
   * element.data = [{ name: 'John', email: 'john@example.com' }];
   * const rows = element.data; // Returns a clone, not the original
   */
  get data(): Record<string, unknown>[] {
    return this.deepClone(this._data);
  }

  set data(value: unknown[]) {
    if (!Array.isArray(value)) {
      this._data = [];
      this.dispatchEvent(
        new CustomEvent('datachanged', {
          bubbles: true,
          detail: { data: this.deepClone(this._data) },
        })
      );
      return;
    }

    // Check if row limit is exceeded
    if (this._maxRowsLimit !== null && value.length > this._maxRowsLimit) {
      // Dispatch warning event
      this.dispatchEvent(
        new CustomEvent('rowlimitexceeded', {
          bubbles: true,
          composed: true,
          detail: {
            limit: this._maxRowsLimit,
            attempted: value.length,
            message: `Row limit of ${this._maxRowsLimit} exceeded. Received ${value.length} rows.`,
            timestamp: Date.now()
          }
        })
      );
      
      // Log warning in debug mode
      if (this._debug) {
        console.warn(
          `[ck-editable-array] Row limit of ${this._maxRowsLimit} exceeded. ` +
          `Received ${value.length} rows. Data will be truncated.`
        );
      }
      
      // Truncate to limit
      value = value.slice(0, this._maxRowsLimit);
    }

    // Push current state to history (FR-010, FR-012)
    if (!this._skipHistoryPush && this._data.length > 0) {
      this._history.push(this.deepClone(this._data));
      // Clear redo stack on new change
      this._redoStack = [];
      // Trim history if exceeds max size
      while (this._history.length > this._maxHistorySize) {
        this._history.shift();
      }
    }

    this._data = this.deepClone(value) as Record<string, unknown>[];
    // Dispatch datachanged event with cloned data
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );
    this.updateInternalsValidity();
    // Re-render as data changed
    this.render();
  }

  // Validate path parts to prevent prototype pollution
  private isValidPath(parts: string[]): boolean {
    return !parts.some(part => FORBIDDEN_PATHS.has(part));
  }

  // Helper to get a nested value from an object using dot notation
  private getNestedValue(obj: Record<string, unknown>, path: string): unknown {
    const parts = path.split('.');
    // Security: prevent prototype pollution attacks
    if (!this.isValidPath(parts)) return undefined;

    let current: unknown = obj;
    for (const part of parts) {
      if (current === null || current === undefined) return undefined;
      current = (current as Record<string, unknown>)[part];
    }
    return current;
  }

  // Helper to set a nested value on an object using dot notation
  private setNestedValue(
    obj: Record<string, unknown>,
    path: string,
    value: unknown
  ): void {
    const parts = path.split('.');
    // Security: prevent prototype pollution attacks
    if (!this.isValidPath(parts)) return;

    let current: Record<string, unknown> = obj;
    for (let i = 0; i < parts.length - 1; i++) {
      const part = parts[i];
      if (!(part in current) || typeof current[part] !== 'object') {
        current[part] = {};
      }
      current = current[part] as Record<string, unknown>;
    }
    current[parts[parts.length - 1]] = value;
  }

  // Format a value for display
  private formatValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    if (Array.isArray(value)) return value.join(', ');
    return String(value);
  }

  // Get the currently editing row index (-1 if none)
  private getEditingRowIndex(): number {
    return this._editingRowIndex;
  }

  /**
   * Gets the indices of all selected rows.
   * @returns {number[]} Array of selected row indices
   * @example
   * const selected = element.selectedIndices; // [0, 2, 5]
   */
  get selectedIndices(): number[] {
    return [...this._selectedIndices];
  }

  /**
   * Checks if a row is selected.
   * @param {number} index - The row index to check
   * @returns {boolean} True if the row is selected
   * @example
   * if (element.isSelected(2)) { ... }
   */
  isSelected(index: number): boolean {
    return this._selectedIndices.includes(index);
  }

  /**
   * Selects a row.
   * @param {number} index - The row index to select
   * @example
   * element.select(2);
   */
  select(index: number): void {
    if (index < 0 || index >= this._data.length) return;
    if (this.isSelected(index)) return;

    this._selectedIndices.push(index);
    // Sort indices for consistency
    this._selectedIndices.sort((a, b) => a - b);

    this.dispatchSelectionChanged();
    this.updateRowSelectionState(index);
  }

  /**
   * Deselects a row.
   * @param {number} index - The row index to deselect
   * @example
   * element.deselect(2);
   */
  deselect(index: number): void {
    const pos = this._selectedIndices.indexOf(index);
    if (pos === -1) return;

    this._selectedIndices.splice(pos, 1);
    this.dispatchSelectionChanged();
    this.updateRowSelectionState(index);
  }

  /**
   * Toggles the selection state of a row.
   * @param {number} index - The row index to toggle
   * @example
   * element.toggleSelection(2);
   */
  toggleSelection(index: number): void {
    if (this.isSelected(index)) {
      this.deselect(index);
    } else {
      this.select(index);
    }
  }

  /**
   * Selects all rows.
   * @example
   * element.selectAll();
   */
  selectAll(): void {
    this._selectedIndices = this._data.map((_, i) => i);
    this.dispatchSelectionChanged();
    this.render();
  }

  /**
   * Clears the selection (deselects all rows).
   * @example
   * element.clearSelection();
   */
  clearSelection(): void {
    if (this._selectedIndices.length === 0) return;
    this._selectedIndices = [];
    this.dispatchSelectionChanged();
    this.render();
  }

  /**
   * Alias for clearSelection().
   * @example
   * element.deselectAll();
   */
  deselectAll(): void {
    this.clearSelection();
  }

  /**
   * Deletes all selected rows (soft delete).
   * Dispatches datachanged event after deletion.
   * @example
   * element.deleteSelected();
   */
  deleteSelected(): void {
    if (this._readonly) return;

    // Soft delete all selected rows that aren't being edited
    let changed = false;
    for (const index of this._selectedIndices) {
      // Skip if editing
      const state = this._rowStates.get(index);
      if (state?.editing) continue;

      const row = this._data[index];
      if (row && !row.deleted) {
        row.deleted = true;
        changed = true;
      }
    }

    if (changed) {
      this.dispatchEvent(
        new CustomEvent('datachanged', {
          bubbles: true,
          detail: { data: this.deepClone(this._data) },
        })
      );
    }

    // Clear selection after delete
    this.clearSelection();
  }

  /**
   * Marks selected rows as deleted.
   * Alias for deleteSelected().
   * @example
   * element.markSelectedDeleted();
   */
  markSelectedDeleted(): void {
    this.deleteSelected();
  }

  /**
   * Bulk updates all selected rows with the provided values.
   * @param {Partial<Record<string, unknown>>} updates - Object with properties to update
   * @example
   * element.bulkUpdate({ status: 'active', reviewed: true });
   */
  bulkUpdate(updates: Partial<Record<string, unknown>>): void {
    if (this._readonly) return;

    let changed = false;
    for (const index of this._selectedIndices) {
      const row = this._data[index];
      if (row) {
        Object.assign(row, updates);
        changed = true;
      }
    }

    if (changed) {
      this.dispatchEvent(
        new CustomEvent('datachanged', {
          bubbles: true,
          detail: { data: this.deepClone(this._data) },
        })
      );
      this.render();
    }
  }

  /**
   * Gets the data for all selected rows.
   * Returns a deep clone to maintain immutability.
   * @returns {Record<string, unknown>[]} Array of selected row data
   * @example
   * const selected = element.getSelectedData();
   */
  getSelectedData(): Record<string, unknown>[] {
    return this._selectedIndices.map(i => this.deepClone(this._data[i]));
  }

  private dispatchSelectionChanged(): void {
    this.dispatchEvent(
      new CustomEvent('selectionchanged', {
        bubbles: true,
        detail: { selectedIndices: [...this._selectedIndices] },
      })
    );
  }

  // FR-022: Value property implementation
  get value(): string {
    return JSON.stringify(this.data);
  }

  set value(val: string) {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) {
        this.data = parsed;
      } else {
        this.data = [];
      }
    } catch {
      this.data = [];
    }
  }

  // FR-023: FormData integration
  toFormData(): FormData {
    const formData = new FormData();
    const componentName = this.getAttribute('name') || 'items';

    this._data.forEach((row, index) => {
      this.flattenObject(row, `${componentName}[${index}]`, formData);
    });

    return formData;
  }

  private flattenObject(obj: Record<string, unknown>, prefix: string, formData: FormData): void {
    for (const [key, value] of Object.entries(obj)) {
      if (key.startsWith('__')) continue;
      const fullKey = `${prefix}.${key}`;

      if (value === null || value === undefined) {
        continue;
      } else if (Array.isArray(value)) {
        formData.append(fullKey, (value as unknown[]).join(', '));
      } else if (typeof value === 'object') {
        this.flattenObject(value as Record<string, unknown>, fullKey, formData);
      } else {
        formData.append(fullKey, String(value));
      }
    }
  }

  // FR-024 & FR-025: Validity
  checkValidity(): boolean {
    if (this._internals?.checkValidity) {
      return this._internals.checkValidity();
    }
    return this.performManualValidation();
  }

  reportValidity(): boolean {
    if (this._internals?.reportValidity) {
      return this._internals.reportValidity();
    }
    return this.performManualValidation();
  }

  private performManualValidation(): boolean {
    if (Object.keys(this._validationSchema).length === 0) return true;

    // Check all rows
    for (let i = 0; i < this._data.length; i++) {
      if (!this.validateRow(i).isValid) return false;
    }
    return true;
  }

  get validity(): ValidityState {
    return this._internals.validity;
  }

  get validationMessage(): string {
    return this._internals.validationMessage;
  }

  private updateInternalsValidity(): void {
    if (!this._internals || typeof this._internals.setValidity !== 'function') return;

    if (Object.keys(this._validationSchema).length === 0) {
      this._internals.setValidity({});
      return;
    }

    const invalidRows: number[] = [];
    this._data.forEach((_, index) => {
      const { isValid } = this.validateRow(index);
      if (!isValid) invalidRows.push(index);
    });

    if (invalidRows.length > 0) {
      this._internals.setValidity(
        { customError: true },
        `Rows ${invalidRows.map(i => i + 1).join(', ')} contain errors.`
      );
    } else {
      this._internals.setValidity({});
    }
  }

  // FR-025a: Form Lifecycle Callbacks
  formResetCallback(): void {
    this.data = [];
  }

  formDisabledCallback(disabled: boolean): void {
    this.readonly = disabled;
  }

  // FR-002: Add a new row
  /**
   * Adds a new row to the table using the newItemFactory.
   * The new row is automatically put into edit mode.
   * Dispatches datachanged event.
   * @example
   * element.addRow(); // Creates new row based on newItemFactory
   */
  addRow(): void {
    // Block if readonly
    if (this._readonly) return;

    // Block if another row is currently being edited
    if (this.getEditingRowIndex() !== -1) return;

    // Create new item using factory
    const newItem = this._newItemFactory();
    // Mark as new row
    (newItem as Record<string, unknown>).__isNew = true;

    // Add to data array
    this._data.push(newItem);
    const newIndex = this._data.length - 1;

    // Enter edit mode automatically for new row
    this._rowStates.set(newIndex, {
      editing: true,
      snapshot: this.deepClone(newItem),
    });
    this._editingRowIndex = newIndex;

    // Dispatch datachanged event
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    this.render();
    this.focusFirstInput(newIndex);
  }

  /**
   * Soft deletes a row (marks it with deleted flag).
   * @param {number} index - The row index to delete
   * @example
   * element.deleteRow(2);
   */
  deleteRow(index: number): void {
    // Block if readonly
    if (this._readonly) return;

    // Block if row is currently being edited
    const state = this._rowStates.get(index);
    if (state?.editing) return;

    const row = this._data[index];
    if (!row) return;

    // Set deleted flag
    row.deleted = true;

    // Dispatch datachanged event
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    // Efficiently update just the row's classes instead of full re-render
    this.updateRowDeletedState(index, true);
  }

  // FR-007: Restore a soft-deleted row
  restoreRow(index: number): void {
    const row = this._data[index];
    if (!row) return;

    // Set deleted flag to false
    row.deleted = false;

    // Dispatch datachanged event
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );

    // Efficiently update just the row's classes instead of full re-render
    this.updateRowDeletedState(index, false);
  }

  // Update row's deleted visual state without full re-render
  private updateRowDeletedState(index: number, isDeleted: boolean): void {
    const wrapper = this.shadow.querySelector('.ck-editable-array');
    if (!wrapper) return;

    const rowEl = wrapper.querySelector(
      `[data-row-index="${index}"]`
    ) as HTMLElement;
    if (!rowEl) return;

    if (isDeleted) {
      rowEl.classList.add('ck-deleted');
    } else {
      rowEl.classList.remove('ck-deleted');
    }
  }

  // Update row's selection state without full re-render
  private updateRowSelectionState(index: number): void {
    const wrapper = this.shadow.querySelector('.ck-editable-array');
    if (!wrapper) return;

    const rowEl = wrapper.querySelector(
      `[data-row-index="${index}"]`
    ) as HTMLElement;
    if (!rowEl) return;

    if (this.isSelected(index)) {
      rowEl.setAttribute('data-selected', 'true');
      rowEl.setAttribute('aria-selected', 'true');
    } else {
      rowEl.removeAttribute('data-selected');
      rowEl.removeAttribute('aria-selected');
    }
  }

  // Validate a row against the schema
  private validateRow(index: number): {
    isValid: boolean;
    errors: Record<string, string>;
  } {
    const row = this._data[index];
    if (!row) return { isValid: false, errors: {} };

    const errors: Record<string, string> = {};

    for (const [field, rules] of Object.entries(this._validationSchema)) {
      const value = this.getNestedValue(row, field);
      const strValue = String(value ?? '');

      if (rules.required && !strValue) {
        errors[field] =
          this._i18n.required || 'This field is required';
        continue;
      }
      if (rules.minLength && strValue.length < rules.minLength) {
        errors[field] =
          (this._i18n.minLength || 'Minimum length is {min}').replace(
            '{min}',
            String(rules.minLength)
          );
        continue;
      }
      if (rules.maxLength && strValue.length > rules.maxLength) {
        errors[field] =
          (this._i18n.maxLength || 'Maximum length is {max}').replace(
            '{max}',
            String(rules.maxLength)
          );
        continue;
      }
      if (rules.min !== undefined && !isNaN(Number(value))) {
        const numValue = Number(value);
        if (numValue < rules.min) {
          errors[field] =
            (this._i18n.min || 'Minimum value is {min}').replace(
              '{min}',
              String(rules.min)
            );
          continue;
        }
      }
      if (rules.max !== undefined && !isNaN(Number(value))) {
        const numValue = Number(value);
        if (numValue > rules.max) {
          errors[field] =
            (this._i18n.max || 'Maximum value is {max}').replace(
              '{max}',
              String(rules.max)
            );
          continue;
        }
      }
      if (rules.email && strValue) {
        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(strValue)) {
          errors[field] =
            this._i18n.email || 'Invalid email address';
          continue;
        }
      }
      if (rules.url && strValue) {
        try {
          new URL(strValue);
        } catch {
          errors[field] =
            this._i18n.url || 'Invalid URL';
          continue;
        }
      }
      if (rules.pattern && !rules.pattern.test(strValue)) {
        errors[field] =
          this._i18n.pattern || 'Invalid format';
        continue;
      }
      if (rules.custom && typeof rules.custom === 'function') {
        try {
          if (!rules.custom(value, row)) {
            errors[field] = 'Invalid value';
          }
        } catch (error) {
          // Custom validator threw an exception - treat as validation failure
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors[field] = `Validation error: ${errorMessage}`;

          // Dispatch validationfailed event with details
          this.dispatchEvent(
            new CustomEvent('validationfailed', {
              bubbles: true,
              detail: {
                index,
                field,
                value,
                error: error instanceof Error ? error : new Error(String(error)),
                message: errorMessage,
              },
            })
          );

          if (this._debug) {
            console.error(
              `Custom validator error for field "${field}" in row ${index}:`,
              error
            );
          }
        }
      }
      // NOTE: Async validators are handled separately in async context
      // See validateRowAsync() for async validation support
    }

    return { isValid: Object.keys(errors).length === 0, errors };
  }

  /**
   * Async validation for fields with async validators.
   * Runs all async validators in parallel and returns combined errors.
   */
  private async validateRowAsync(index: number, syncErrors: Record<string, string>): Promise<Record<string, string>> {
    const row = this._data[index];
    if (!row) return syncErrors;

    const errors = { ...syncErrors };
    const asyncValidationPromises: Promise<{ field: string; error?: string }>[] = [];

    for (const [field, rules] of Object.entries(this._validationSchema)) {
      if (rules.async && typeof rules.async === 'function') {
        const value = this.getNestedValue(row, field);
        asyncValidationPromises.push(
          (async () => {
            try {
              const isValid = await rules.async!(value, row);
              if (!isValid) {
                return { field, error: 'Invalid value' };
              }
              return { field };
            } catch (error) {
              const errorMessage = error instanceof Error ? error.message : String(error);
              return { field, error: `Async validation error: ${errorMessage}` };
            }
          })()
        );
      }
    }

    if (asyncValidationPromises.length > 0) {
      const results = await Promise.all(asyncValidationPromises);
      results.forEach(result => {
        if (result.error) {
          errors[result.field] = result.error;
        } else {
          // Remove error if async validator passed
          delete errors[result.field];
        }
      });
    }

    return errors;
  }

  // Update validation UI state for a row
  private updateUiValidationState(index: number): void {
    let row: HTMLElement | null = null;

    // In modal mode, find the row in the modal; otherwise find in the wrapper
    if (this._modalEdit && this._modalElement) {
      row = this._modalElement.querySelector(
        `[data-row-index="${index}"]`
      ) as HTMLElement | null;
    } else {
      row = this.shadow.querySelector(
        `[data-row-index="${index}"]`
      ) as HTMLElement | null;
    }

    if (row) {
      this.updateRowValidation(row, index);
    }
  }

  // Helper to update validation UI on a specific row element
  private updateRowValidation(row: HTMLElement, index: number): void {
    const saveBtn = row.querySelector(
      '[data-action="save"]'
    ) as HTMLButtonElement | null;

    // Validate
    const { isValid, errors } = this.validateRow(index);

    // Update field validation state
    const bindElements = row.querySelectorAll('[data-bind]');
    bindElements.forEach(el => {
      const field = el.getAttribute('data-bind');
      if (!field) return;

      const errorEl = row.querySelector(`[data-field-error="${field}"]`);
      const hasError = field in errors;

      if (
        el instanceof HTMLInputElement ||
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        if (hasError) {
          el.setAttribute('aria-invalid', 'true');
          el.setAttribute('data-invalid', 'true');

          if (errorEl) {
            errorEl.textContent = errors[field];
            // Ensure error element has ID for aria-describedby
            if (!errorEl.id) {
              errorEl.id = `error-${index}-${field}`;
            }
            el.setAttribute('aria-describedby', errorEl.id);
          }
        } else {
          el.removeAttribute('aria-invalid');
          el.removeAttribute('data-invalid');
          el.removeAttribute('aria-describedby');

          if (errorEl) {
            errorEl.textContent = '';
          }
        }
      }
    });

    // Update row invalid state
    if (!isValid) {
      row.setAttribute('data-row-invalid', 'true');
    } else {
      row.removeAttribute('data-row-invalid');
    }

    // Update error count
    const errorCountEl = row.querySelector('[data-error-count]');
    if (errorCountEl) {
      errorCountEl.textContent = isValid
        ? '0'
        : String(Object.keys(errors).length);
    }

    // Update error summary
    const errorSummaryEl = row.querySelector('[data-error-summary]');
    if (errorSummaryEl) {
      if (isValid) {
        errorSummaryEl.textContent = '';
      } else {
        // Join error messages
        const summary = Object.values(errors).join('. ');
        errorSummaryEl.textContent = summary;
      }
    }

    if (saveBtn) {
      if (!isValid) {
        saveBtn.disabled = true;
        saveBtn.setAttribute('aria-disabled', 'true');
      } else {
        saveBtn.disabled = false;
        saveBtn.removeAttribute('aria-disabled');
      }
    }
  }

  // Enter edit mode for a row
  private enterEditMode(index: number): void {
    if (this._readonly) return;

    // Only one row can be in edit mode at a time
    const currentEditing = this.getEditingRowIndex();
    if (currentEditing !== -1 && currentEditing !== index) return;

    const row = this._data[index];
    if (!row) return;

    // Dispatch beforetogglemode event (cancelable)
    const beforeEvent = new CustomEvent('beforetogglemode', {
      bubbles: true,
      cancelable: true,
      detail: { index, editing: true },
    });
    this.dispatchEvent(beforeEvent);

    // If event was canceled, don't enter edit mode
    if (beforeEvent.defaultPrevented) return;

    // Store the toggle button reference for modal mode
    if (this._modalEdit) {
      const rowEl = this.shadow.querySelector(`[data-row-index="${index}"]`);
      this._lastFocusedToggleButton = rowEl?.querySelector(
        '[data-action="toggle"]'
      ) as HTMLElement | null;
    }

    this._rowStates.set(index, {
      editing: true,
      snapshot: this.deepClone(row),
    });
    this._editingRowIndex = index;
    this.render();
    // Focus first input after entering edit mode
    this.focusFirstInput(index);

    // Dispatch aftertogglemode event
    this.dispatchEvent(
      new CustomEvent('aftertogglemode', {
        bubbles: true,
        detail: { index, editing: true },
      })
    );
  }

  // Save changes to a row
  private saveRow(index: number): void {
    const state = this._rowStates.get(index);
    if (!state?.editing) return;

    // Validate before saving if schema is defined
    if (Object.keys(this._validationSchema).length > 0) {
      if (!this.validateRow(index).isValid) {
        // Validation failed - stay in edit mode
        return;
      }
    }

    // Remove __isNew marker on save
    const row = this._data[index];
    if (row && '__isNew' in row) {
      delete row.__isNew;
    }

    this._rowStates.set(index, { editing: false });
    this._editingRowIndex = -1;

    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );
    this.render();
    // Return focus to toggle button after save
    // Use a microtask to ensure DOM has updated
    queueMicrotask(() => {
      this.focusToggleButton(index);
    });
  }

  // Cancel editing and restore snapshot
  private cancelEdit(index: number): void {
    const state = this._rowStates.get(index);
    if (!state?.editing) return;

    // Dispatch beforetogglemode event (cancelable)
    const beforeEvent = new CustomEvent('beforetogglemode', {
      bubbles: true,
      cancelable: true,
      detail: { index, editing: false },
    });
    this.dispatchEvent(beforeEvent);

    // If event was canceled, stay in edit mode
    if (beforeEvent.defaultPrevented) return;

    const row = this._data[index];
    const isNewRow = row && '__isNew' in row && row.__isNew === true;

    if (isNewRow) {
      // Remove new row entirely when canceled
      this._data.splice(index, 1);
      this._rowStates.delete(index);
      // Reindex remaining row states
      this.reindexRowStates(index);
    } else {
      // Restore snapshot for existing rows
      if (state.snapshot) {
        this._data[index] = this.deepClone(state.snapshot);
      }
      this._rowStates.set(index, { editing: false });
    }

    this._editingRowIndex = -1;

    this.render();

    // Return focus to toggle button after cancel (if row still exists)
    if (!isNewRow) {
      // Use a microtask to ensure DOM has updated
      queueMicrotask(() => {
        this.focusToggleButton(index);
      });
    }

    // Dispatch aftertogglemode event
    this.dispatchEvent(
      new CustomEvent('aftertogglemode', {
        bubbles: true,
        detail: { index, editing: false },
      })
    );
  }

  // Reindex row states after removing a row
  private reindexRowStates(removedIndex: number): void {
    const newStates = new Map<number, RowState>();
    for (const [idx, state] of this._rowStates) {
      if (idx > removedIndex) {
        newStates.set(idx - 1, state);
      } else if (idx < removedIndex) {
        newStates.set(idx, state);
      }
      // Skip the removed index
    }
    this._rowStates = newStates;
  }

  // Handle action button clicks
  private handleAction(action: string, index: number): void {
    switch (action) {
      case 'toggle':
        this.enterEditMode(index);
        break;
      case 'save':
        this.saveRow(index);
        break;
      case 'cancel':
        this.cancelEdit(index);
        break;
      case 'add':
        this.addRow();
        break;
      case 'delete':
        this.deleteRow(index);
        break;
      case 'restore':
        this.restoreRow(index);
        break;
      case 'move-up':
        this.moveUp(index);
        break;
      case 'move-down':
        this.moveDown(index);
        break;
      default:
        // Unknown action - silently ignore in production
        break;
    }
  }

  // Focus the first input in the editing row
  private focusFirstInput(index: number): void {
    // In modal mode, focus input in modal (use cached reference)
    if (this._modalEdit && this._modalElement) {
      const firstInput = this._modalElement.querySelector(
        'input, textarea, select'
      ) as HTMLElement | null;
      if (firstInput) {
        firstInput.focus();
      }
      return;
    }

    // In inline mode, focus input in row
    const row = this.shadow.querySelector(`[data-row-index="${index}"]`);
    if (!row) return;

    const firstInput = row.querySelector(
      'input, textarea, select'
    ) as HTMLElement | null;
    if (firstInput) {
      firstInput.focus();
    }
  }

  // Focus the toggle button for a row
  private focusToggleButton(index: number): void {
    const row = this.shadow.querySelector(`[data-row-index="${index}"]`);
    if (!row) return;

    const toggleBtn = row.querySelector(
      '[data-action="toggle"]'
    ) as HTMLElement | null;
    if (toggleBtn) {
      toggleBtn.focus();
    }
  }

  // Cache templates from light DOM (call once on first render)
  private initTemplates(): void {
    if (this._templatesInitialized) return;
    this._displayTemplate = this.querySelector(
      'template[data-slot="display"]'
    ) as HTMLTemplateElement | null;
    this._editTemplate = this.querySelector(
      'template[data-slot="edit"]'
    ) as HTMLTemplateElement | null;
    this._templatesInitialized = true;
  }

  // Bind data to elements in a cloned template fragment
  /**
   * Sanitizes attribute values to prevent injection attacks.
   * Removes potentially dangerous characters and limits length.
   * @param value - The attribute value to sanitize
   * @returns Sanitized attribute value safe for use in HTML attributes
   */
  private sanitizeAttributeValue(value: string): string {
    if (!value) return '';
    
    // Limit length first to avoid processing huge strings
    const limited = value.substring(0, 255);
    
    // Use a single pass with character filtering for better performance
    let result = '';
    for (let i = 0; i < limited.length; i++) {
      const char = limited[i];
      // Skip dangerous characters: quotes, backslashes, angle brackets
      if (char === '\\' || char === '"' || char === "'" || char === '<' || char === '>') {
        continue;
      }
      // Replace whitespace with underscore
      if (char === ' ' || char === '\t' || char === '\n' || char === '\r') {
        result += '_';
      } else {
        result += char;
      }
    }
    
    return result;
  }

  private bindElementData(
    clone: DocumentFragment,
    rowData: Record<string, unknown>,
    index: number,
    componentName: string
  ): void {
    // Bind data to elements with data-bind attribute
    const bindElements = clone.querySelectorAll('[data-bind]');
    bindElements.forEach(el => {
      const path = el.getAttribute('data-bind');
      if (!path) return;

      const value = this.getNestedValue(rowData, path);
      const label =
        el.getAttribute('data-label') || path.split('.').pop() || path;
      
      // Sanitize values used in attributes to prevent injection
      const sanitizedComponentName = this.sanitizeAttributeValue(componentName);
      const sanitizedPath = this.sanitizeAttributeValue(path);
      const sanitizedLabel = this.sanitizeAttributeValue(label);

      if (el instanceof HTMLInputElement) {
        el.value = this.formatValue(value);
        el.name = `${sanitizedComponentName}[${index}].${sanitizedPath}`;
        el.id = `${sanitizedComponentName}_${index}_${sanitizedPath.replace(/\./g, '_')}`;

        if (!el.getAttribute('aria-label') && !el.labels?.length) {
          el.setAttribute('aria-label', sanitizedLabel);
        }

        if (this._readonly) {
          el.readOnly = true;
        }
      } else if (
        el instanceof HTMLTextAreaElement ||
        el instanceof HTMLSelectElement
      ) {
        el.value = this.formatValue(value);
        el.name = `${sanitizedComponentName}[${index}].${sanitizedPath}`;
        el.id = `${sanitizedComponentName}_${index}_${sanitizedPath.replace(/\./g, '_')}`;

        if (!el.getAttribute('aria-label')) {
          el.setAttribute('aria-label', sanitizedLabel);
        }

        if (el instanceof HTMLTextAreaElement && this._readonly) {
          el.readOnly = true;
        }
        if (el instanceof HTMLSelectElement && this._readonly) {
          el.disabled = true;
        }
      } else {
        el.textContent = this.formatValue(value);
      }
    });

    // Add ARIA labels to action buttons
    const actionButtons = clone.querySelectorAll('[data-action]');
    actionButtons.forEach(btn => {
      const action = btn.getAttribute('data-action');
      if (!action) return;

      if (!btn.getAttribute('aria-label')) {
        const actionLabel = this.getActionLabel(action, index);
        btn.setAttribute('aria-label', actionLabel);
      }
    });
  }

  // Event delegation handler for wrapper
  private handleWrapperClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (!actionBtn) return;

    const action = actionBtn.getAttribute('data-action');
    if (!action) return;

    // Handle global actions (no row context needed)
    if (action === 'add') {
      this.addRow();
      return;
    }

    // For row-specific actions, require a row context
    const row = actionBtn.closest('[data-row-index]') as HTMLElement | null;
    if (!row) return;

    const index = parseInt(row.getAttribute('data-row-index') || '-1', 10);
    if (index >= 0) {
      this.handleAction(action, index);
    }
  };

  // Event delegation handler for input changes
  /**
   * Handles input events on form fields with RAF-based batching.
   * Uses requestAnimationFrame to batch validation updates during rapid input changes.
   * Reduces excessive validation calls and improves performance.
   */
  private handleWrapperInput = (e: Event): void => {
    const target = e.target as HTMLElement;
    if (
      !(target instanceof HTMLInputElement) &&
      !(target instanceof HTMLTextAreaElement) &&
      !(target instanceof HTMLSelectElement)
    ) {
      return;
    }

    const path = target.getAttribute('data-bind');
    const row = target.closest('[data-row-index]') as HTMLElement | null;
    if (!path || !row) return;

    const index = parseInt(row.getAttribute('data-row-index') || '-1', 10);
    if (index >= 0 && this._data[index]) {
      this.setNestedValue(this._data[index], path, target.value);

      // Add to pending validation indices for RAF batching
      this._pendingValidationIndices.add(index);

      // Clear old debounce timeout
      if (this._validationTimeout) {
        clearTimeout(this._validationTimeout);
        this._validationTimeout = null;
      }

      // Clear old RAF request
      if (this._validationRafId !== null) {
        cancelAnimationFrame(this._validationRafId);
      }

      // Schedule validation update using RAF for batching
      this._validationRafId = requestAnimationFrame(() => {
        this._validationRafId = null;

        // Process all pending validations in one batch
        for (const pendingIndex of this._pendingValidationIndices) {
          this.updateUiValidationState(pendingIndex);
        }
        this._pendingValidationIndices.clear();
        this.updateInternalsValidity();
      });
    }
  };

  // Event handler for modal overlay clicks
  private handleModalClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    // Only close if clicking the overlay itself, not the content
    if (target.classList.contains('ck-modal')) {
      const editingIndex = this.getEditingRowIndex();
      if (editingIndex !== -1) {
        this.cancelEdit(editingIndex);
      }
    }
  };

  // Handle modal focus trap (WCAG 2.1 Level AA requirement)
  // Prevents focus from escaping the modal and supports Escape key
  private handleModalFocusTrap(e: KeyboardEvent): void {
    if (!this._modalEdit || !this._modalElement) return;

    // Handle Escape key to close modal
    if (e.key === 'Escape') {
      const editingIndex = this.getEditingRowIndex();
      if (editingIndex !== -1) {
        e.preventDefault();
        this.cancelEdit(editingIndex);
      }
      return;
    }

    // Handle Tab key for focus trap
    if (e.key !== 'Tab') return;

    // Get all focusable elements within the modal
    const focusableElements = Array.from(
      this._modalElement.querySelectorAll(
        'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
      )
    ).filter(el => {
      const element = el as HTMLElement;
      return element.offsetParent !== null; // Visible elements only
    }) as HTMLElement[];

    if (focusableElements.length === 0) return;

    const activeElement = this.shadowRoot?.activeElement as HTMLElement;
    const currentIndex = focusableElements.indexOf(activeElement);

    if (e.shiftKey) {
      // Shift+Tab: move focus backward
      if (currentIndex <= 0) {
        e.preventDefault();
        focusableElements[focusableElements.length - 1].focus();
      }
    } else {
      // Tab: move focus forward
      if (currentIndex >= focusableElements.length - 1) {
        e.preventDefault();
        focusableElements[0].focus();
      }
    }
  }

  // Helper: Ensure fallback styles are applied
  private ensureFallbackStyles(): void {
    if (
      !ckEditableArraySheet &&
      !this.shadow.querySelector('style[data-ck-editable-array-fallback]')
    ) {
      const style = document.createElement('style');
      style.setAttribute('data-ck-editable-array-fallback', '');
      style.textContent = ckEditableArrayCSS;
      this.shadow.appendChild(style);
    }
  }

  // Helper: Ensure and return wrapper element
  private ensureWrapper(): HTMLElement {
    let wrapper = this.shadow.querySelector(
      '.ck-editable-array'
    ) as HTMLElement | null;
    if (!wrapper) {
      wrapper = document.createElement('div');
      wrapper.className = 'ck-editable-array';
      // Add ARIA role for list semantics
      wrapper.setAttribute('role', 'list');
      wrapper.setAttribute('aria-label', 'Editable items');
      // Event delegation - single listeners on wrapper
      wrapper.addEventListener('click', this.handleWrapperClick);
      wrapper.addEventListener('input', this.handleWrapperInput);
      this.shadow.appendChild(wrapper);
    }
    return wrapper;
  }

  // Helper: Render a single row element
  private renderRow(
    rowData: Record<string, unknown>,
    index: number,
    componentName: string
  ): HTMLElement {
    const state = this._rowStates.get(index);
    const isEditing = state?.editing ?? false;
    const isDeleted = rowData.deleted === true;

    // Create row container with ARIA listitem role
    const rowEl = document.createElement('div');
    rowEl.setAttribute('data-row-index', String(index));
    rowEl.setAttribute('role', 'listitem');
    rowEl.setAttribute('aria-label', `Item ${index + 1}`);
    rowEl.className = 'ck-editable-array__row';

    // FR-017: Selection attributes
    if (this.isSelected(index)) {
      rowEl.setAttribute('data-selected', 'true');
      rowEl.setAttribute('aria-selected', 'true');
    }

    // Add ck-deleted class for soft-deleted rows
    if (isDeleted) {
      rowEl.classList.add('ck-deleted');
    }

    // Determine which template to use
    // In modal mode, always use display template for inline row
    const templateToUse =
      isEditing && this._editTemplate && !this._modalEdit
        ? this._editTemplate
        : this._displayTemplate;
    // Skip if no template (should not happen at this point, but guard for TypeScript)
    if (!templateToUse) return rowEl;
    const clone = templateToUse.content.cloneNode(true) as DocumentFragment;

    // Bind data to elements (DRY: extracted to bindElementData)
    this.bindElementData(clone, rowData, index, componentName);

    // Add toggle button if in display mode and no explicit toggle
    if (!isEditing && !clone.querySelector('[data-action="toggle"]')) {
      const toggleBtn = document.createElement('button');
      toggleBtn.setAttribute('data-action', 'toggle');
      toggleBtn.setAttribute('aria-label', `Edit item ${index + 1}`);
      toggleBtn.textContent = 'Edit';
      rowEl.appendChild(toggleBtn);
    }

    rowEl.appendChild(clone);

    // Initial validation state update
    if (isEditing && Object.keys(this._validationSchema).length > 0) {
      this.updateRowValidation(rowEl, index);
    }

    return rowEl;
  }

  // Helper: Render modal content
  private renderModal(modal: HTMLElement, editingIndex: number): void {
    const modalContent = modal.querySelector('.ck-modal__content');
    const componentName = this.getAttribute('name') || 'items';

    if (editingIndex !== -1 && modalContent && this._editTemplate) {
      // Clear modal content
      modalContent.innerHTML = '';

      // FR-029: Render hidden edit inputs for all rows (for form submission)
      // This allows forms to include all row data even if not being edited
      for (let i = 0; i < this._data.length; i++) {
        const rowData = this._data[i];
        const isEditingRow = i === editingIndex;

        // Clone edit template
        const clone = this._editTemplate.content.cloneNode(
          true
        ) as DocumentFragment;

        // Create row wrapper for modal with data-row-index
        const modalRowEl = document.createElement('div');
        modalRowEl.setAttribute('data-row-index', String(i));
        modalRowEl.className = 'ck-modal__row';

        // Hide non-editing rows with ck-hidden class
        if (!isEditingRow) {
          modalRowEl.classList.add('ck-hidden');
        }

        // Bind data to elements (DRY: extracted to bindElementData)
        this.bindElementData(clone, rowData, i, componentName);

        modalRowEl.appendChild(clone);

        // Apply validation if needed
        if (Object.keys(this._validationSchema).length > 0) {
          this.updateRowValidation(modalRowEl, i);
        }

        modalContent.appendChild(modalRowEl);
      }

      // Show modal
      modal.classList.remove('ck-hidden');
      modal.setAttribute('aria-hidden', 'false');
    } else {
      // Hide modal if no row is being edited
      modal.classList.add('ck-hidden');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  /**
   * Renders the wrapper element with proper styling and returns it.
   * Handles color customization via CSS custom properties.
   * @returns The wrapper element ready for content
   */
  private renderWrapper(): HTMLElement {
    // Ensure fallback styles are applied
    this.ensureFallbackStyles();

    // Get or create wrapper element
    const wrapper = this.ensureWrapper();

    // Apply per-instance color via CSS custom property
    const sanitizedColor = this.getSanitizedColor(this.color);
    this.style.setProperty('--ck-editable-array-color', sanitizedColor);

    // Clear wrapper content but leave other nodes (like style) intact
    wrapper.innerHTML = '';

    return wrapper;
  }

  /**
   * Renders all data rows into the provided wrapper element.
   * Handles default message display if no templates are available.
   * @param wrapper - The wrapper element to render rows into
   */
  private renderRows(wrapper: HTMLElement): void {
    // Cache templates on first render
    this.initTemplates();

    // If no templates, render default message
    if (!this._displayTemplate) {
      const sanitizedColor = this.getSanitizedColor(this.color);
      const heading = document.createElement('h1');
      heading.className = 'ck-editable-array__message';
      heading.textContent = `Hello, ${this.name}!`;
      heading.style.color = sanitizedColor;

      const subtitle = document.createElement('p');
      subtitle.className = 'ck-editable-array__subtitle';
      subtitle.textContent = 'Welcome to our Web Component Library';

      wrapper.appendChild(heading);
      wrapper.appendChild(subtitle);
      return;
    }

    // Render rows from data
    const componentName = this.getAttribute('name') || 'items';
    this._data.forEach((rowData, index) => {
      const rowEl = this.renderRow(rowData, index, componentName);
      wrapper.appendChild(rowEl);
    });
  }

  /**
   * Creates and returns the modal element for modal editing mode.
   * Caches the modal reference to avoid recreation on subsequent renders.
   * Dispatches templateerror event if modal mode is enabled without edit template.
   * @returns The modal element or null if not in modal mode
   */
  private setupModalElement(): HTMLElement | null {
    if (!this._modalEdit) {
      return null;
    }

    // Check if edit template is missing when modal mode is enabled
    if (!this._editTemplate && this._templatesInitialized && !this._templateErrorDispatched) {
      const errorMessage = 'Modal edit mode enabled but no edit template (<template data-slot="edit">) found';
      
      // Mark error as dispatched to prevent duplicates
      this._templateErrorDispatched = true;
      
      // Dispatch templateerror event
      this.dispatchEvent(
        new CustomEvent('templateerror', {
          detail: {
            message: errorMessage,
            mode: 'modal',
            timestamp: Date.now()
          },
          bubbles: true,
          composed: true
        })
      );
      
      // Log in debug mode
      if (this._debug) {
        console.warn(`[ck-editable-array] ${errorMessage}`);
      }
      
      // Return null to prevent modal creation without template
      return null;
    }
    
    // If template error was previously dispatched but template is still missing, skip modal setup
    if (!this._editTemplate && this._templateErrorDispatched) {
      return null;
    }

    // Use cached reference or query if not yet cached
    if (!this._modalElement) {
      this._modalElement = this.shadow.querySelector(
        '.ck-modal'
      ) as HTMLElement | null;
    }

    let modal = this._modalElement;

    if (!modal) {
      modal = document.createElement('div');
      modal.className = 'ck-modal ck-hidden';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      modal.setAttribute('aria-hidden', 'true');

      // Create modal content wrapper
      const modalContent = document.createElement('div');
      modalContent.className = 'ck-modal__content';
      modal.appendChild(modalContent);

      // Add event listeners only when creating modal (not on every render)
      modal.addEventListener('click', this.handleModalClick);
      modal.addEventListener('click', this.handleWrapperClick);
      modal.addEventListener('input', this.handleWrapperInput);
      modal.addEventListener('keydown', this.handleModalKeydown);

      this.shadow.appendChild(modal);

      // Cache the modal reference
      this._modalElement = modal;
    }

    return modal;
  }

  /**
   * Renders modal content if in modal editing mode.
   * @param modal - The modal element to render content into
   */
  private renderModalIfNeeded(modal: HTMLElement | null): void {
    if (this._modalEdit && modal) {
      const editingIndex = this.getEditingRowIndex();
      this.renderModal(modal, editingIndex);
    }
  }

  /**
   * Main render method orchestrating the component's UI rendering.
   * Handles wrapper, rows, and modal rendering in sequence.
   */
  private render() {
    try {
      // Guard: don't render if not connected to DOM
      if (!this.isConnected) return;

      // Render wrapper and get reference
      const wrapper = this.renderWrapper();

      // Setup modal if in modal mode
      const modal = this.setupModalElement();

      // Render all rows into wrapper
      this.renderRows(wrapper);

      // Render modal content if needed
      this.renderModalIfNeeded(modal);
    } catch (error) {
      // FR-029: Handle rendering errors
      this.handleRenderError(
        error instanceof Error ? error : new Error(String(error)),
        'render'
      );
    }
  }

  // Get accessible label for action buttons
  private getActionLabel(action: string, index: number): string {
    const itemNum = index + 1;
    switch (action) {
      case 'toggle':
        return `Edit item ${itemNum}`;
      case 'save':
        return `Save item ${itemNum}`;
      case 'cancel':
        return `Cancel editing item ${itemNum}`;
      case 'delete':
        return `Delete item ${itemNum}`;
      case 'restore':
        return `Restore item ${itemNum}`;
      case 'move-up':
        return `Move item ${itemNum} up`;
      case 'move-down':
        return `Move item ${itemNum} down`;
      default:
        return `${action} item ${itemNum}`;
    }
  }

  private getSanitizedColor(value: string) {
    if (!value) return '#333';

    // Check cache first
    if (this._colorCache.has(value)) {
      return this._colorCache.get(value)!;
    }

    // Validate and cache the color
    try {
      const el = document.createElement('div');
      el.style.color = value;
      // Browser normalizes valid colors to a non-empty string
      if (el.style.color) {
        this._colorCache.set(value, value);
        return value;
      }
    } catch {
      // ignore
    }

    // Cache the fallback color for this invalid value
    this._colorCache.set(value, '#333');
    return '#333';
  }
}

// Register the custom element
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
