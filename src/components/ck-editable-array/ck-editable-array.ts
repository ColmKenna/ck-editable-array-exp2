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
  private shadow: ShadowRoot;
  private _data: Record<string, unknown>[] = [];
  private _rowStates: Map<number, RowState> = new Map();
  private _readonly = false;
  // Cached template references
  private _displayTemplate: HTMLTemplateElement | null = null;
  private _editTemplate: HTMLTemplateElement | null = null;
  private _templatesInitialized = false;
  private deepClone<T>(value: T): T {
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
    } catch {
      // structuredClone may throw for unserializable types; continue to fallback
    }

    // Try a manual deep clone that supports Date and plain objects (and protects against circular refs)
    const seen = new Map<unknown, unknown>();

    const clone = (v: unknown): unknown => {
      if (v === null || typeof v !== 'object') return v;
      if (v instanceof Date) return new Date(v.getTime());
      if (seen.has(v)) return seen.get(v);
      if (Array.isArray(v)) {
        const arrCopy: unknown[] = [];
        seen.set(v, arrCopy);
        for (const item of v) arrCopy.push(clone(item));
        return arrCopy;
      }
      const objCopy: Record<string, unknown> = {};
      seen.set(v, objCopy);
      const objKeys = Object.keys(v as Record<string, unknown>);
      for (const key of objKeys) objCopy[key] = clone((v as Record<string, unknown>)[key]);
      return objCopy;
    };

    try {
      return clone(value) as unknown as T;
    } catch {
      // If manual clone fails, fallback to JSON method (with limitations)
      try {
        return JSON.parse(JSON.stringify(value));
      } catch {
        // Last resort: return a shallow copy for arrays or object spread
        if (Array.isArray(value))
          return [...(value as unknown[])] as unknown as T;
        if (typeof value === 'object' && value !== null)
          return { ...(value as Record<string, unknown>) } as T;
        return value;
      }
    }
  }

  private _onResize = () => {
    // placeholder for future resize behavior
  };

  constructor() {
    super();
    this.shadow = this.attachShadow({ mode: 'open' });

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
    // Add a global listener we can test cleanup for
    window.addEventListener('resize', this._onResize);
  }

  disconnectedCallback() {
    // Cleanup listeners to avoid memory leaks
    window.removeEventListener('resize', this._onResize);
  }

  static get observedAttributes() {
    return ['name', 'color', 'readonly'];
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

  attributeChangedCallback(
    attrName: string,
    oldValue: string,
    newValue: string
  ) {
    if (oldValue !== newValue) {
      if (attrName === 'readonly') {
        this._readonly = newValue !== null;
      }
      this.render();
    }
  }

  get name() {
    return this.getAttribute('name') || 'World';
  }

  set name(value: string) {
    this.setAttribute('name', value);
  }

  get color() {
    return this.getAttribute('color') || '#333';
  }

  set color(value: string) {
    this.setAttribute('color', value);
  }

  // Data property: deep clone on set, returns a clone on get to maintain immutability
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
    this._data = this.deepClone(value) as Record<string, unknown>[];
    // Dispatch datachanged event with cloned data
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );
    // Re-render as data changed
    this.render();
  }

  // Validate path parts to prevent prototype pollution
  private isValidPath(parts: string[]): boolean {
    return !parts.some((part) => FORBIDDEN_PATHS.has(part));
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
    for (const [index, state] of this._rowStates) {
      if (state.editing) return index;
    }
    return -1;
  }

  // Enter edit mode for a row
  private enterEditMode(index: number): void {
    if (this._readonly) return;

    // Only one row can be in edit mode at a time
    const currentEditing = this.getEditingRowIndex();
    if (currentEditing !== -1 && currentEditing !== index) return;

    const row = this._data[index];
    if (!row) return;

    this._rowStates.set(index, {
      editing: true,
      snapshot: this.deepClone(row),
    });
    this.render();
    // Focus first input after entering edit mode
    this.focusFirstInput(index);
  }

  // Save changes to a row
  private saveRow(index: number): void {
    const state = this._rowStates.get(index);
    if (!state?.editing) return;

    this._rowStates.set(index, { editing: false });
    this.dispatchEvent(
      new CustomEvent('datachanged', {
        bubbles: true,
        detail: { data: this.deepClone(this._data) },
      })
    );
    this.render();
    // Return focus to toggle button after save
    this.focusToggleButton(index);
  }

  // Cancel editing and restore snapshot
  private cancelEdit(index: number): void {
    const state = this._rowStates.get(index);
    if (!state?.editing) return;

    if (state.snapshot) {
      this._data[index] = this.deepClone(state.snapshot);
    }
    this._rowStates.set(index, { editing: false });
    this.render();
    // Return focus to toggle button after cancel
    this.focusToggleButton(index);
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
      default:
        // Unknown action - silently ignore in production
        break;
    }
  }

  // Focus the first input in the editing row
  private focusFirstInput(index: number): void {
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

  // Event delegation handler for wrapper
  private handleWrapperClick = (e: Event): void => {
    const target = e.target as HTMLElement;
    const actionBtn = target.closest('[data-action]') as HTMLElement | null;
    if (!actionBtn) return;

    const action = actionBtn.getAttribute('data-action');
    const row = actionBtn.closest('[data-row-index]') as HTMLElement | null;
    if (!action || !row) return;

    const index = parseInt(row.getAttribute('data-row-index') || '-1', 10);
    if (index >= 0) {
      this.handleAction(action, index);
    }
  };

  // Event delegation handler for input changes
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
    }
  };

  private render() {
    // Guard: don't render if not connected to DOM
    if (!this.isConnected) return;

    // Ensure fallback style exists without being wiped by later DOM updates
    if (
      !ckEditableArraySheet &&
      !this.shadow.querySelector('style[data-ck-editable-array-fallback]')
    ) {
      const style = document.createElement('style');
      style.setAttribute('data-ck-editable-array-fallback', '');
      style.textContent = ckEditableArrayCSS;
      this.shadow.appendChild(style);
    }

    // Keep or create a single root wrapper to avoid wiping style nodes
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

    // Apply per-instance color via CSS custom property
    const sanitizedColor = this.getSanitizedColor(this.color);
    this.style.setProperty('--ck-editable-array-color', sanitizedColor);

    // Clear wrapper content but leave other nodes (like style) intact
    wrapper.innerHTML = '';

    // Cache templates on first render
    this.initTemplates();

    // If no templates, render default message
    if (!this._displayTemplate) {
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
      const state = this._rowStates.get(index);
      const isEditing = state?.editing ?? false;

      // Create row container with ARIA listitem role
      const rowEl = document.createElement('div');
      rowEl.setAttribute('data-row-index', String(index));
      rowEl.setAttribute('role', 'listitem');
      rowEl.setAttribute('aria-label', `Item ${index + 1}`);
      rowEl.className = 'ck-editable-array__row';

      // Determine which template to use
      const templateToUse =
        isEditing && this._editTemplate
          ? this._editTemplate
          : this._displayTemplate;
      // Skip if no template (should not happen at this point, but guard for TypeScript)
      if (!templateToUse) return;
      const clone = templateToUse.content.cloneNode(true) as DocumentFragment;

      // Bind data to elements with data-bind attribute
      const bindElements = clone.querySelectorAll('[data-bind]');
      bindElements.forEach((el) => {
        const path = el.getAttribute('data-bind');
        if (!path) return;

        const value = this.getNestedValue(rowData, path);
        // Get label from data-label attribute or derive from path
        const label =
          el.getAttribute('data-label') ||
          path.split('.').pop() ||
          path;

        if (el instanceof HTMLInputElement) {
          // For inputs, set value and generate name/id attributes
          el.value = this.formatValue(value);
          el.name = `${componentName}[${index}].${path}`;
          el.id = `${componentName}_${index}_${path.replace(/\./g, '_')}`;

          // Add aria-label for accessibility if no explicit label
          if (!el.getAttribute('aria-label') && !el.labels?.length) {
            el.setAttribute('aria-label', label);
          }

          // Set readOnly if component is readonly
          if (this._readonly) {
            el.readOnly = true;
          }
        } else if (
          el instanceof HTMLTextAreaElement ||
          el instanceof HTMLSelectElement
        ) {
          // For textareas and selects
          el.value = this.formatValue(value);
          el.name = `${componentName}[${index}].${path}`;
          el.id = `${componentName}_${index}_${path.replace(/\./g, '_')}`;

          // Add aria-label for accessibility if no explicit label
          if (!el.getAttribute('aria-label')) {
            el.setAttribute('aria-label', label);
          }

          if (el instanceof HTMLTextAreaElement && this._readonly) {
            el.readOnly = true;
          }
          if (el instanceof HTMLSelectElement && this._readonly) {
            el.disabled = true;
          }
        } else {
          // For display elements, set text content
          el.textContent = this.formatValue(value);
        }
      });

      // Add ARIA labels to action buttons
      const actionButtons = clone.querySelectorAll('[data-action]');
      actionButtons.forEach((btn) => {
        const action = btn.getAttribute('data-action');
        if (!action) return;

        // Add descriptive aria-label if not already present
        if (!btn.getAttribute('aria-label')) {
          const actionLabel = this.getActionLabel(action, index);
          btn.setAttribute('aria-label', actionLabel);
        }
      });

      // Add toggle button if in display mode and no explicit toggle
      if (!isEditing && !clone.querySelector('[data-action="toggle"]')) {
        const toggleBtn = document.createElement('button');
        toggleBtn.setAttribute('data-action', 'toggle');
        toggleBtn.setAttribute('aria-label', `Edit item ${index + 1}`);
        toggleBtn.textContent = 'Edit';
        rowEl.appendChild(toggleBtn);
      }

      rowEl.appendChild(clone);
      wrapper!.appendChild(rowEl);
    });
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
      default:
        return `${action} item ${itemNum}`;
    }
  }

  private getSanitizedColor(value: string) {
    if (!value) return '#333';
    try {
      const el = document.createElement('div');
      el.style.color = value;
      // Browser normalizes valid colors to a non-empty string
      if (el.style.color) return value;
    } catch {
      // ignore
    }
    return '#333';
  }
}

// Register the custom element
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
