import * as THREE from 'three';
import { portfolio } from './portfolio.js';

export const CinematicState = {
  IDLE: 'IDLE',
  ENTERING: 'ENTERING',
  PRESENTING: 'PRESENTING',
  CONTENT_VISIBLE: 'CONTENT_VISIBLE',
  EXITING: 'EXITING',
};

export class CinematicDirector {
  constructor(options = {}) {
    this.scene = options.scene || null;
    this.camera = options.camera || null;
    this.characterRig = options.characterRig || null;
    this.cameraBlockers = options.cameraBlockers || [];
    this.onStateChange = options.onStateChange || null;

    this.state = CinematicState.IDLE;
    this.activeSection = null;
    this.activeProjectIndex = 0;

    // Transition timing (seconds)
    this.enterDuration = 1.1;
    this.exitDuration = 0.7;
    this.transitionClock = 0;

    // Reusable math vectors for zero garbage-collection allocations in frame loop
    this._camStartPos = new THREE.Vector3();
    this._camStartLook = new THREE.Vector3();
    this._camTargetPos = new THREE.Vector3();
    this._camTargetLook = new THREE.Vector3();
    this._currentLook = new THREE.Vector3();
    this._tempV1 = new THREE.Vector3();
    this._tempV2 = new THREE.Vector3();

    // Stored player & camera state before cinematic scene started
    this.savedCameraDistance = 4.4;
    this.savedYaw = 0;
    this.savedPitch = 0.25;
    this.savedCharRotation = 0;

    // Target values during presentation
    this.goalCharRotation = 0;

    // DOM UI elements
    this.uiContainer = null;
    this.initUI();
  }

  setSceneContext({ scene, camera, characterRig, cameraBlockers }) {
    if (scene) this.scene = scene;
    if (camera) this.camera = camera;
    if (characterRig) this.characterRig = characterRig;
    if (cameraBlockers) this.cameraBlockers = cameraBlockers;
  }

  initUI() {
    let overlay = document.getElementById('cinematic-story-card');
    if (!overlay) {
      overlay = document.createElement('section');
      overlay.id = 'cinematic-story-card';
      overlay.className = 'cinematic-story-card';
      overlay.setAttribute('role', 'dialog');
      overlay.setAttribute('aria-modal', 'true');
      overlay.setAttribute('aria-hidden', 'true');
      document.getElementById('experience')?.appendChild(overlay);
    }
    this.uiContainer = overlay;
  }

  isExploring() {
    return this.state === CinematicState.IDLE;
  }

  isActive() {
    return this.state !== CinematicState.IDLE;
  }

  isInputLocked() {
    return this.state !== CinematicState.IDLE;
  }

  canStart() {
    return this.state === CinematicState.IDLE;
  }

  /**
   * Begins a cinematic interaction sequence for a specific section
   * @param {string} sectionId - Room ID ('about', 'skills', 'experience', 'projects', 'process', 'contact')
   * @param {object} playerState - Current gameplay camera and character parameters
   */
  startScene(sectionId, playerState = {}) {
    // If already entering, presenting, or visible for the same section, prevent duplicate E triggers
    if (this.activeSection === sectionId && (this.state === CinematicState.ENTERING || this.state === CinematicState.PRESENTING || this.state === CinematicState.CONTENT_VISIBLE)) {
      return false;
    }

    // Clean up exiting or interrupted state immediately
    if (this.state === CinematicState.EXITING) {
      this.uiContainer.classList.remove('is-exiting');
    }

    const room = portfolio.rooms.find((r) => r.id === sectionId);
    const content = portfolio.content[sectionId];
    if (!room || !content) return false;

    this.activeSection = sectionId;
    this.activeProjectIndex = 0;
    this.state = CinematicState.ENTERING;
    this.transitionClock = 0;

    // Save gameplay parameters so we can cleanly restore them on exit
    this.savedCameraDistance = playerState.cameraDistance || 4.4;
    this.savedYaw = playerState.yaw || 0;
    this.savedPitch = playerState.pitch || 0.25;
    if (this.characterRig) {
      this.savedCharRotation = this.characterRig.character.rotation.y;
    }

    // Capture starting camera position
    if (this.camera) {
      this._camStartPos.copy(this.camera.position);
      // Derive starting lookAt point ~5 units along camera forward ray
      this.camera.getWorldDirection(this._tempV1);
      this._camStartLook.copy(this.camera.position).addScaledVector(this._tempV1, 5.0);
    }

    // Determine section-specific camera shot
    const shot = this.computeSectionShot(room, content, playerState);
    this._camTargetPos.copy(shot.position);
    this._camTargetLook.copy(shot.lookAt);
    this.goalCharRotation = shot.charFacing !== undefined ? shot.charFacing : room.facing;

    // Reset and render content inside the cinematic story card
    this.renderContent(sectionId, content, room);
    this.uiContainer.classList.add('is-entering');
    this.uiContainer.classList.remove('is-hidden');
    this.uiContainer.setAttribute('aria-hidden', 'false');

    if (this.characterRig?.setActionState) {
      this.characterRig.setActionState('PRESENTING');
    }

    if (this.onStateChange) this.onStateChange(this.state, this.activeSection);
    return true;
  }

