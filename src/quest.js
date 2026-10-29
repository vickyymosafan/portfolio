import * as THREE from 'three';
import { palette } from './materials.js';

export class QuestSystem {
  constructor(scene, characterRig) {
    this.scene = scene;
    this.characterRig = characterRig;
    this.collectibles = [];
    this.collectedCount = 0;
    this.totalCount = 15;
    this.audioCtx = null;
    this.hudPill = null;
    this.toastTimeout = null;

    this.itemsConfig = [
      {
        id: 'fountain',
        name: 'The Fountain Heart',
        room: 'Front Yard',
        quote: '“Every great journey begins with a single curious step.”',
        pos: [0.0, 0.9, 16.0],
        color: 0x48cae4,
      },
      {
        id: 'paradigm',
        name: 'The Neural Gem',
        room: 'Living Room',
        quote: '“Engineering is not replaced by AI. It is amplified by it.”',
        pos: [-2.0, 0.9, 0.5],
        color: 0xffa07a,
      },
      {
        id: 'artifacts',
        name: 'The Flagship Golden Gear',
        room: 'Project Gallery',
        quote: '7 Production systems with verified telemetry and architecture.',
        pos: [-11.0, 0.9, -1.5],
        color: 0xeb6f92,
      },
      {
        id: 'stack',
        name: 'The Full-Stack Core',
        room: 'Home Office',
        quote: 'TypeScript, React 19, Next.js 15, Node.js & Laravel.',
        pos: [10.5, 0.9, -1.5],
        color: 0x70a5fd,
      },
      {
        id: 'bmw',
        name: 'The Twin-Turbo Crest',
        room: 'Private Garage',
        quote: 'BMW M-Series precision tuning, 60 FPS performance & speed.',
        pos: [21.0, 0.9, 1.4],
        color: 0xf4d35e,
      },
      {
        id: 'serenity',
        name: 'The Lotus Crystal',
        room: 'Master Bedroom',
        quote: 'Rest, recharge, and deep architectural focus.',
        pos: [-11.0, 6.1, 0.6],
        color: 0xc8b6ff,
      },
      {
        id: 'bath',
        name: 'The Pure Essence',
        room: 'Master Bathroom',
        quote: 'Clean code hygiene, zero debt, and pristine refactoring.',
        pos: [0.0, 6.1, -11.8],
        color: 0x70e000,
      },
      {
        id: 'journey',
        name: 'The Milestone Scroll',
        room: 'Library Nook',
        quote: 'Bank Mandiri x Rakamin & PT Antosa verified journey.',
        pos: [10.5, 6.1, -1.5],
        color: 0xf6c177,
      },
      {
        id: 'blueprint',
        name: 'The Master Blueprint',
        room: 'Creative Studio',
        quote: 'SOLID, DRY, KISS & the deterministic agentic workflow.',
        pos: [21.0, 6.1, -1.5],
        color: 0x9ece6a,
      },
      {
        id: 'terrace',
        name: 'The Sunset Monolith',
        room: 'Garden Terrace',
        quote: 'Open for high-impact engineering collaboration.',
        pos: [0.0, 0.9, -22.5],
        color: 0xee6c4d,
      },
      {
        id: 'pool',
        name: 'The Aquamarine Prism',
        room: 'Swimming Pool',
        quote: 'Fluid dynamics, calm relaxation, and stylized water caustics.',
        pos: [-24.5, 0.9, -6.0],
        color: 0x00b4d8,
      },
      {
        id: 'zen',
        name: 'The Dragon Koi Pearl',
        room: 'Zen Garden',
        quote: 'Harmony of natural stone waterfalls, koi ponds, and bonsai.',
        pos: [34.5, 0.9, -9.0],
        color: 0xff758f,
      },
      {
        id: 'barn',
        name: 'The Harvest Bell',
        room: 'Peternakan',
        quote: 'Sustainable livestock pastures, Holstein cows, and poultry.',
        pos: [-34.0, 0.9, -32.0],
        color: 0xd90429,
      },
      {
        id: 'sawah',
        name: 'The Golden Paddy Ear',
        room: 'Sawah Modern',
        quote: 'Stepped irrigation terraces and modern agricultural machinery.',
        pos: [18.0, 0.9, -35.0],
        color: 0xffb703,
      },
      {
        id: 'security',
        name: 'The Sentinel Insignia',
        room: 'Security Checkpoint',
        quote: '24/7 Perimeter security, gatehouses, and public thoroughfare.',
        pos: [0.0, 0.9, 27.0],
        color: 0x3a86ff,
      },
    ];

    this.initHUD();
    this.spawnCollectibles();
  }

