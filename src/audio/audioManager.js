import * as THREE from 'three';

/**
 * AudioManager handles ambient gameplay background music (BGM)
 * using Three.js AudioListener/Audio with HTML5 Audio fallback,
 * smooth volume fading, state persistence, and browser autoplay compliance.
 */
export class AudioManager {
  constructor(options = {}) {
    this.camera = options.camera || null;
    this.src = options.src || '/audio/cozy-gameplay-bgm.wav';
    this.targetVolume = options.volume !== undefined ? options.volume : 0.35;
    this.isMuted = false;
    this.isPlaying = false;
    this.listener = null;
    this.sound = null;
    this.htmlAudio = null;
    this.isInitialized = false;
    this.fadeTimer = null;
    this.currentVolume = 0;

    // Load saved settings
    try {
      const savedMuted = localStorage.getItem('vicky_portfolio_bgm_muted');
      if (savedMuted !== null) this.isMuted = savedMuted === 'true';

      const savedVol = localStorage.getItem('vicky_portfolio_bgm_volume');
      if (savedVol !== null) {
        const v = parseFloat(savedVol);
        if (!isNaN(v) && v >= 0 && v <= 1) this.targetVolume = v;
      }
    } catch {
      // Ignore storage errors in private modes
    }

    this.onStateChange = options.onStateChange || null;
  }

  /**
   * Initializes the audio system and attaches AudioListener to camera.
   */
  init(camera) {
    if (this.isInitialized) return;
    if (camera) this.camera = camera;

    try {
      this.listener = new THREE.AudioListener();
      if (this.camera) this.camera.add(this.listener);

      this.sound = new THREE.Audio(this.listener);
      const audioLoader = new THREE.AudioLoader();

      audioLoader.load(
        this.src,
        (buffer) => {
          if (!this.sound) return;
          this.sound.setBuffer(buffer);
          this.sound.setLoop(true);
          this.sound.setVolume(this.isMuted ? 0 : this.currentVolume);
          this.isInitialized = true;

          // If playback was requested while loading
          if (this.isPlaying && !this.isMuted) {
            this.resumeContext();
            if (!this.sound.isPlaying) {
              this.sound.play();
              this.fadeIn(1.5);
            }
          }
        },
        undefined,
        (err) => {
          console.warn('[AudioManager] Three.js AudioLoader failed, falling back to HTML5 Audio:', err);
          this.initHtmlAudio();
        }
      );
    } catch (err) {
      console.warn('[AudioManager] Web Audio not available, using HTML5 Audio:', err);
      this.initHtmlAudio();
    }
  }

  /**
   * Fallback for environments where Web Audio is restricted
   */
  initHtmlAudio() {
    if (this.htmlAudio) return;
    try {
      this.htmlAudio = new Audio(this.src);
      this.htmlAudio.loop = true;
      this.htmlAudio.volume = this.isMuted ? 0 : this.currentVolume;
      this.isInitialized = true;
      if (this.isPlaying && !this.isMuted) {
        this.htmlAudio.play().catch(() => {});
        this.fadeIn(1.5);
      }
    } catch (e) {
      console.error('[AudioManager] HTML5 Audio initialization failed:', e);
    }
  }

  /**
   * Resumes Web Audio AudioContext if in suspended state
   */
  resumeContext() {
    if (this.listener && this.listener.context && this.listener.context.state === 'suspended') {
      this.listener.context.resume().catch(() => {});
    }
  }

  /**
   * Starts BGM playback (called after user interaction)
   */
  play() {
    this.isPlaying = true;
    this.resumeContext();

    if (this.isMuted) {
      this.notifyState();
      return;
    }

    if (this.sound && this.sound.buffer) {
      if (!this.sound.isPlaying) {
        this.sound.play();
      }
      this.fadeIn(1.5);
    } else if (this.htmlAudio) {
      this.htmlAudio.play().catch(() => {});
      this.fadeIn(1.5);
    }

    this.notifyState();
  }

  /**
   * Pauses BGM playback
   */
  pause() {
    this.isPlaying = false;
    this.fadeOut(0.6, () => {
      if (this.sound && this.sound.isPlaying) {
        this.sound.pause();
      }
      if (this.htmlAudio) {
        this.htmlAudio.pause();
      }
    });
    this.notifyState();
  }

  /**
   * Toggles mute state
   */
  toggleMute() {
    this.resumeContext();
    this.isMuted = !this.isMuted;

    try {
      localStorage.setItem('vicky_portfolio_bgm_muted', String(this.isMuted));
    } catch {}

    if (this.isMuted) {
      this.fadeOut(0.4);
    } else {
      if (!this.isPlaying) {
        this.play();
      } else {
        if (this.sound && this.sound.buffer && !this.sound.isPlaying) {
          this.sound.play();
        } else if (this.htmlAudio && this.htmlAudio.paused) {
          this.htmlAudio.play().catch(() => {});
        }
        this.fadeIn(1.2);
      }
    }

    this.notifyState();
    return !this.isMuted;
  }

  /**
   * Sets master target volume (0.0 to 1.0)
   */
  setVolume(vol) {
    const clamped = Math.max(0, Math.min(1, vol));
    this.targetVolume = clamped;

    try {
      localStorage.setItem('vicky_portfolio_bgm_volume', String(clamped));
    } catch {}

    if (!this.isMuted && this.isPlaying) {
      this.applyVolume(clamped);
    }
    this.notifyState();
  }

  /**
   * Applies the physical volume to active audio backend
   */
  applyVolume(v) {
    this.currentVolume = v;
    if (this.sound && this.sound.setVolume) {
      this.sound.setVolume(v);
    }
    if (this.htmlAudio) {
      this.htmlAudio.volume = v;
    }
  }

  /**
   * Smooth volume fade-in
   */
  fadeIn(durationSec = 1.0) {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const steps = 24;
    const intervalMs = (durationSec * 1000) / steps;
    const startVol = this.currentVolume;
    const endVol = this.targetVolume;
    let step = 0;

    this.fadeTimer = setInterval(() => {
      step++;
      const progress = step / steps;
      const v = startVol + (endVol - startVol) * progress;
      this.applyVolume(v);

      if (step >= steps) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        this.applyVolume(endVol);
      }
    }, intervalMs);
  }

  /**
   * Smooth volume fade-out
   */
  fadeOut(durationSec = 0.5, onComplete) {
    if (this.fadeTimer) clearInterval(this.fadeTimer);
    const steps = 16;
    const intervalMs = (durationSec * 1000) / steps;
    const startVol = this.currentVolume;
    let step = 0;

    this.fadeTimer = setInterval(() => {
      step++;
      const progress = step / steps;
      const v = startVol * (1 - progress);
      this.applyVolume(v);

      if (step >= steps) {
        clearInterval(this.fadeTimer);
        this.fadeTimer = null;
        this.applyVolume(0);
        if (onComplete) onComplete();
      }
    }, intervalMs);
  }

  notifyState() {
    if (this.onStateChange) {
      this.onStateChange({
        isPlaying: this.isPlaying,
        isMuted: this.isMuted,
        volume: this.targetVolume,
        currentVolume: this.currentVolume,
      });
    }
  }
}

