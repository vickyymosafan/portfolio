/**
 * InputManager - Encapsulates keyboard, touch joystick, and pointer inputs.
 * Adheres to Single Responsibility Principle (SRP) and Core Web Vitals (INP) best practices:
 * - Suppresses repeated keydown events for movement keys to eliminate event queue pileup.
 * - Guards against input processing before scene is ready.
 * - Cleanly calculates normalized movement vectors and sprint states.
 */
export class InputManager {
  constructor(options = {}) {
    this.keys = new Set();
    this.touch = { x: 0, y: 0, active: false };
    this.pointer = {
      held: false,
      lastX: 0,
      lastY: 0,
      deltaX: 0,
      deltaY: 0,
    };
    this.isReady = false;
    this.callbacks = {
      onEscape: options.onEscape || null,
      onToggleMap: options.onToggleMap || null,
      onSit: options.onSit || null,
      onInteract: options.onInteract || null,
      onInspect: options.onInspect || null,
      onJump: options.onJump || null,
      onCarouselNext: options.onCarouselNext || null,
      onCarouselPrev: options.onCarouselPrev || null,
      isSuspended: options.isSuspended || (() => false),
    };

    this.boundKeyDown = this.handleKeyDown.bind(this);
    this.boundKeyUp = this.handleKeyUp.bind(this);
    this.boundBlur = this.handleBlur.bind(this);
    this.boundVisibilityChange = () => {
      if (document.hidden) this.clear();
    };
  }

  setReady(ready = true) {
    this.isReady = ready;
  }

  attachListeners() {
    window.addEventListener('keydown', this.boundKeyDown);
    window.addEventListener('keyup', this.boundKeyUp);
    window.addEventListener('blur', this.boundBlur);
    document.addEventListener('visibilitychange', this.boundVisibilityChange);
  }

  detachListeners() {
    window.removeEventListener('keydown', this.boundKeyDown);
    window.removeEventListener('keyup', this.boundKeyUp);
    window.removeEventListener('blur', this.boundBlur);
    document.removeEventListener('visibilitychange', this.boundVisibilityChange);
  }

  handleKeyDown(event) {
    if (!this.isReady) return;

    // 1. Navigation & movement keys: prevent default scrolling and suppress OS repeat events
    if (['KeyW', 'KeyA', 'KeyS', 'KeyD', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
      event.preventDefault();
      // Crucial INP optimization: ignore repeating keydown to avoid long event queue delays
      if (event.repeat) return;
    }

    // 2. Action key routing
    if (event.code === 'Escape') {
      if (this.callbacks.onEscape) this.callbacks.onEscape();
      return;
    }

    if (event.code === 'KeyM' && !event.repeat) {
      if (this.callbacks.onToggleMap) this.callbacks.onToggleMap();
      return;
    }

    if (event.code === 'KeyC' && !event.repeat) {
      if (this.callbacks.onSit) this.callbacks.onSit();
      return;
    }

    if (event.code === 'KeyE' && !event.repeat) {
      if (this.callbacks.onInteract) this.callbacks.onInteract();
      return;
    }

    if (event.code === 'ArrowRight' && !event.repeat) {
      if (this.callbacks.onCarouselNext && this.callbacks.onCarouselNext()) return;
    }

    if (event.code === 'ArrowLeft' && !event.repeat) {
      if (this.callbacks.onCarouselPrev && this.callbacks.onCarouselPrev()) return;
    }

    if (event.code === 'KeyF' && !event.repeat) {
      if (this.callbacks.onInspect) this.callbacks.onInspect();
      return;
    }

    if (event.code === 'Space' && !event.repeat) {
      if (this.callbacks.onJump && this.callbacks.onJump()) return;
    }

    if (event.code === 'Space' && event.repeat) return;

    this.keys.add(event.code);
  }

  handleKeyUp(event) {
    this.keys.delete(event.code);
  }

  handleBlur() {
    this.keys.clear();
    this.pointer.held = false;
    this.touch.active = false;
    this.touch.x = 0;
    this.touch.y = 0;
    const joy = document.getElementById('joystick');
    if (joy) {
      joy.style.setProperty('--joy-x', '0px');
      joy.style.setProperty('--joy-y', '0px');
    }
  }

  /**
   * Calculates normalized movement vector in local character coordinate space (-1 to 1).
   */
  getMovementVector() {
    if (this.callbacks.isSuspended()) {
      return { x: 0, z: 0, isMoving: false, isSprinting: false };
    }

    let x = 0;
    let z = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) z += 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) z -= 1;

    x += this.touch.x;
    z -= this.touch.y;

    const length = Math.hypot(x, z);
    if (length > 1) {
      x /= length;
      z /= length;
    }

    const isMoving = Math.hypot(x, z) > 0.05;
    const isSprinting = (this.keys.has('ShiftLeft') || this.keys.has('ShiftRight')) && isMoving;

    return { x, z, isMoving, isSprinting };
  }

  clear() {
    this.keys.clear();
    this.pointer.held = false;
    this.touch.active = false;
    this.touch.x = 0;
    this.touch.y = 0;
  }
}
