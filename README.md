# Cartoonverse portfolio

A self-contained Three.js and Rapier exploration portfolio built with native JavaScript modules and Vite. The original source was not present in the workspace. A neighboring ZIP archive contained a React/Next.js concept and project copy, but no model assets; this implementation uses procedural, shared geometry to retain the requested stack.

## Run

- `npm install`
- `npm run dev`
- `npm run build`

## Controls

- Desktop: WASD move, Shift sprint, Space jump, drag the scene to look, mouse wheel zoom, E interact, Escape close a panel or release the pointer.
- Touch: use the left joystick to move, drag the scene to look, use Explore and Jump buttons.
- The room directory jumps to essential portfolio information directly. Take the tour follows room waypoints; it can be stopped at any time.

## Structure

- `src/main.js`: renderer, environment, player, Rapier controller, input, camera, interaction, quality controller, and lifecycle.
- `src/portfolio.js`: room waypoints and editable portfolio copy.
- `src/style.css`: responsive game-inspired interface and controls.
- `index.html`: semantic interface shell.

## Content to verify before publishing

Project copy is derived from the recovered concept archive and is marked as illustrative in the Projects room. Confirm project details, professional history, email, GitHub, and LinkedIn links. The character, architecture, furniture, garden, and portfolio frames are procedural rather than supplied/licensed GLB assets.

## Performance

The in-world development pill reports live FPS and WebGL draw calls. Rendering uses a conservative device pixel ratio, instanced garden assets, reusable materials, and a smoothed adaptive resolution controller. Device-specific sustained frame rate, GPU time, thermal behavior, and heap growth have not been certified on physical hardware.
