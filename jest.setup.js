// Jest setup file for DOM testing

// Mock any global APIs or setup that your components might need
Object.defineProperty(window, 'customElements', {
  value: window.customElements || {
    define: jest.fn(),
    get: jest.fn(),
    whenDefined: jest.fn(() => Promise.resolve()),
  },
  writable: true,
});

// Setup for any additional globals your web components might need
global.HTMLElement = window.HTMLElement;
global.customElements = window.customElements;
