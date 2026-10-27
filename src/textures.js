import * as THREE from 'three';

// Procedural Canvas Texture Generator for Stylized Cartoon Portfolio
export function createSurfaceTexture(kind, width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  let seed = kind === 'wood' ? 17 : kind === 'stone' ? 29 : kind === 'fabric' ? 43 : kind === 'tiles' ? 57 : kind === 'shingles' ? 71 : 93;
  const rand = () => {
    seed = (seed * 16807) % 2147483647;
    return (seed - 1) / 2147483646;
  };

  if (kind === 'wood') {
    // Warm natural honey-oak grain
    ctx.fillStyle = '#b78058';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 70; i += 1) {
      const y = rand() * height;
      const alpha = 0.04 + rand() * 0.08;
      ctx.strokeStyle = rand() > 0.4 ? `rgba(95, 54, 28, ${alpha})` : `rgba(224, 175, 126, ${alpha * 0.8})`;
      ctx.lineWidth = 1 + rand() * 2.5;
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.bezierCurveTo(width * 0.35, y + (rand() - 0.5) * 12, width * 0.65, y + (rand() - 0.5) * 12, width, y + (rand() - 0.5) * 6);
      ctx.stroke();
    }
    // Subtle wood planks lines
    ctx.strokeStyle = 'rgba(70, 36, 16, 0.18)';
    ctx.lineWidth = 2;
    for (let y = 0; y <= height; y += height / 4) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();
    }
  } else if (kind === 'stone') {
    // Stylized rounded cobblestones / pavers
    ctx.fillStyle = '#ded8c8';
    ctx.fillRect(0, 0, width, height);
    // Mortar lines
    ctx.strokeStyle = 'rgba(110, 102, 88, 0.35)';
    ctx.lineWidth = 3;
    const rows = 6;
    const cols = 6;
    const cellW = width / cols;
    const cellH = height / rows;
    for (let r = 0; r < rows; r += 1) {
      const offset = (r % 2) * (cellW * 0.5);
      for (let c = -1; c <= cols; c += 1) {
        const x = c * cellW + offset + 4;
        const y = r * cellH + 4;
        const w = cellW - 8;
        const h = cellH - 8;
        const tone = 200 + Math.floor(rand() * 40);
        ctx.fillStyle = `rgb(${tone}, ${tone - 4}, ${tone - 14})`;
        ctx.beginPath();
        ctx.roundRect(x, y, w, h, 8);
        ctx.fill();
        ctx.stroke();
      }
    }
  } else if (kind === 'plaster') {
    // Warm ivory wall plaster with subtle stippling
    ctx.fillStyle = '#faf5eb';
    ctx.fillRect(0, 0, width, height);
    for (let i = 0; i < 280; i += 1) {
      const alpha = 0.02 + rand() * 0.035;
      ctx.fillStyle = rand() > 0.5 ? `rgba(180, 165, 145, ${alpha})` : `rgba(255, 255, 255, ${alpha * 1.5})`;
      const size = 1.5 + rand() * 3.5;
      ctx.fillRect(rand() * width, rand() * height, size, size);
    }
  } else if (kind === 'fabric') {
    // Cozy cross-stitched linen / sofa fabric
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = 'rgba(100, 90, 80, 0.04)';
    ctx.lineWidth = 1;
    for (let i = 0; i < width; i += 6) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, height); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(width, i); ctx.stroke();
    }
  } else if (kind === 'tiles') {
    // Terracotta patio tiles
    ctx.fillStyle = '#c56b50';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#a14d36';
    ctx.lineWidth = 3;
    const sz = width / 4;
    for (let x = 0; x <= width; x += sz) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += sz) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  } else if (kind === 'bathroomTiles') {
    // Elegant bright white/cyan ceramic grid tiles
    ctx.fillStyle = '#f0f7f8';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#c4dadc';
    ctx.lineWidth = 2;
    const sz = width / 8;
    for (let x = 0; x <= width; x += sz) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
    }
    for (let y = 0; y <= height; y += sz) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
    }
  } else if (kind === 'shingles') {
    // Stylized scalloped roof shingles
    ctx.fillStyle = '#426b54';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#2d4b3b';
    ctx.lineWidth = 2.5;
    const rows = 8;
    const rH = height / rows;
    for (let r = 0; r < rows; r += 1) {
      const y = r * rH;
      const cols = 6;
      const cW = width / cols;
      const offset = (r % 2) * (cW * 0.5);
      for (let c = -1; c <= cols; c += 1) {
        const x = c * cW + offset;
        ctx.fillStyle = r % 2 === 0 ? '#49755d' : '#3d634e';
        ctx.beginPath();
        ctx.arc(x + cW * 0.5, y + rH, cW * 0.5, Math.PI, 0, false);
        ctx.fill();
        ctx.stroke();
      }
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.anisotropy = 4;
  return texture;
}

export function createSignTexture(title, subtitle, accentColor, width = 512, height = 340) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Outer frame & card background
  ctx.fillStyle = '#fffdf7';
  ctx.fillRect(0, 0, width, height);

  // Border & header bar
  const hex = typeof accentColor === 'number' ? `#${accentColor.toString(16).padStart(6, '0')}` : accentColor;
  ctx.fillStyle = hex;
  ctx.beginPath();
  ctx.roundRect(16, 16, width - 32, 64, [16, 16, 4, 4]);
  ctx.fill();

  // Subtitle / category
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 20px "DM Sans", sans-serif';
  ctx.letterSpacing = '1px';
  ctx.textAlign = 'left';
  ctx.fillText(subtitle.toUpperCase(), 36, 56);

  // Decorative inner background
  ctx.fillStyle = '#fdfbf5';
  ctx.beginPath();
  ctx.roundRect(16, 82, width - 32, height - 98, [4, 4, 16, 16]);
  ctx.fill();
  ctx.strokeStyle = 'rgba(70, 80, 75, 0.12)';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Title
  ctx.fillStyle = '#223830';
  ctx.font = '800 32px "Nunito", sans-serif';
  const words = title.split(' ');
  let line = '';
  let y = 140;
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > width - 72 && line) {
      ctx.fillText(line, 36, y);
      y += 42;
      line = word;
    } else {
      line = test;
    }
  }
  if (line) ctx.fillText(line, 36, y);

  // Footer prompt indicator
  ctx.fillStyle = 'rgba(75, 95, 85, 0.7)';
  ctx.font = '600 16px "DM Sans", sans-serif';
  ctx.fillText('Press E or click to explore details', 36, height - 36);

  // Little button badge
  ctx.fillStyle = hex;
  ctx.beginPath();
  ctx.roundRect(width - 92, height - 52, 60, 26, 13);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.font = '800 13px "DM Sans", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('VIEW', width - 62, height - 34);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  texture.anisotropy = 4;
  return texture;
}