  /**
   * Computes collision-aware, beautifully framed camera shot coordinates for each room
   */
  computeSectionShot(room, content, playerState) {
    const rx = room.position[0];
    const ry = room.position[1] !== undefined ? room.position[1] : 0;
    const rz = room.position[2];
    const isUpper = ry > 2.0;

    let camX, camY, camZ, lookX, lookY, lookZ, charFacing;

    switch (room.id) {
      case 'about':
        // Living room: Ground floor center (rx = 0, rz = 0.5)
        camX = rx + 1.8;
        camY = ry + 1.95;
        camZ = rz + 2.6;
        lookX = rx - 1.2;
        lookY = ry + 1.9;
        lookZ = rz - 3.0;
        charFacing = -0.3;
        break;

      case 'skills':
        // Home office: Ground floor right (rx = 10.75, rz = -1.5)
        camX = rx - 2.4;
        camY = ry + 1.88;
        camZ = rz + 2.5;
        lookX = rx + 1.4;
        lookY = ry + 1.9;
        lookZ = rz - 3.4;
        charFacing = 0.35;
        break;

      case 'projects':
        // Project gallery: Ground floor left (rx = -11.0, rz = -1.5)
        camX = rx + 2.4;
        camY = ry + 1.85;
        camZ = rz + 2.5;
        lookX = rx - 1.4;
        lookY = ry + 1.9;
        lookZ = rz - 3.2;
        charFacing = -0.35;
        break;

      case 'experience':
        // Library nook: Upper floor right (rx = 10.5, ry = 5.2, rz = -1.5)
        camX = rx - 2.2;
        camY = ry + 1.88;
        camZ = rz + 2.5;
        lookX = rx + 1.4;
        lookY = ry + 1.9;
        lookZ = rz - 3.2;
        charFacing = 0.35;
        break;

      case 'process':
        // Creative studio: Upper floor far right (rx = 21.0, ry = 5.2, rz = -1.5)
        camX = rx - 2.2;
        camY = ry + 1.88;
        camZ = rz + 2.5;
        lookX = rx + 1.4;
        lookY = ry + 1.9;
        lookZ = rz - 3.2;
        charFacing = 0.35;
        break;

      case 'garage':
        // Private garage: Ground floor far right (rx = 21.0, rz = 0.5)
        camX = rx - 2.5;
        camY = ry + 1.9;
        camZ = rz + 2.5;
        lookX = rx + 1.2;
        lookY = ry + 1.7;
        lookZ = rz - 2.0;
        charFacing = 0.25;
        break;

      case 'bedroom':
        // Master bedroom: Upper floor left (rx = -11.0, ry = 5.2, rz = -1.0)
        camX = rx + 2.2;
        camY = ry + 1.88;
        camZ = rz + 2.5;
        lookX = rx - 1.2;
        lookY = ry + 1.85;
        lookZ = rz - 2.8;
        charFacing = -0.3;
        break;

      case 'bathroom':
        // Master bathroom: Upper floor center (rx = 0.0, ry = 5.2, rz = -1.0)
        camX = rx + 2.0;
        camY = ry + 1.88;
        camZ = rz + 2.5;
        lookX = rx - 1.0;
        lookY = ry + 1.85;
        lookZ = rz - 2.5;
        charFacing = -0.25;
        break;

      case 'contact':
        // Garden terrace (rx = 0.0, rz = -22.5)
        camX = rx - 2.4;
        camY = ry + 1.95;
        camZ = rz + 2.6;
        lookX = rx + 1.4;
        lookY = ry + 1.9;
        lookZ = rz - 2.5;
        charFacing = 0.35;
        break;

      default:
        camX = rx;
        camY = ry + 2.1;
        camZ = rz + 3.0;
        lookX = rx;
        lookY = ry + 1.8;
        lookZ = rz - 1.0;
        charFacing = 0;
        break;
    }

    // Floor-aware height clamps
    const minY = isUpper ? 6.2 : 1.4;
    const maxY = isUpper ? 9.2 : 4.2;
    camY = THREE.MathUtils.clamp(camY, minY, maxY);
    if (camZ < -26.0) camZ = -26.0;
    if (camZ > 4.5 && room.id !== 'yard') camZ = 4.2;

    return {
      position: new THREE.Vector3(camX, camY, camZ),
      lookAt: new THREE.Vector3(lookX, lookY, lookZ),
      charFacing,
    };
  }

