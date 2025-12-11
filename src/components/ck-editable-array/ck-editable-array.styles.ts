export const ckEditableArrayCSS = `
:host {
  display: block;
  padding: 1rem;
  font-family: Arial, sans-serif;
  /* Do not set defaults here so host-level CSS variables can override. */
}

.ck-editable-array {
  /* Use a solid background color by default, exposed via a custom property so consumers
     can style the component without overriding the full block. */
  background: var(--ck-editable-array-bg, var(--card-bg, var(--bg-color, #ffffff)));
  color: var(--ck-editable-array-color, var(--text-color, #111827));
  padding: 2rem;
  border-radius: var(--ck-editable-array-radius);
  text-align: center;
  box-shadow: var(--ck-editable-array-shadow, 0 4px 6px rgba(0, 0, 0, 0.06));
  border: 1px solid var(--ck-editable-array-border, var(--border, #e5e7eb));
  transition: transform 0.2s ease, box-shadow 0.2s ease;
}

.ck-editable-array:hover {
  /* by default we avoid moving the container on hover to prevent layout shift; 
     use host CSS var to enable lift if desired: --ck-editable-array-hover-transform */
  transform: var(--ck-editable-array-hover-transform, none);
  box-shadow: var(--ck-editable-array-hover-box-shadow, 0 6px 12px rgba(0, 0, 0, 0.15));
}

.ck-editable-array__message {
  font-size: 1.5rem;
  margin: 0;
  /* per-instance color via CSS custom property */
  color: var(--ck-editable-array-color, var(--text-color, #333));
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
  background: var(--ck-editable-array-modal-backdrop, rgba(0, 0, 0, 0.5));
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
}

.ck-modal.ck-hidden {
  display: none;
}

.ck-modal__content {
  background: var(--ck-editable-array-edit-panel-bg, var(--edit-panel-bg, var(--card-bg, var(--bg-color, #f8fafc))));
  color: var(--ck-editable-array-color, var(--text-color, #000));
  padding: 2rem;
  border-radius: var(--ck-editable-array-radius);
  max-width: 90%;
  max-height: 90%;
  overflow: auto;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.3);
}

.ck-modal__row {
  /* Add any specific modal row styles */
}

/* Soft deleted rows - fade bound content only */
.ck-deleted [data-bind] {
  opacity: 0.5;
  text-decoration: line-through;
}

/* Keep action areas fully readable */
.ck-deleted [data-action],
.ck-deleted button,
.ck-deleted .row-actions,
.ck-deleted .ck-actions {
  opacity: 1;
  text-decoration: none;
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
