import "@testing-library/jest-dom";

// Polyfill localStorage for Node 22 + jsdom
class LocalStorageMock {
  private store: Record<string, string> = {};

  clear() {
    this.store = {};
  }

  getItem(key: string) {
    return this.store[key] || null;
  }

  setItem(key: string, value: string) {
    this.store[key] = String(value);
  }

  removeItem(key: string) {
    delete this.store[key];
  }

  get length() {
    return Object.keys(this.store).length;
  }

  key(index: number) {
    return Object.keys(this.store)[index] || null;
  }
}

const mockStorage = new LocalStorageMock();
Object.defineProperty(window, "localStorage", {
  value: mockStorage,
  writable: true,
});
Object.defineProperty(globalThis, "localStorage", {
  value: mockStorage,
  writable: true,
});

if (typeof window !== "undefined" && !window.PointerEvent) {
  class PointerEvent extends MouseEvent {
    public pointerId?: number;
    constructor(type: string, params: any = {}) {
      super(type, params);
      this.pointerId = params.pointerId;
    }
  }
  window.PointerEvent = PointerEvent as any;
}

if (typeof window !== "undefined") {
  if (!window.HTMLElement.prototype.scrollIntoView) {
    window.HTMLElement.prototype.scrollIntoView = () => {};
  }
  if (!window.HTMLElement.prototype.hasPointerCapture) {
    window.HTMLElement.prototype.hasPointerCapture = () => false;
    window.HTMLElement.prototype.setPointerCapture = () => {};
    window.HTMLElement.prototype.releasePointerCapture = () => {};
  }
}

Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => {},
  }),
});