  /**
   * Skip current transition directly to content visible
   */
  skipToContent() {
    if (this.state === CinematicState.ENTERING || this.state === CinematicState.PRESENTING) {
      this.state = CinematicState.CONTENT_VISIBLE;
      this.transitionClock = this.enterDuration;
      if (this.camera) {
        this.camera.position.copy(this._camTargetPos);
        this.camera.lookAt(this._camTargetLook);
      }
      if (this.characterRig) {
        this.characterRig.character.rotation.y = this.goalCharRotation;
      }
      this.uiContainer.classList.remove('is-entering');
      this.uiContainer.classList.add('is-visible');
      if (this.onStateChange) this.onStateChange(this.state, this.activeSection);
    }
  }

  /**
   * Request exiting the cinematic presentation and return smoothly to gameplay
   */
  exitScene(instant = false) {
    if (this.state === CinematicState.IDLE) {
      return;
    }

    if (instant || window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      this.state = CinematicState.IDLE;
      this.activeSection = null;
      if (this.characterRig?.setActionState) {
        this.characterRig.setActionState('IDLE');
      }
      this.uiContainer.classList.remove('is-visible', 'is-entering', 'is-exiting');
      this.uiContainer.classList.add('is-hidden');
      this.uiContainer.setAttribute('aria-hidden', 'true');
      if (this.onStateChange) this.onStateChange(this.state, null);
      return;
    }

    this.state = CinematicState.EXITING;
    this.transitionClock = 0;
    this.exitDuration = 0.55;

    // Fade out story UI immediately
    this.uiContainer.classList.remove('is-visible', 'is-entering');
    this.uiContainer.classList.add('is-exiting');

    // Capture starting camera position for smooth pull-back
    if (this.camera) {
      this._camStartPos.copy(this.camera.position);
      this.camera.getWorldDirection(this._tempV1);
      this._camStartLook.copy(this.camera.position).addScaledVector(this._tempV1, 5.0);
    }

    // Compute return camera position based on current character translation
    if (this.characterRig && this.camera) {
      const charPos = this.characterRig.character.position;
      const horizontal = this.savedCameraDistance * Math.cos(this.savedPitch);
      this._camTargetPos.set(
        charPos.x + Math.sin(this.savedYaw) * horizontal,
        charPos.y + 1.4 + Math.sin(this.savedPitch) * this.savedCameraDistance,
        charPos.z + Math.cos(this.savedYaw) * horizontal
      );
      this._camTargetLook.set(charPos.x, charPos.y + 1.35, charPos.z);
    }

    if (this.onStateChange) this.onStateChange(this.state, this.activeSection);
  }

