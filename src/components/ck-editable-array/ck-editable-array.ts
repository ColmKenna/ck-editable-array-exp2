import {
  ckEditableArraySheet,
  ckEditableArrayCSS,
} from './ck-editable-array.styles';

export class CkEditableArray extends HTMLElement {
  private shadow: ShadowRoot;

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
    this.render();
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

  private render() {
    if (!ckEditableArraySheet) {
      if (
        !this.shadow.querySelector('style[data-ck-editable-array-fallback]')
      ) {
        const style = document.createElement('style');
        style.setAttribute('data-ck-editable-array-fallback', '');
        style.textContent = ckEditableArrayCSS;
        this.shadow.appendChild(style);
      }
    }

    // Apply per-instance color via CSS custom property
    this.style.setProperty('--ck-editable-array-color', this.color);

    this.shadow.innerHTML = `
      <div class="ck-editable-array">
        <h1 class="ck-editable-array__message">Hello, ${this.name}!</h1>
        <p class="ck-editable-array__subtitle">Welcome to our Web Component Library</p>
      </div>
    `;

    const msg = this.shadow.querySelector(
      '.ck-editable-array__message'
    ) as HTMLElement | null;
    if (msg) msg.style.color = this.color;
  }
}

// Register the custom element
if (!customElements.get('ck-editable-array')) {
  customElements.define('ck-editable-array', CkEditableArray);
}
