import {
  ckEditableArraySheet,
  ckEditableArrayCSS,
} from './ck-editable-array.styles';

export class CkEditableArray extends HTMLElement {
  private shadow: ShadowRoot;
  private _data: unknown[] = [];
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
    return ['name', 'color'];
  }

  attributeChangedCallback(name: string, oldValue: string, newValue: string) {
    if (oldValue !== newValue) {
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
  get data() {
    return this.deepClone(this._data);
  }

  set data(value: unknown[]) {
    if (!Array.isArray(value)) {
      this._data = [];
      return;
    }
    this._data = this.deepClone(value);
    // Re-render as data changed
    this.render();
  }

  private render() {
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
      this.shadow.appendChild(wrapper);
    }

    // Apply per-instance color via CSS custom property
    const sanitizedColor = this.getSanitizedColor(this.color);
    this.style.setProperty('--ck-editable-array-color', sanitizedColor);

    // Clear wrapper content but leave other nodes (like style) intact
    wrapper.innerHTML = '';

    const heading = document.createElement('h1');
    heading.className = 'ck-editable-array__message';
    heading.textContent = `Hello, ${this.name}!`;
    heading.style.color = sanitizedColor;

    const subtitle = document.createElement('p');
    subtitle.className = 'ck-editable-array__subtitle';
    subtitle.textContent = 'Welcome to our Web Component Library';

    wrapper.appendChild(heading);
    wrapper.appendChild(subtitle);
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