  /**
   * Called every frame from main loop
   * @param {number} dt - delta time in seconds
   * @returns {boolean} true if cinematic is actively controlling camera and controls
   */
  update(dt) {
    if (this.state === CinematicState.IDLE) {
      return false;
    }

    this.transitionClock += dt;

    if (this.state === CinematicState.ENTERING) {
      const progress = Math.min(1.0, this.transitionClock / this.enterDuration);
      // Smooth cubic ease for filmic camera glide
      const ease = this.cubicEaseInOut(progress);

      if (this.camera) {
        this.camera.position.lerpVectors(this._camStartPos, this._camTargetPos, ease);
        this._currentLook.lerpVectors(this._camStartLook, this._camTargetLook, ease);
        this.camera.lookAt(this._currentLook);
      }

      // Smoothly orient character to face focal point
      if (this.characterRig) {
        let diff = this.goalCharRotation - this.characterRig.character.rotation.y;
        diff = Math.atan2(Math.sin(diff), Math.cos(diff));
        this.characterRig.character.rotation.y += diff * Math.min(1.0, dt * 5.0);
      }

      if (progress >= 1.0) {
        this.state = CinematicState.PRESENTING;
        this.uiContainer.classList.remove('is-entering');
        this.uiContainer.classList.add('is-visible');
        if (this.onStateChange) this.onStateChange(this.state, this.activeSection);
      }
      return true;
    }

    if (this.state === CinematicState.PRESENTING || this.state === CinematicState.CONTENT_VISIBLE) {
      // Keep camera gently breathing / stable in presentation mode
      if (this.camera) {
        this.camera.position.x = THREE.MathUtils.damp(this.camera.position.x, this._camTargetPos.x, 8.0, dt);
        this.camera.position.y = THREE.MathUtils.damp(this.camera.position.y, this._camTargetPos.y, 8.0, dt);
        this.camera.position.z = THREE.MathUtils.damp(this.camera.position.z, this._camTargetPos.z, 8.0, dt);
        this.camera.lookAt(this._camTargetLook);
      }
      return true;
    }

    if (this.state === CinematicState.EXITING) {
      const progress = Math.min(1.0, this.transitionClock / this.exitDuration);
      const ease = this.cubicEaseInOut(progress);

      if (this.camera) {
        this.camera.position.lerpVectors(this._camStartPos, this._camTargetPos, ease);
        this._currentLook.lerpVectors(this._camStartLook, this._camTargetLook, ease);
        this.camera.lookAt(this._currentLook);
      }

      if (progress >= 1.0) {
        // Complete transition and return to IDLE
        this.state = CinematicState.IDLE;
        this.activeSection = null;
        if (this.characterRig?.setActionState) {
          this.characterRig.setActionState('IDLE');
        }
        this.uiContainer.classList.remove('is-exiting');
        this.uiContainer.classList.add('is-hidden');
        this.uiContainer.setAttribute('aria-hidden', 'true');

        if (this.onStateChange) this.onStateChange(this.state, null);
      }
      return true;
    }

    return false;
  }