export function createPaintingTexture(theme, width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (theme === 'landscape') {
    // Sky
    ctx.fillStyle = '#bfe3d8';
    ctx.fillRect(0, 0, width, height);
    // Sun
    ctx.fillStyle = '#f7d070';
    ctx.beginPath();
    ctx.arc(width * 0.75, height * 0.35, 34, 0, Math.PI * 2);
    ctx.fill();
    // Rolling hills
    ctx.fillStyle = '#659b6c';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.65);
    ctx.bezierCurveTo(width * 0.4, height * 0.5, width * 0.7, height * 0.75, width, height * 0.55);
    ctx.lineTo(width, height);
    ctx.fill();
    // Foreground hill
    ctx.fillStyle = '#4c7c52';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(0, height * 0.8);
    ctx.bezierCurveTo(width * 0.3, height * 0.7, width * 0.6, height * 0.85, width, height * 0.7);
    ctx.lineTo(width, height);
    ctx.fill();
  } else if (theme === 'geometric') {
    ctx.fillStyle = '#fdf8ef';
    ctx.fillRect(0, 0, width, height);
    ctx.fillStyle = '#e8654d';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 60, 0, Math.PI);
    ctx.fill();
    ctx.fillStyle = '#7ba8b8';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.5, 40, Math.PI, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#f0c458';
    ctx.fillRect(width * 0.3, height * 0.7, width * 0.4, 12);
  } else {
    // Cozy coffee / still life
    ctx.fillStyle = '#f3ebe0';
    ctx.fillRect(0, 0, width, height);
    // Table
    ctx.fillStyle = '#9e6b47';
    ctx.fillRect(0, height * 0.68, width, height * 0.32);
    // Mug
    ctx.fillStyle = '#e8654d';
    ctx.beginPath();
    ctx.roundRect(width * 0.36, height * 0.46, width * 0.28, height * 0.26, [4, 4, 12, 12]);
    ctx.fill();
    // Mug handle
    ctx.strokeStyle = '#e8654d';
    ctx.lineWidth = 7;
    ctx.beginPath();
    ctx.arc(width * 0.65, height * 0.58, 16, -Math.PI * 0.4, Math.PI * 0.4);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCarpetTexture(theme = 'persian', width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (theme === 'persian') {
    // Rich ruby/crimson Persian rug with ivory and navy medallion
    ctx.fillStyle = '#8c2626';
    ctx.fillRect(0, 0, width, height);

    // Outer and inner decorative borders
    ctx.strokeStyle = '#e6cb8b';
    ctx.lineWidth = 14;
    ctx.strokeRect(16, 16, width - 32, height - 32);

    ctx.strokeStyle = '#1d3557';
    ctx.lineWidth = 8;
    ctx.strokeRect(32, 32, width - 64, height - 64);

    ctx.strokeStyle = '#e6cb8b';
    ctx.lineWidth = 4;
    ctx.strokeRect(44, 44, width - 88, height - 88);

    // Four corner floral motifs
    const corners = [
      [56, 56],
      [width - 56, 56],
      [56, height - 56],
      [width - 56, height - 56],
    ];
    for (const [cx, cy] of corners) {
      ctx.fillStyle = '#1d3557';
      ctx.beginPath();
      ctx.arc(cx, cy, 32, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#e6cb8b';
      ctx.beginPath();
      ctx.arc(cx, cy, 18, 0, Math.PI * 2);
      ctx.fill();
    }

    // Central Ornate Medallion
    const centerX = width * 0.5;
    const centerY = height * 0.5;

    ctx.fillStyle = '#1d3557';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 110, 80, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#e6cb8b';
    ctx.lineWidth = 6;
    ctx.stroke();

    ctx.fillStyle = '#f7eed2';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 75, 52, 0, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#8c2626';
    ctx.beginPath();
    ctx.ellipse(centerX, centerY, 42, 28, 0, 0, Math.PI * 2);
    ctx.fill();

    // Fringe on top & bottom edges
    ctx.strokeStyle = '#fbf8f0';
    ctx.lineWidth = 2;
    for (let x = 12; x < width - 12; x += 6) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, 10);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(x, height - 10);
      ctx.lineTo(x, height);
      ctx.stroke();
    }
  } else {
    // Modern geometric Bauhaus rug (sand, terracotta, sage)
    ctx.fillStyle = '#eee4cf';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#d96a4a';
    ctx.beginPath();
    ctx.arc(width * 0.35, height * 0.4, 120, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#517a6a';
    ctx.fillRect(width * 0.45, height * 0.2, 140, 220);

    ctx.fillStyle = '#e5ab51';
    ctx.beginPath();
    ctx.arc(width * 0.65, height * 0.7, 95, 0, Math.PI);
    ctx.fill();

    ctx.strokeStyle = '#2b443a';
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.moveTo(width * 0.1, height * 0.85);
    ctx.lineTo(width * 0.9, height * 0.85);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createScreenCodeTexture(width = 512, height = 320) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Dark IDE editor background
  ctx.fillStyle = '#181e24';
  ctx.fillRect(0, 0, width, height);

  // Top tab bar
  ctx.fillStyle = '#12161a';
  ctx.fillRect(0, 0, width, 30);
  ctx.fillStyle = '#222931';
  ctx.fillRect(10, 4, 150, 26);
  ctx.fillStyle = '#4cd3a8';
  ctx.font = '700 12px monospace';
  ctx.fillText('• main.ts', 24, 21);

  // Left sidebar & line numbers gutter
  ctx.fillStyle = '#151a1e';
  ctx.fillRect(0, 30, 42, height - 30);
  ctx.fillStyle = '#4f6272';
  ctx.font = '11px monospace';
  for (let i = 1; i <= 14; i += 1) {
    ctx.fillText(String(i).padStart(2, ' '), 12, 38 + i * 18);
  }

  // Code syntax tokens
  const lines = [
    { text: 'import { World, Physics } from "@mansion/engine";', color: '#c586c0' },
    { text: 'export class VickyEstate extends World {', color: '#4ec9b0' },
    { text: '  private architect = new ArchitectEngineer();', color: '#9cdcfe' },
    { text: '  public async initAutonomousWorld() {', color: '#dcdcaa' },
    { text: '    const agents = await this.spawnNPCs();', color: '#ce9178' },
    { text: '    this.physics.enableRapierWASM();', color: '#4ec9b0' },
    { text: '    this.bmwMSeries.igniteEngine();', color: '#9cdcfe' },
    { text: '    return { status: "200 OK", fps: 60 };', color: '#dcdcaa' },
    { text: '  }', color: '#d4d4d4' },
    { text: '}', color: '#d4d4d4' },
  ];

  let y = 56;
  for (const line of lines) {
    ctx.fillStyle = line.color;
    ctx.font = '13px "Fira Code", monospace';
    ctx.fillText(line.text, 54, y);
    y += 18;
  }

  // Bottom terminal mini-status bar
  ctx.fillStyle = '#0f1316';
  ctx.fillRect(42, height - 34, width - 42, 34);
  ctx.fillStyle = '#38d39f';
  ctx.font = '600 11px monospace';
  ctx.fillText('✓ 213/213 tests passed [vite v8.3.4 building clean]', 54, height - 14);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createTerminalTexture(width = 512, height = 320) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#0f141c';
  ctx.fillRect(0, 0, width, height);

  // Terminal header
  ctx.fillStyle = '#1c2430';
  ctx.fillRect(0, 0, width, 26);
  ctx.fillStyle = '#ff5f56';
  ctx.beginPath(); ctx.arc(16, 13, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffbd2e';
  ctx.beginPath(); ctx.arc(32, 13, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#27c93f';
  ctx.beginPath(); ctx.arc(48, 13, 5, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#8ea1b4';
  ctx.font = '600 11px monospace';
  ctx.fillText('vicky@mansion-core: ~/projects/portfolio', 70, 17);

  // Terminal logs
  const logs = [
    { text: '$ git status -s', color: '#8ea1b4' },
    { text: 'M src/worldInteractions.js [Elevation guard active]', color: '#56d364' },
    { text: 'M src/zenGarden.js [Hexagonal bench aligned]', color: '#56d364' },
    { text: 'M src/poolArea.js [Recessed basin verified]', color: '#56d364' },
    { text: '$ node test/verifyGeometry.js', color: '#8ea1b4' },
    { text: '✓ 111 of 111 geometry tests passed', color: '#58a6ff' },
    { text: '$ node test/verifyInteractions.js', color: '#8ea1b4' },
    { text: '✓ 213 of 213 interaction tests passed', color: '#58a6ff' },
    { text: '$ pnpm run dev --host', color: '#8ea1b4' },
    { text: '  VITE v8.3.4 ready in 457 ms (60 FPS)', color: '#38d39f' },
    { text: '  ➜ Local: http://localhost:4173/', color: '#79c0ff' },
    { text: 'vicky@mansion-core:~$ █', color: '#56d364' },
  ];

  let y = 50;
  for (const log of logs) {
    ctx.fillStyle = log.color;
    ctx.font = '12px "Fira Code", monospace';
    ctx.fillText(log.text, 20, y);
    y += 21;
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createCadScreenTexture(width = 512, height = 320) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = '#14181f';
  ctx.fillRect(0, 0, width, height);

  // Grid lines
  ctx.strokeStyle = 'rgba(78, 201, 176, 0.12)';
  ctx.lineWidth = 1;
  for (let x = 0; x < width; x += 24) {
    ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, height); ctx.stroke();
  }
  for (let y = 0; y < height; y += 24) {
    ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(width, y); ctx.stroke();
  }

  // 3D Mansion Wireframe CAD Isometric Render
  ctx.strokeStyle = '#4ec9b0';
  ctx.lineWidth = 2;
  const cx = width * 0.5;
  const cy = height * 0.5;
  ctx.strokeRect(cx - 140, cy - 60, 280, 120);
  ctx.strokeRect(cx - 100, cy - 100, 200, 40);
  ctx.beginPath();
  ctx.moveTo(cx - 100, cy - 100);
  ctx.lineTo(cx, cy - 130);
  ctx.lineTo(cx + 100, cy - 100);
  ctx.stroke();

  // Coordinates & telemetry HUD
  ctx.fillStyle = '#61afef';
  ctx.font = '600 11px monospace';
  ctx.fillText('ESTATE 3D ARCHITECTURAL METRICS', 24, 28);
  ctx.fillStyle = '#98c379';
  ctx.fillText('FOOTPRINT: 42.5m x 22.2m | ELEV: 10.4m', 24, 46);
  ctx.fillStyle = '#e5c07b';
  ctx.fillText('RAPID DYNAMICS: 60 FPS | 82 COLLIDERS', 24, height - 16);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWhiteboardTexture(width = 512, height = 280) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Whiteboard glossy melamine surface
  ctx.fillStyle = '#fafbfa';
  ctx.fillRect(0, 0, width, height);

  // Architecture Diagram Nodes
  const drawNode = (x, y, w, h, label, strokeColor, fillColor) => {
    ctx.fillStyle = fillColor;
    ctx.strokeStyle = strokeColor;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.roundRect(x, y, w, h, 8);
    ctx.fill();
    ctx.stroke();
    ctx.fillStyle = strokeColor;
    ctx.font = '800 12px "DM Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(label, x + w * 0.5, y + h * 0.55);
  };

  drawNode(30, 40, 110, 48, 'Client UI / App', '#2b5876', '#eaf2f8');
  drawNode(190, 40, 130, 48, 'Agentic Orchestrator', '#8e24aa', '#f3e5f5');
  drawNode(370, 40, 110, 48, 'Rapier 3D Physics', '#d84315', '#fbe9e7');
  drawNode(190, 140, 130, 52, 'Three.js / WebGL', '#2e7d32', '#e8f5e9');

  // Connecting arrows
  ctx.strokeStyle = '#455a64';
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(140, 64);
  ctx.lineTo(190, 64);
  ctx.moveTo(320, 64);
  ctx.lineTo(370, 64);
  ctx.moveTo(255, 88);
  ctx.lineTo(255, 140);
  ctx.stroke();

  // Sticky notes in corner
  const drawSticky = (x, y, text, color) => {
    ctx.fillStyle = color;
    ctx.fillRect(x, y, 62, 58);
    ctx.strokeStyle = 'rgba(0,0,0,0.12)';
    ctx.strokeRect(x, y, 62, 58);
    ctx.fillStyle = '#263238';
    ctx.font = '600 10px sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText(text, x + 6, y + 20);
  };

  drawSticky(30, 170, 'Phase 1 ✓', '#fff59d');
  drawSticky(100, 170, 'Mansion ✓', '#ffcc80');
  drawSticky(380, 170, 'Deploy !', '#a7ffeb');

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMusicTrackTexture(width = 512, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#1c1f24';
  ctx.fillRect(0, 0, width, height);

  const colors = ['#e74c3c', '#3498db', '#2ecc71', '#f39c12'];
  const names = ['Lead Synth', 'Bassline', 'Kick & Snare', 'Atmosphere'];

  for (let i = 0; i < 4; i += 1) {
    const y = 20 + i * 56;
    ctx.fillStyle = '#252a30';
    ctx.fillRect(10, y, width - 20, 48);

    ctx.fillStyle = colors[i];
    ctx.font = '700 11px sans-serif';
    ctx.fillText(names[i], 20, y + 18);

    // Audio waveform simulation
    ctx.strokeStyle = colors[i];
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(110, y + 24);
    for (let x = 110; x < width - 30; x += 4) {
      const h = Math.sin((x + i * 20) * 0.15) * (8 + (i % 2) * 8);
      ctx.lineTo(x, y + 24 + h);
    }
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createWallArtTexture(theme = 'modern', width = 512, height = 360) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (theme === 'modern') {
    // Warm abstract composition with soft arches and terracotta circles
    ctx.fillStyle = '#f8f4ec';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#c75941';
    ctx.beginPath();
    ctx.arc(width * 0.35, height * 0.45, 110, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#476f5d';
    ctx.beginPath();
    ctx.roundRect(width * 0.45, height * 0.2, 130, 200, [65, 65, 0, 0]);
    ctx.fill();

    ctx.fillStyle = '#e8b857';
    ctx.beginPath();
    ctx.ellipse(width * 0.65, height * 0.72, 75, 45, -0.2, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // Minimalist architectural landscape with sun and sea
    ctx.fillStyle = '#e6edf0';
    ctx.fillRect(0, 0, width, height);

    ctx.fillStyle = '#ea8468';
    ctx.beginPath();
    ctx.arc(width * 0.5, height * 0.4, 75, 0, Math.PI * 2);
    ctx.fill();

    ctx.fillStyle = '#315560';
    ctx.beginPath();
    ctx.moveTo(0, height);
    ctx.lineTo(width, height);
    ctx.lineTo(width, height * 0.58);
    ctx.bezierCurveTo(width * 0.6, height * 0.55, width * 0.3, height * 0.65, 0, height * 0.6);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates luxury swimming pool mosaic glass tile texture
 */
export function createPoolMosaicTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Grout background
  ctx.fillStyle = '#b2ebf2';
  ctx.fillRect(0, 0, width, height);

  const gridSize = 16;
  const tileSize = width / gridSize;
  const gap = 3;

  const blues = ['#00b4d8', '#0096c7', '#0077b6', '#48cae4', '#90e0ef'];
  for (let r = 0; r < gridSize; r += 1) {
    for (let c = 0; c < gridSize; c += 1) {
      const idx = (r * 13 + c * 7 + (r ^ c)) % blues.length;
      ctx.fillStyle = blues[idx];
      ctx.fillRect(c * tileSize + gap, r * tileSize + gap, tileSize - gap * 2, tileSize - gap * 2);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 4);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates shimmering caustic ripple texture for luxury pool water
 */
export function createWaterRipplesTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  // Deep crystal turquoise base
  ctx.fillStyle = '#00acc1';
  ctx.fillRect(0, 0, width, height);

  // Soft light caustic webs
  ctx.strokeStyle = 'rgba(224, 247, 250, 0.45)';
  ctx.lineWidth = 3.5;
  for (let i = 0; i < 45; i += 1) {
    const cx = (i * 73) % width;
    const cy = (i * 91) % height;
    const r = 25 + (i % 30);
    ctx.beginPath();
    ctx.ellipse(cx, cy, r, r * 0.65, (i * 0.4), 0, Math.PI * 2);
    ctx.stroke();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(3, 3);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates dark asphalt driveway and parking court surface texture
 */
export function createAsphaltTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#26292e';
  ctx.fillRect(0, 0, width, height);

  // Fine aggregate speckles
  for (let i = 0; i < 2500; i += 1) {
    const x = Math.random() * width;
    const y = Math.random() * height;
    const bright = 40 + Math.random() * 35;
    ctx.fillStyle = `rgb(${bright}, ${bright + 2}, ${bright + 4})`;
    ctx.fillRect(x, y, 1.5, 1.5);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(6, 6);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates radial cobblestone paver pattern for central fountain roundabout
 */
export function createCobbleCircleTexture(width = 512, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#d7ceb9';
  ctx.fillRect(0, 0, width, height);

  const cx = width * 0.5;
  const cy = height * 0.5;

  ctx.strokeStyle = '#9e9484';
  ctx.lineWidth = 2.5;

  // Concentric stone rings
  const ringStep = 28;
  for (let r = ringStep; r < width * 0.5; r += ringStep) {
    ctx.beginPath();
    ctx.arc(cx, cy, r, 0, Math.PI * 2);
    ctx.stroke();

    const stonesInRing = Math.floor((Math.PI * 2 * r) / 22);
    for (let s = 0; s < stonesInRing; s += 1) {
      const angle = (s / stonesInRing) * Math.PI * 2;
      ctx.beginPath();
      ctx.moveTo(cx + Math.cos(angle) * (r - ringStep), cy + Math.sin(angle) * (r - ringStep));
      ctx.lineTo(cx + Math.cos(angle) * r, cy + Math.sin(angle) * r);
      ctx.stroke();
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates luxury resort striped awning texture for pool umbrellas & cabana accents
 */
export function createStripedAwningTexture(stripeColor = '#2b5876', creamColor = '#fcf8f0', width = 256, height = 256) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  ctx.fillStyle = creamColor;
  ctx.fillRect(0, 0, width, height);
  ctx.fillStyle = stripeColor;
  const stripeW = 32;
  for (let x = 0; x < width; x += stripeW * 2) {
    ctx.fillRect(x, 0, stripeW, height);
  }
  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(4, 1);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Creates luxury entrance monument plaque texture matching Vicky's World Map
 */
export function createMonumentSignTexture(variant = 'main', width = 1024, height = 512) {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');

  if (variant === 'main') {
    // Rich dark slate / bronze luxury panel
    const bgGrad = ctx.createLinearGradient(0, 0, 0, height);
    bgGrad.addColorStop(0, '#1a222a');
    bgGrad.addColorStop(1, '#0e141a');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Double Gold brass borders
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 10;
    ctx.strokeRect(16, 16, width - 32, height - 32);
    ctx.lineWidth = 3;
    ctx.strokeRect(28, 28, width - 56, height - 56);

    // Decorative corner rosette / rivets
    ctx.fillStyle = '#f5d76e';
    for (const [rx, ry] of [[40, 40], [width - 40, 40], [40, height - 40], [width - 40, height - 40]]) {
      ctx.beginPath();
      ctx.arc(rx, ry, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#b89222';
      ctx.beginPath();
      ctx.arc(rx, ry, 3.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#f5d76e';
    }

    // Top subtle crest: 3 Gold Stars
    for (let i = -1; i <= 1; i++) {
      ctx.beginPath();
      ctx.arc(width * 0.5 + i * 36, height * 0.22, i === 0 ? 6 : 4.5, 0, Math.PI * 2);
      ctx.fill();
    }

    // Main title: VICKY'S WORLD
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(212, 175, 55, 0.45)';
    ctx.shadowBlur = 18;
    ctx.fillStyle = '#fce280';
    ctx.font = '900 68px "Nunito", "Montserrat", sans-serif';
    ctx.fillText("VICKY'S WORLD", width * 0.5, height * 0.48);
    ctx.shadowBlur = 0;

    // Decorative divider line with center diamond
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 3.5;
    ctx.beginPath();
    ctx.moveTo(width * 0.16, height * 0.62);
    ctx.lineTo(width * 0.84, height * 0.62);
    ctx.stroke();

    // Center Gold Diamond
    ctx.fillStyle = '#fce280';
    ctx.beginPath();
    ctx.moveTo(width * 0.5, height * 0.62 - 10);
    ctx.lineTo(width * 0.5 + 12, height * 0.62);
    ctx.lineTo(width * 0.5, height * 0.62 + 10);
    ctx.lineTo(width * 0.5 - 12, height * 0.62);
    ctx.closePath();
    ctx.fill();

    // Subtitle: DEVELOPER • CREATOR • EXPLORER
    ctx.fillStyle = '#d5e2eb';
    ctx.font = '700 28px "DM Sans", sans-serif';
    ctx.letterSpacing = '5px';
    ctx.fillText('DEVELOPER   •   CREATOR   •   EXPLORER', width * 0.5, height * 0.80);
  } else if (variant === 'welcome') {
    // Luxury welcome plaque
    const bgGrad = ctx.createLinearGradient(0, 0, width, height);
    bgGrad.addColorStop(0, '#1c252d');
    bgGrad.addColorStop(1, '#11171d');
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, width, height);

    // Gold frame
    ctx.strokeStyle = '#d4af37';
    ctx.lineWidth = 8;
    ctx.strokeRect(14, 14, width - 28, height - 28);
    ctx.lineWidth = 2.5;
    ctx.strokeRect(24, 24, width - 48, height - 48);

    // Coral V badge on the left
    const badgeX = 60;
    const badgeY = 96;
    const badgeSize = 148;
    const bGrad = ctx.createLinearGradient(badgeX, badgeY, badgeX + badgeSize, badgeY + badgeSize);
    bGrad.addColorStop(0, '#f06c53');
    bGrad.addColorStop(1, '#d8482f');
    ctx.fillStyle = bGrad;
    ctx.beginPath();
    ctx.roundRect(badgeX, badgeY, badgeSize, badgeSize, 34);
    ctx.fill();

    // Gold rim around V badge
    ctx.strokeStyle = '#f8df88';
    ctx.lineWidth = 5;
    ctx.stroke();

    // White "V" inside badge
    ctx.fillStyle = '#ffffff';
    ctx.font = '900 94px "Nunito", sans-serif';
    ctx.textAlign = 'center';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 8;
    ctx.fillText('V', badgeX + badgeSize * 0.5, badgeY + badgeSize * 0.74);
    ctx.shadowBlur = 0;

    // Text on the right
    const textLeft = 248;
    ctx.textAlign = 'left';
    ctx.fillStyle = '#a9b9c4';
    ctx.font = '600 26px "DM Sans", sans-serif';
    ctx.fillText('Welcome to', textLeft, 145);

    ctx.fillStyle = '#ffffff';
    ctx.font = '900 48px "Nunito", sans-serif';
    ctx.fillText('VICKY MOSAFAN', textLeft, 202);

    ctx.fillStyle = '#f5d76e';
    ctx.font = '800 24px "DM Sans", sans-serif';
    ctx.letterSpacing = '3px';
    ctx.fillText('CREATIVE DEVELOPER', textLeft, 242);
  } else if (variant === 'security') {
    // 24/7 Security Checkpoint Badge
    ctx.fillStyle = '#0f1720';
    ctx.fillRect(0, 0, width, height);

    ctx.strokeStyle = '#38bdf8';
    ctx.lineWidth = 8;
    ctx.strokeRect(12, 12, width - 24, height - 24);

    // Gold Shield
    ctx.fillStyle = '#1e293b';
    ctx.beginPath();
    ctx.moveTo(width * 0.18, 60);
    ctx.lineTo(width * 0.32, 60);
    ctx.lineTo(width * 0.32, 140);
    ctx.quadraticCurveTo(width * 0.25, 200, width * 0.25, 220);
    ctx.quadraticCurveTo(width * 0.25, 200, width * 0.18, 140);
    ctx.closePath();
    ctx.fill();
    ctx.strokeStyle = '#eab308';
    ctx.lineWidth = 4;
    ctx.stroke();

    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'left';
    ctx.font = '900 48px "Nunito", sans-serif';
    ctx.fillText('ESTATE SECURITY', width * 0.38, 115);

    ctx.fillStyle = '#38bdf8';
    ctx.font = '700 28px "DM Sans", sans-serif';
    ctx.letterSpacing = '2px';
    ctx.fillText('24/7 GUARD  •  ACCESS CONTROL', width * 0.38, 175);
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural European / German License Plate Texture (M DI 4015)
export function createGermanPlateTexture(plateText = 'M DI 4015') {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  // White reflective background with embossed black border
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, 256, 64);
  ctx.strokeStyle = '#111111';
  ctx.lineWidth = 4;
  ctx.strokeRect(2, 2, 252, 60);

  // Blue EU band on left
  ctx.fillStyle = '#003399';
  ctx.fillRect(4, 4, 34, 56);

  // 12 yellow EU stars circle
  ctx.fillStyle = '#ffcc00';
  for (let i = 0; i < 12; i += 1) {
    const angle = (i / 12) * Math.PI * 2;
    const sx = 21 + Math.cos(angle) * 9;
    const sy = 22 + Math.sin(angle) * 9;
    ctx.beginPath();
    ctx.arc(sx, sy, 1.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // White "D" for Deutschland
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 20px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('D', 21, 52);

  // Munich registration seals (City seal & TÜV emission badge)
  ctx.fillStyle = '#d4af37';
  ctx.beginPath();
  ctx.arc(88, 24, 7, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#3b82f6';
  ctx.beginPath();
  ctx.arc(88, 42, 6, 0, Math.PI * 2);
  ctx.fill();

  // Bold German DIN plate number (e.g. M DI 4015)
  ctx.fillStyle = '#111111';
  ctx.font = '900 36px "Arial Black", "Impact", sans-serif';
  ctx.textAlign = 'left';
  // "M" for Munich
  ctx.fillText('M', 48, 46);
  // Registration letters and numbers
  ctx.fillText(plateText.replace(/^M\s*/, ''), 104, 46);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural BMW Roundel Emblem Texture
export function createBmwEmblemTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d');

  // Outer black ring
  ctx.fillStyle = '#000000';
  ctx.beginPath();
  ctx.arc(64, 64, 62, 0, Math.PI * 2);
  ctx.fill();

  // Outer chrome border
  ctx.strokeStyle = '#d1d5db';
  ctx.lineWidth = 4;
  ctx.stroke();

  // Inner ring chrome separator
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(64, 64, 42, 0, Math.PI * 2);
  ctx.stroke();

  // BMW Text in silver around top ring
  ctx.fillStyle = '#e5e7eb';
  ctx.font = 'bold 15px "Arial", sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText('B', 40, 26);
  ctx.fillText('M', 64, 18);
  ctx.fillText('W', 88, 26);

  // 4 Bavarian quadrants
  // Top-left: Bavarian Sky Blue (#0066b1)
  ctx.fillStyle = '#0066b1';
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.arc(64, 64, 40, Math.PI, Math.PI * 1.5);
  ctx.fill();

  // Top-right: Pure White
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.arc(64, 64, 40, Math.PI * 1.5, Math.PI * 2);
  ctx.fill();

  // Bottom-right: Bavarian Sky Blue
  ctx.fillStyle = '#0066b1';
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.arc(64, 64, 40, 0, Math.PI * 0.5);
  ctx.fill();

  // Bottom-left: Pure White
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.moveTo(64, 64);
  ctx.arc(64, 64, 40, Math.PI * 0.5, Math.PI);
  ctx.fill();

  // Center chrome quadrant divider cross
  ctx.strokeStyle = '#9ca3af';
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(24, 64);
  ctx.lineTo(104, 64);
  ctx.moveTo(64, 24);
  ctx.lineTo(64, 104);
  ctx.stroke();

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural 2x2 Twill Carbon Fiber Weave Texture
export function createCarbonFiberTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 64;
  canvas.height = 64;
  const ctx = canvas.getContext('2d');

  ctx.fillStyle = '#111315';
  ctx.fillRect(0, 0, 64, 64);

  const step = 8;
  for (let y = 0; y < 64; y += step) {
    for (let x = 0; x < 64; x += step) {
      const isAlt = ((x / step) + (y / step)) % 2 === 0;
      ctx.fillStyle = isAlt ? '#1d2126' : '#0a0b0d';
      ctx.fillRect(x, y, step, step);

      ctx.fillStyle = isAlt ? '#2d333b' : '#15171a';
      ctx.fillRect(x + 1, y + 1, step - 2, step * 0.5 - 1);
    }
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.wrapS = THREE.RepeatWrapping;
  texture.wrapT = THREE.RepeatWrapping;
  texture.repeat.set(8, 8);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

// Procedural BMW M4 CSL Dual Hood Stripes Texture
export function createM4CSLStripeTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d');

  // Base metallic white matching car body
  ctx.fillStyle = '#ebedf0';
  ctx.fillRect(0, 0, 256, 256);

  // Twin recessed carbon hood stripes running lengthwise
  // Left stripe
  ctx.fillStyle = '#14171a';
  ctx.fillRect(72, 0, 36, 256);
  // Red CSL accent pinstripe borders
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(70, 0, 3, 256);
  ctx.fillRect(107, 0, 3, 256);

  // Right stripe
  ctx.fillStyle = '#14171a';
  ctx.fillRect(148, 0, 36, 256);
  // Red CSL accent pinstripe borders
  ctx.fillStyle = '#e11d48';
  ctx.fillRect(146, 0, 3, 256);
  ctx.fillRect(183, 0, 3, 256);

  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

