import puppeteer from 'puppeteer-core';
import fs from 'fs';

const edgePath = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const chromePath = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const executablePath = fs.existsSync(edgePath) ? edgePath : chromePath;

async function auditNavigation() {
  const browser = await puppeteer.launch({
    executablePath,
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--use-gl=angle', '--use-angle=d3d11'],
    defaultViewport: { width: 1440, height: 900 }
  });

  const page = await browser.newPage();
  await page.goto('http://localhost:4173/', { waitUntil: 'networkidle0' });
  await page.waitForFunction(() => window.__SCENE_READY__ === true);

  // Dismiss welcome
  await page.evaluate(() => {
    document.getElementById('enter-button')?.click();
  });
  await new Promise(r => setTimeout(r, 500));

  console.log('Testing pathways in real physics engine...');

  const results = await page.evaluate(async () => {
    const report = [];

    // Helper to test walking between two points:
    // We place character at start, set velocity toward end, step physics, and check how close we get
    function testWalk(name, start, target, maxSeconds = 3.0) {
      window.__teleport(start.x, start.y, start.z);
      
      const dt = 1 / 60;
      const totalSteps = Math.round(maxSeconds / dt);
      let reached = false;
      let minDistance = Infinity;
      let finalPos = { ...start };

      // We simulate input toward target
      for (let step = 0; step < totalSteps; step++) {
        // current pos from characterRig
        const char = window.__THREE__ ? window.portfolioScene?.children : null;
        // In main.js, playerBody is available or we can check character position
        // Let's get character controller / playerBody position
        // Teleport helper updates physX, physY, physZ in main
      }
      return { name };
    }

    // Let's inspect raycast or direct clearance between key waypoints:
    // 1. Living room center to Project Gallery center:
    // Living room: (0, 1.12, -1.5) -> (x = -5.5 archway) -> (-11, 1.12, -1.5)
    // 2. Living room center to Home Office center:
    // (0, 1.12, -1.5) -> (x = 5.5 archway) -> (10.75, 1.12, -1.5)
    // 3. Living room center to Stairs:
    // (0, 1.12, -1.5) -> Stairs start (0, 1.12, -3.2) -> top of stairs (0, 6.32, -7.8)
    // 4. Living room to Rear Terrace:
    // (0, 1.12, -1.5) -> French doors (0, 1.12, -8.2) -> (0, 1.12, -11.8)

    return {
      rooms: window.__cv ? 'ready' : 'unknown'
    };
  });

  console.log('Results:', results);
  await browser.close();
}

auditNavigation().catch(console.error);
