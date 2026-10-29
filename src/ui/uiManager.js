/**
 * UIManager - Manages DOM interactions, HUD overlays, prompts, and modal panels.
 * Adheres to Single Responsibility Principle (SRP) and Core Web Vitals optimization:
 * - Employs state dirty-checking before any DOM property write.
 * - Caches static DOM queries to avoid layout thrashing during animation loops.
 * - Guarantees minimal reflows to keep INP and Presentation Delay below 16ms.
 */
export class UIManager {
  constructor() {
    this.$ = (id) => (typeof document !== 'undefined' ? document.getElementById(id) : null);

    this.elements = {};
    this.roomLinks = null;

    // Prompt dirty-check cache
    this.promptState = {
      visible: false,
      key: '',
      label: '',
      touch: '',
    };

    this.currentRoomId = '';
  }

  init() {
    if (typeof document === 'undefined') return;

    this.elements = {
      welcome: this.$('welcome'),
      loading: this.$('loading-screen'),
      roomName: this.$('room-name'),
      roomCount: this.$('room-count'),
      prompt: this.$('interaction-prompt'),
      promptLabel: this.$('prompt-label'),
      interactKey: this.$('interact-key'),
      touchInteract: this.$('touch-interact'),
      detail: this.$('detail-panel'),
      panelTitle: this.$('panel-title'),
      panelRole: this.$('panel-role'),
      panelSummary: this.$('panel-summary'),
      panelHighlights: this.$('panel-highlights'),
      panelActions: this.$('panel-actions'),
      pauseButton: this.$('pause-button'),
      tourToast: this.$('tour-toast'),
      tourTitle: this.$('tour-title'),
      tourDesc: this.$('tour-desc'),
      tourProgress: this.$('tour-progress'),
      worldMapModal: this.$('worldmap-modal'),
      settingsModal: this.$('settings-panel'),
    };

    this.roomLinks = Array.from(document.querySelectorAll('.room-link'));
  }

  setPrompt(visible, key = '', label = '', touch = 'Interact') {
    if (!this.elements.prompt) this.init();

    if (this.promptState.visible !== visible) {
      if (this.elements.prompt) {
        this.elements.prompt.classList.toggle('is-visible', visible);
      }
      this.promptState.visible = visible;
    }
    if (!visible) return;

    if (this.promptState.key !== key) {
      if (this.elements.interactKey) this.elements.interactKey.textContent = key;
      this.promptState.key = key;
    }

    if (this.promptState.label !== label) {
      if (this.elements.promptLabel) this.elements.promptLabel.textContent = label;
      this.promptState.label = label;
    }

    if (this.promptState.touch !== touch) {
      if (this.elements.touchInteract) this.elements.touchInteract.textContent = touch;
      this.promptState.touch = touch;
    }
  }

  updateRoom(room) {
    if (!room || this.currentRoomId === room.id) return;
    this.currentRoomId = room.id;

    if (!this.elements.roomName) this.init();

    if (this.elements.roomName) this.elements.roomName.textContent = room.label;
    if (this.elements.roomCount) this.elements.roomCount.textContent = room.count;

    if (!this.roomLinks) {
      this.roomLinks = Array.from(document.querySelectorAll('.room-link'));
    }

    for (const button of this.roomLinks) {
      const isActive = button.dataset.room === room.id;
      button.classList.toggle('is-active', isActive);
      if (isActive) {
        button.setAttribute('aria-current', 'location');
        if (typeof window !== 'undefined' && (window.innerWidth <= 900 || window.innerHeight <= 500) && typeof button.scrollIntoView === 'function') {
          button.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      } else {
        button.removeAttribute('aria-current');
      }
    }
  }

  setPaused(paused) {
    if (this.elements.pauseButton) {
      this.elements.pauseButton.classList.toggle('is-paused', paused);
    }
  }
}
