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