  cubicEaseInOut(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /**
   * Builds the rich cinematic storytelling DOM UI for the active section
   */
  renderContent(sectionId, content, room) {
    const card = this.uiContainer;
    card.innerHTML = '';

    // Header bar with chapter badge, section count, and controls
    const header = document.createElement('div');
    header.className = 'cinematic-header';

    const meta = document.createElement('div');
    meta.className = 'cinematic-meta';

    const badge = document.createElement('span');
    badge.className = 'cinematic-badge';
    badge.innerHTML = `<span class="badge-dot"></span>${content.eyebrow || room.eyebrow}`;

    const count = document.createElement('span');
    count.className = 'cinematic-count';
    count.textContent = room.count;

    meta.append(badge, count);

    const controls = document.createElement('div');
    controls.className = 'cinematic-controls';

    const skipBtn = document.createElement('button');
    skipBtn.className = 'cinematic-skip-btn';
    skipBtn.type = 'button';
    skipBtn.textContent = 'Skip';
    skipBtn.title = 'Skip camera transition';
    skipBtn.addEventListener('click', () => this.skipToContent());

    const closeBtn = document.createElement('button');
    closeBtn.className = 'cinematic-close-btn';
    closeBtn.type = 'button';
    closeBtn.setAttribute('aria-label', 'Close cinematic scene (Esc)');
    closeBtn.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>`;
    closeBtn.addEventListener('click', () => this.exitScene());

    controls.append(skipBtn, closeBtn);
    header.append(meta, controls);
    card.append(header);

    // Hero title and narrative intro
    const hero = document.createElement('div');
    hero.className = 'cinematic-hero';

    const title = document.createElement('h2');
    title.className = 'cinematic-title';
    title.textContent = content.title;

    const subtitle = document.createElement('p');
    subtitle.className = 'cinematic-subtitle';
    subtitle.textContent = content.subtitle;

    hero.append(title, subtitle);

    if (content.quote) {
      const quote = document.createElement('blockquote');
      quote.className = 'cinematic-quote';
      quote.textContent = content.quote;
      hero.append(quote);
    }

    if (content.lead) {
      const lead = document.createElement('p');
      lead.className = 'cinematic-lead';
      lead.textContent = content.lead;
      hero.append(lead);
    }

    card.append(hero);

    // Section-specific interactive body
    const body = document.createElement('div');
    body.className = 'cinematic-body';

    switch (sectionId) {
      case 'about':
        this.renderAboutBody(body, content);
        break;
      case 'skills':
        this.renderSkillsBody(body, content);
        break;
      case 'experience':
        this.renderExperienceBody(body, content);
        break;
      case 'projects':
        this.renderProjectsBody(body, content);
        break;
      case 'process':
        this.renderProcessBody(body, content);
        break;
      case 'garage':
      case 'bedroom':
      case 'bathroom':
        this.renderDisciplinesBody(body, content);
        break;
      case 'contact':
        this.renderContactBody(body, content);
        break;
      default:
        this.renderDefaultBody(body, content);
        break;
    }

    card.append(body);

    // Footer with keyboard hints and close action
    const footer = document.createElement('div');
    footer.className = 'cinematic-footer';

    const hint = document.createElement('div');
    hint.className = 'cinematic-hint';
    hint.innerHTML = `<span class="cinematic-key">ESC</span> to resume walking <span class="hint-sep">·</span> Explore at your own pace`;

    const doneBtn = document.createElement('button');
    doneBtn.className = 'cinematic-done-btn';
    doneBtn.type = 'button';
    doneBtn.textContent = 'Continue Exploring →';
    doneBtn.addEventListener('click', () => this.exitScene());

    footer.append(hint, doneBtn);
    card.append(footer);
  }

  renderAboutBody(container, content) {
    if (content.body) {
      const p = document.createElement('p');
      p.className = 'cinematic-text';
      p.textContent = content.body;
      container.append(p);
    }

    if (content.disciplines) {
      const grid = document.createElement('div');
      grid.className = 'cinematic-grid-cards';
      for (const disc of content.disciplines) {
        const item = document.createElement('div');
        item.className = 'cinematic-subcard';
        const h4 = document.createElement('h4');
        h4.textContent = disc.title;
        const desc = document.createElement('p');
        desc.textContent = disc.desc;
        item.append(h4, desc);
        grid.append(item);
      }
      container.append(grid);
    }

    if (content.tags) {
      const tags = document.createElement('div');
      tags.className = 'cinematic-tags';
      for (const t of content.tags) {
        const span = document.createElement('span');
        span.className = 'cinematic-tag';
        span.textContent = t;
        tags.append(span);
      }
      container.append(tags);
    }
  }

  renderDisciplinesBody(container, content) {
    if (content.body) {
      const p = document.createElement('p');
      p.className = 'cinematic-text';
      p.textContent = content.body;
      container.append(p);
    }

    if (content.disciplines && content.disciplines.length) {
      const grid = document.createElement('div');
      grid.className = 'cinematic-grid-cards';
      for (const disc of content.disciplines) {
        const item = document.createElement('div');
        item.className = 'cinematic-subcard';
        const h4 = document.createElement('h4');
        h4.textContent = disc.title;
        const desc = document.createElement('p');
        desc.textContent = disc.desc;
        item.append(h4, desc);
        grid.append(item);
      }
      container.append(grid);
    }

    if (content.tags && content.tags.length) {
      const tags = document.createElement('div');
      tags.className = 'cinematic-tags';
      for (const t of content.tags) {
        const span = document.createElement('span');
        span.className = 'cinematic-tag';
        span.textContent = t;
        tags.append(span);
      }
      container.append(tags);
    }
  }

  renderDefaultBody(container, content) {
    if (content.disciplines) {
      this.renderDisciplinesBody(container, content);
    } else if (content.items) {
      this.renderProjectsBody(container, content);
    } else if (content.categories) {
      this.renderSkillsBody(container, content);
    }
  }

  renderSkillsBody(container, content) {
    if (content.categories) {
      const catList = document.createElement('div');
      catList.className = 'cinematic-skill-categories';

      for (const cat of content.categories) {
        const catBox = document.createElement('div');
        catBox.className = 'cinematic-skill-box';

        const catTitle = document.createElement('div');
        catTitle.className = 'cinematic-skill-cat-title';
        catTitle.textContent = cat.name;

        const badgeRow = document.createElement('div');
        badgeRow.className = 'cinematic-badge-row';
        for (const item of cat.items) {
          const badge = document.createElement('span');
          badge.className = 'cinematic-tech-badge';
          badge.textContent = item;
          badgeRow.append(badge);
        }

        catBox.append(catTitle, badgeRow);
        catList.append(catBox);
      }
      container.append(catList);
    }
  }

  renderExperienceBody(container, content) {
    if (content.milestones) {
      const timeline = document.createElement('div');
      timeline.className = 'cinematic-timeline';

      for (const m of content.milestones) {
        const item = document.createElement('div');
        item.className = 'cinematic-timeline-node';

        const period = document.createElement('span');
        period.className = 'timeline-period';
        period.textContent = m.period;

        const header = document.createElement('div');
        header.className = 'timeline-header';

        const role = document.createElement('strong');
        role.className = 'timeline-role';
        role.textContent = m.role;

        const org = document.createElement('span');
        org.className = 'timeline-org';
        org.textContent = m.org;

        header.append(role, org);

        const desc = document.createElement('p');
        desc.className = 'timeline-desc';
        desc.textContent = m.desc;

        item.append(period, header, desc);
        timeline.append(item);
      }
      container.append(timeline);
    }
  }

  setProjectIndex(index) {
    this.activeProjectIndex = index;
    if (this._updateProjectCard) {
      this._updateProjectCard();
    }
  }

  renderProjectsBody(container, content) {
    const projects = content.items || [];
    if (!projects.length) return;

    const carouselWrap = document.createElement('div');
    carouselWrap.className = 'cinematic-project-carousel';

    const cardContainer = document.createElement('div');
    cardContainer.className = 'cinematic-project-card-container';

    // Renders the single active project
    const updateCard = () => {
      const p = projects[this.activeProjectIndex];
      cardContainer.innerHTML = '';

      const article = document.createElement('article');
      article.className = 'cinematic-project-card';

      const top = document.createElement('div');
      top.className = 'project-top';

      const badge = document.createElement('span');
      badge.className = 'project-badge';
      badge.textContent = p.badge || p.category;

      const pagination = document.createElement('span');
      pagination.className = 'project-pagination';
      pagination.textContent = `${String(this.activeProjectIndex + 1).padStart(2, '0')} / ${String(projects.length).padStart(2, '0')}`;

      top.append(badge, pagination);

      const title = document.createElement('h3');
      title.className = 'project-card-title';
      title.textContent = p.title;

      const cat = document.createElement('div');
      cat.className = 'project-card-category';
      cat.textContent = p.category;

      // Section: Challenge
      const challengeBox = document.createElement('div');
      challengeBox.className = 'project-section-box';
      challengeBox.innerHTML = `<strong>The Challenge</strong><p>${p.challenge}</p>`;

      // Section: Engineering Architecture
      const engBox = document.createElement('div');
      engBox.className = 'project-section-box';
      engBox.innerHTML = `<strong>Engineering Architecture</strong><p>${p.engineering}</p>`;

      // Tech badges
      const stackRow = document.createElement('div');
      stackRow.className = 'project-stack-row';
      for (const t of p.stack) {
        const s = document.createElement('span');
        s.className = 'stack-chip';
        s.textContent = t;
        stackRow.append(s);
      }

      // Feature highlights
      const featList = document.createElement('ul');
      featList.className = 'project-feature-list';
      for (const f of p.features) {
        const li = document.createElement('li');
        li.textContent = f;
        featList.append(li);
      }

      // Action links (Verified GitHub source & live demo if verified)
      const actions = document.createElement('div');
      actions.className = 'project-actions';

      const ghLink = document.createElement('a');
      ghLink.className = 'project-btn project-btn-primary';
      ghLink.href = p.github;
      ghLink.target = '_blank';
      ghLink.rel = 'noreferrer';
      ghLink.innerHTML = `<svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor"><path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z"/></svg> View Repository`;
      actions.append(ghLink);

      if (p.demo) {
        const demoLink = document.createElement('a');
        demoLink.className = 'project-btn project-btn-secondary';
        demoLink.href = p.demo;
        demoLink.target = '_blank';
        demoLink.rel = 'noreferrer';
        demoLink.innerHTML = `Live Demo ↗`;
        actions.append(demoLink);
      }

      article.append(top, title, cat, challengeBox, engBox, stackRow, featList, actions);
      cardContainer.append(article);
    };

    this._updateProjectCard = updateCard;
    updateCard();

    // Nav controls for projects carousel
    const navRow = document.createElement('div');
    navRow.className = 'project-carousel-nav';

    const prevBtn = document.createElement('button');
    prevBtn.className = 'carousel-nav-btn';
    prevBtn.type = 'button';
    prevBtn.innerHTML = `← Previous`;
    prevBtn.addEventListener('click', () => {
      this.activeProjectIndex = (this.activeProjectIndex - 1 + projects.length) % projects.length;
      updateCard();
    });

    const nextBtn = document.createElement('button');
    nextBtn.className = 'carousel-nav-btn';
    nextBtn.type = 'button';
    nextBtn.innerHTML = `Next Project →`;
    nextBtn.addEventListener('click', () => {
      this.activeProjectIndex = (this.activeProjectIndex + 1) % projects.length;
      updateCard();
    });

    navRow.append(prevBtn, nextBtn);
    carouselWrap.append(cardContainer, navRow);
    container.append(carouselWrap);
  }

  renderProcessBody(container, content) {
    if (content.stages) {
      const stepsGrid = document.createElement('div');
      stepsGrid.className = 'cinematic-process-grid';

      for (const st of content.stages) {
        const box = document.createElement('div');
        box.className = 'process-card';

        const head = document.createElement('div');
        head.className = 'process-card-head';

        const num = document.createElement('span');
        num.className = 'process-num';
        num.textContent = st.step;

        const badge = document.createElement('span');
        badge.className = 'process-badge';
        badge.textContent = st.badge;

        head.append(num, badge);

        const title = document.createElement('h4');
        title.className = 'process-title';
        title.textContent = st.name;

        const desc = document.createElement('p');
        desc.className = 'process-desc';
        desc.textContent = st.desc;

        box.append(head, title, desc);
        stepsGrid.append(box);
      }
      container.append(stepsGrid);
    }
  }

  renderContactBody(container, content) {
    const box = document.createElement('div');
    box.className = 'cinematic-contact-box';

    const loc = document.createElement('p');
    loc.className = 'cinematic-location';
    loc.innerHTML = `📍 <strong>${content.location}</strong>`;
    box.append(loc);

    const linkGrid = document.createElement('div');
    linkGrid.className = 'cinematic-contact-links';

    for (const link of content.links) {
      const a = document.createElement('a');
      a.className = link.primary ? 'contact-card-btn primary' : 'contact-card-btn';
      a.href = link.href;
      if (!link.href.startsWith('mailto:')) {
        a.target = '_blank';
        a.rel = 'noreferrer';
      }
      a.innerHTML = `<strong>${link.label}</strong><span>${link.detail}</span>`;
      linkGrid.append(a);
    }
    box.append(linkGrid);

    if (content.note) {
      const note = document.createElement('p');
      note.className = 'cinematic-contact-note';
      note.textContent = content.note;
      box.append(note);
    }

    container.append(box);
  }
}
