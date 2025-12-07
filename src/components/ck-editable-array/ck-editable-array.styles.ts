export const ckEditableArrayCSS = `
:host {
  display: block;
  padding: 1rem;
  font-family: Arial, sans-serif;
}

.ck-editable-array {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem;
  border-radius: 8px;
  text-align: center;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transition: transform 0.2s ease;
}

.ck-editable-array:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 12px rgba(0, 0, 0, 0.15);
}

.ck-editable-array__message {
  font-size: 1.5rem;
  margin: 0;
  /* per-instance color via CSS custom property */
  color: var(--ck-editable-array-color, #333);
}

.ck-editable-array__subtitle {
  font-size: 1rem;
  margin: 0.5rem 0 0 0;
  opacity: 0.8;
}

/* Modal styles */
.ck-modal {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ck-modal.ck-hidden {
  display: none;
}

.ck-modal__content {
  background: white;
  color: black;
  padding: 2rem;
  border-radius: 8px;
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.ck-modal__row {
  /* Add any specific modal row styles */
}

/* Soft deleted rows */
.ck-deleted {
  opacity: 0.5;
  text-decoration: line-through;
}
`;

// Try to create a constructable stylesheet where supported. Fall back to null.
export const ckEditableArraySheet: CSSStyleSheet | null = (() => {
  try {
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore: may not exist in all targets
    const sheet = new CSSStyleSheet();
    sheet.replaceSync(ckEditableArrayCSS);
    return sheet;
  } catch {
    return null;
  }
})();
