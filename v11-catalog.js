'use strict';

// V11 expands the 3D universe while keeping every V10 game and local arcade feature.
const v11UpgradeCopy = {
  'neon-strike': {
    desc: 'Master three neon arenas, read changing target patterns, and build a precision streak in an upgraded 3D challenge.',
    instructions: 'Aim with the mouse or touch and click/tap targets. WASD moves your view; 1/2/3 or the Arena button changes the arena. Build a streak before the 75-second round ends.'
  },
  'gravity-rush': {
    desc: 'Race through three floating worlds with moving platforms, checkpoints, double jumps, and hidden energy shards.',
    instructions: 'WASD or arrow keys to move, Space to jump and tap again for a double jump. Collect shards, use checkpoints, and reach the exit portal. Choose a course with the Course button.'
  },
  'velocity-x': {
    desc: 'Take on upgraded circuit racing with rival drivers, three track layouts, drift-friendly handling, and boost management.',
    instructions: 'W/Up accelerates, S/Down brakes, A/D or Left/Right steers, and Shift boosts. Complete three laps, stay on the road, and pass the rival cars.'
  },
  'wildlands': {
    desc: 'Explore three distinct biomes, discover wildlife and landmarks, and complete a larger relic-hunting expedition.',
    instructions: 'WASD or arrow keys to explore, Shift to sprint. Collect the relics in each biome, discover the landmarks, and reach the final beacon. Switch regions with the Biome button.'
  },
  'park-empire': {
    desc: 'Grow a fuller 3D theme park with a wider ride collection, visitor paths, park rating, and a new management challenge.',
    instructions: 'Choose a ride type, then click an empty grid tile to build. Paths connect the park, rides attract guests, and ticket income grows your budget. Reach the park goal to finish.'
  }
};
v10ThreeEngines.forEach(function (engine) {
  const copy = v11UpgradeCopy[engine.id];
  if (!copy) return;
  engine.desc = copy.desc;
  engine.instructions = copy.instructions;
  const entry = games.find(function (game) { return game.engine === engine.id; });
  if (entry) {
    entry.desc = copy.desc;
  }
});

const v11ThreeEngines = [
  {
    id: 'mythic-realms',
    name: 'Mythic Realms',
    category: 'RPG & Fantasy',
    emoji: '🧙',
    desc: 'Explore a floating fantasy valley, awaken ancient shrines, learn new magic, and complete a three-region quest.',
    instructions: 'WASD or arrow keys to explore. Collect glowing runes and stand near each shrine to awaken it. Use the spell pulse to activate distant crystals. Restore all three shrines to open the sky gate.',
    is3D: true,
    colors: ['#47366f', '#24616a']
  },
  {
    id: 'trailblazer',
    name: 'Trailblazer Sim',
    category: 'Vehicle Simulation',
    emoji: '🚚',
    desc: 'Build a delivery career across a scenic 3D route, collect cargo, navigate checkpoints, and make every drop on time.',
    instructions: 'W/Up accelerates, S/Down brakes, A/D or Left/Right steers, and Shift gives a short boost. Drive through the glowing route gates in order and make all six delivery stops.',
    is3D: true,
    colors: ['#3b586f', '#677043']
  },
  {
    id: 'wildcraft',
    name: 'Wildcraft',
    category: 'Survival & Crafting',
    emoji: '🌲',
    desc: 'Gather supplies in a peaceful 3D wilderness, craft a campsite, and build a beacon before night settles in.',
    instructions: 'WASD or arrow keys to explore. Walk close to glowing resource nodes to gather wood, stone, and berries. Craft a shelter, then build the beacon with the remaining supplies before the timer ends.',
    is3D: true,
    colors: ['#285442', '#69533c']
  }
];

engines.push(...v11ThreeEngines);
games.push(...v11ThreeEngines.map(function (engine) {
  return {
    id: '3d-' + engine.id,
    engine: engine.id,
    name: engine.name,
    category: engine.category,
    emoji: engine.emoji,
    desc: engine.desc,
    colors: engine.colors,
    theme: 'V11 3D Original',
    variant: 1,
    original: true,
    recommended: true,
    popular: false,
    is3D: true
  };
}));
