'use strict';

const v10ThreeEngines = [
  {
    id: 'neon-strike',
    name: 'Neon Strike',
    category: 'Action',
    emoji: '🎯',
    desc: 'Enter a neon arena, tag floating training drones with pulse shots, and build your combo before time runs out.',
    instructions: 'WASD to move. Click the arena to lock your mouse, then aim with the mouse and click to fire pulse shots. On touch screens, drag to aim and tap to fire. Hit as many moving drones as you can in 90 seconds.',
    is3D: true,
    colors: ['#173d62', '#512c76']
  },
  {
    id: 'gravity-rush',
    name: 'Gravity Rush',
    category: 'Action',
    emoji: '🪐',
    desc: 'Leap across a floating obstacle course, collect energy shards, and reach the portal in a polished 3D platform challenge.',
    instructions: 'WASD or arrow keys to move. Space to jump. Collect the glowing shards and reach the portal. Falling sends you back to the latest checkpoint. Touch controls are included.',
    is3D: true,
    colors: ['#244f73', '#5c347b']
  },
  {
    id: 'velocity-x',
    name: 'Velocity X',
    category: 'Racing',
    emoji: '🏎️',
    desc: 'Master an arcade circuit, hold clean racing lines, manage your boost, and finish three laps against the clock.',
    instructions: 'W or Up to accelerate, S or Down to brake, A/D or Left/Right to steer, and Shift to boost. Complete three laps. If you leave the track, slow down and guide your car back onto the asphalt.',
    is3D: true,
    colors: ['#563052', '#1c5360']
  },
  {
    id: 'wildlands',
    name: 'Wildlands',
    category: 'Adventure',
    emoji: '🌿',
    desc: 'Explore a living island in first person, discover ancient energy relics, and find the beacon hidden beyond the hills.',
    instructions: 'WASD or arrow keys to walk. Hold Shift to sprint. Click the world to lock your mouse and look around; drag to look on touch screens. Find all 10 relics, then reach the distant beacon.',
    is3D: true,
    colors: ['#245342', '#274a70']
  },
  {
    id: 'park-empire',
    name: 'Park Empire',
    category: 'Simulation',
    emoji: '🎡',
    desc: 'Build a colorful amusement park, place rides on the grid, welcome visitors, and grow your park into a destination.',
    instructions: 'Choose a ride, then click an empty grid tile to place it. Rides cost money but attract visitors and generate ticket income. Build a park with 8 rides and grow your cash balance to the goal. Touch screens can tap to build.',
    is3D: true,
    colors: ['#245d62', '#69436c']
  }
];

engines.push(...v10ThreeEngines);
games.push(...v10ThreeEngines.map((engine, index) => ({
  id: '3d-' + engine.id,
  engine: engine.id,
  name: engine.name,
  category: engine.category,
  emoji: engine.emoji,
  desc: engine.desc,
  colors: engine.colors,
  theme: '3D Original',
  variant: 1,
  original: true,
  recommended: true,
  popular: index < 3,
  is3D: true
})));