  initHUD() {
    // Add persistent quest pill to topbar
    const topActions = document.querySelector('.top-actions');
    if (topActions) {
      const pill = document.createElement('div');
      pill.id = 'quest-pill';
      pill.className = 'quest-pill';
      pill.setAttribute('title', 'Discover all 15 World Landmarks across the Estate!');
      pill.innerHTML = `<span class="quest-icon">🏆</span><span id="quest-count">0 / 15</span>`;
      topActions.insertBefore(pill, topActions.firstChild);
      this.hudPill = pill;
    }

    // Quest toast notification element
    let toast = document.getElementById('quest-toast');
    if (!toast) {
      toast = document.createElement('div');
      toast.id = 'quest-toast';
      toast.className = 'quest-toast';
      toast.setAttribute('role', 'status');
      toast.setAttribute('aria-live', 'polite');
      document.getElementById('experience')?.appendChild(toast);
    }
  }

  playChime(type = 'collect') {
    try {
      if (!this.audioCtx) {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (AudioContext) this.audioCtx = new AudioContext();
      }
      if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      if (!this.audioCtx) return;

      const now = this.audioCtx.currentTime;
      if (type === 'collect') {
        // Cheerful cartoon ascending two-tone chime
        const osc = this.audioCtx.createOscillator();
        const gain = this.audioCtx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, now); // C5
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.12); // G5
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
        osc.connect(gain);
        gain.connect(this.audioCtx.destination);
        osc.start(now);
        osc.stop(now + 0.35);
      } else if (type === 'complete') {
        // Triumphant 4-tone celebration arpeggio (C5 -> E5 -> G5 -> C6)
        const notes = [523.25, 659.25, 783.99, 1046.5];
        notes.forEach((freq, idx) => {
          const osc = this.audioCtx.createOscillator();
          const gain = this.audioCtx.createGain();
          const noteStart = now + idx * 0.11;
          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, noteStart);
          gain.gain.setValueAtTime(0.2, noteStart);
          gain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.4);
          osc.connect(gain);
          gain.connect(this.audioCtx.destination);
          osc.start(noteStart);
          osc.stop(noteStart + 0.45);
        });
      }
    } catch {
      // Audio playback fails gracefully if browser restricts autoplay
    }
  }

  spawnCollectibles() {
    const count = this.itemsConfig.length;
    const gemGeo = new THREE.OctahedronGeometry(0.24, 0);
    const ringGeo = new THREE.RingGeometry(0.32, 0.45, 16);

    const gemMat = new THREE.MeshStandardMaterial({
      color: 0xffffff,
      roughness: 0.2,
      metalness: 0.25,
    });
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.45,
      side: THREE.DoubleSide,
      depthWrite: false,
    });

    this.gemInstMesh = new THREE.InstancedMesh(gemGeo, gemMat, count);
    this.gemInstMesh.castShadow = false;
    this.gemInstMesh.userData.isDynamic = true;
    this.ringInstMesh = new THREE.InstancedMesh(ringGeo, ringMat, count);
    this.ringInstMesh.userData.isDynamic = true;

    this._dummy = new THREE.Object3D();
    const colorObj = new THREE.Color();

    for (let i = 0; i < count; i += 1) {
      const cfg = this.itemsConfig[i];
      colorObj.setHex(cfg.color);
      this.gemInstMesh.setColorAt(i, colorObj);
      this.ringInstMesh.setColorAt(i, colorObj);

      this._dummy.position.set(cfg.pos[0], cfg.pos[1], cfg.pos[2]);
      this._dummy.rotation.set(0, 0, 0);
      this._dummy.scale.setScalar(1);
      this._dummy.updateMatrix();
      this.gemInstMesh.setMatrixAt(i, this._dummy.matrix);

      this._dummy.position.set(cfg.pos[0], 0.03, cfg.pos[2]);
      this._dummy.rotation.set(-Math.PI * 0.5, 0, 0);
      this._dummy.scale.setScalar(1);
      this._dummy.updateMatrix();
      this.ringInstMesh.setMatrixAt(i, this._dummy.matrix);

      this.collectibles.push({
        ...cfg,
        index: i,
        posVec: new THREE.Vector3(cfg.pos[0], cfg.pos[1], cfg.pos[2]),
        rotY: 0,
        rotZ: 0,
        ringRotZ: 0,
        scale: 1,
        baseY: cfg.pos[1],
        collected: false,
      });
    }

    if (this.gemInstMesh.instanceColor) this.gemInstMesh.instanceColor.needsUpdate = true;
    if (this.ringInstMesh.instanceColor) this.ringInstMesh.instanceColor.needsUpdate = true;
    this.scene.add(this.gemInstMesh);
    this.scene.add(this.ringInstMesh);
  }

  showToast(title, subtitle) {
    const toast = document.getElementById('quest-toast');
    if (!toast) return;

    toast.innerHTML = `
      <div class="toast-badge">ARTIFACT DISCOVERED</div>
      <div class="toast-title">${title}</div>
      <div class="toast-sub">${subtitle}</div>
    `;
    toast.classList.add('is-visible');

    if (this.toastTimeout) clearTimeout(this.toastTimeout);
    this.toastTimeout = setTimeout(() => {
      toast.classList.remove('is-visible');
    }, 4200);
  }

  showCompletionModal() {
    this.playChime('complete');

    // Create or reuse celebration modal
    let modal = document.getElementById('quest-complete-modal');
    if (!modal) {
      modal = document.createElement('section');
      modal.id = 'quest-complete-modal';
      modal.className = 'quest-complete-modal';
      modal.setAttribute('role', 'dialog');
      modal.setAttribute('aria-modal', 'true');
      document.getElementById('experience')?.appendChild(modal);
    }

    modal.innerHTML = `
      <div class="modal-card">
        <div class="modal-confetti" aria-hidden="true">🎉 🌟 🚀 🏆 💡</div>
        <div class="modal-badge">EASTER EGG UNLOCKED</div>
        <h2 class="modal-title">Master Architect!</h2>
        <p class="modal-copy">
          You discovered all <strong>5 Engineering Artifacts</strong> across Vicky Mosafan’s 3D cartoon world!
        </p>
        <blockquote class="modal-quote">
          “Engineering is not replaced by AI. It is amplified by it. Building thoughtful, scalable systems requires solid foundations, clear PRDs, and human craft.”
        </blockquote>
        <p class="modal-author">— M. Vicky Mosafan · Surabaya, ID</p>
        <div class="modal-actions">
          <button type="button" class="primary-button" id="modal-close-btn">Continue Wandering 🌿</button>
        </div>
      </div>
    `;

    modal.classList.add('is-visible');
    document.getElementById('modal-close-btn')?.addEventListener('click', () => {
      modal.classList.remove('is-visible');
    }, { once: true });
  }

  update(dt, elapsed, playerPos) {
    const dummy = this._dummy;
    let matrixDirty = false;

    for (const item of this.collectibles) {
      if (item.collected) {
        if (item.scale > 0.001) {
          item.scale = Math.max(0, item.scale * (1 - dt * 8.0));
          dummy.position.copy(item.posVec);
          dummy.rotation.set(0, item.rotY, item.rotZ);
          dummy.scale.setScalar(item.scale);
          dummy.updateMatrix();
          this.gemInstMesh.setMatrixAt(item.index, dummy.matrix);

          dummy.position.set(item.posVec.x, 0.03, item.posVec.z);
          dummy.rotation.set(-Math.PI * 0.5, 0, item.ringRotZ);
          dummy.scale.setScalar(item.scale);
          dummy.updateMatrix();
          this.ringInstMesh.setMatrixAt(item.index, dummy.matrix);
          matrixDirty = true;
        }
        continue;
      }

      // Gentle floating bob & rotation
      item.rotY += dt * 1.8;
      item.rotZ += dt * 0.9;
      item.posVec.y = item.baseY + Math.sin(elapsed * 2.8 + item.baseY) * 0.08;

      dummy.position.copy(item.posVec);
      dummy.rotation.set(0, item.rotY, item.rotZ);
      dummy.scale.setScalar(1);
      dummy.updateMatrix();
      this.gemInstMesh.setMatrixAt(item.index, dummy.matrix);

      // Pulse floor ring
      item.ringRotZ += dt * 0.6;
      const rScale = 1 + Math.sin(elapsed * 3.5) * 0.12;
      dummy.position.set(item.posVec.x, 0.03, item.posVec.z);
      dummy.rotation.set(-Math.PI * 0.5, 0, item.ringRotZ);
      dummy.scale.setScalar(rScale);
      dummy.updateMatrix();
      this.ringInstMesh.setMatrixAt(item.index, dummy.matrix);
      matrixDirty = true;

      // Check distance to player
      if (playerPos) {
        const dx = playerPos.x - item.posVec.x;
        const dy = playerPos.y - item.posVec.y;
        const dz = playerPos.z - item.posVec.z;
        const distSq = dx * dx + dy * dy + dz * dz;

        if (distSq < 1.7 * 1.7) {
          item.collected = true;
          this.collectedCount += 1;
          this.playChime('collect');

          // Update HUD
          const countEl = document.getElementById('quest-count');
          if (countEl) countEl.textContent = `${this.collectedCount} / ${this.totalCount}`;

          this.showToast(item.name, `${item.room} · ${item.quote}`);

          if (this.collectedCount >= this.totalCount) {
            setTimeout(() => this.showCompletionModal(), 600);
          }
        }
      }
    }

    if (matrixDirty) {
      this.gemInstMesh.instanceMatrix.needsUpdate = true;
      this.ringInstMesh.instanceMatrix.needsUpdate = true;
    }
  }

  collectItem(id) {
    const item = this.collectibles.find((c) => c.id === id);
    if (!item || item.collected) return false;
    item.collected = true;
    this.collectedCount += 1;
    this.playChime('collect');
    const countEl = document.getElementById('quest-count');
    if (countEl) countEl.textContent = `${this.collectedCount} / ${this.totalCount}`;
    this.showToast(item.name, `${item.room} · ${item.quote}`);
    if (this.collectedCount >= this.totalCount) {
      this.showCompletionModal();
    }
    return true;
  }
}
