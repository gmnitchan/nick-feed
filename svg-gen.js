// svg-gen.js — Procedural SVG backgrounds per card

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function seededRandom(seed) {
  let s = seed;
  return function() {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0xffffffff;
  };
}

function generateSVG(cardId, type) {
  const seed = hashString(cardId);
  const rand = seededRandom(seed);
  const colors = {
    insight: '#00D4FF',
    skill: '#A855F7',
    whatif: '#FF8A00',
    timeless: '#F5E6D3',
    discovery: '#FF5CBE',
    poetry: '#E8C547',
    chinese: '#FF4444',
  };
  const color = colors[type] || colors.discovery;
  const opacity = 0.06 + rand() * 0.06;

  const generators = { insight: genNodes, skill: genBlocks, whatif: genBranching, timeless: genWaves, discovery: genAngular, poetry: genWaves, chinese: genBlocks };
  const gen = generators[type] || genAngular;

  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 600" preserveAspectRatio="xMidYMid slice" style="opacity:${opacity.toFixed(3)}">
    ${gen(rand, color)}
  </svg>`;
}

// Task: Angular, sharp lines, directional arrows
function genAngular(rand, color) {
  let shapes = '';
  const count = 8 + Math.floor(rand() * 8);
  for (let i = 0; i < count; i++) {
    const x1 = rand() * 400;
    const y1 = rand() * 600;
    const x2 = x1 + (rand() - 0.5) * 200;
    const y2 = y1 + (rand() - 0.5) * 200;
    const sw = 1 + rand() * 2;
    shapes += `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${color}" stroke-width="${sw}"/>`;
    if (rand() > 0.5) {
      const angle = Math.atan2(y2 - y1, x2 - x1);
      const aLen = 10 + rand() * 10;
      const ax1 = x2 - aLen * Math.cos(angle - 0.4);
      const ay1 = y2 - aLen * Math.sin(angle - 0.4);
      const ax2 = x2 - aLen * Math.cos(angle + 0.4);
      const ay2 = y2 - aLen * Math.sin(angle + 0.4);
      shapes += `<polygon points="${x2},${y2} ${ax1},${ay1} ${ax2},${ay2}" fill="${color}"/>`;
    }
  }
  return shapes;
}

// Insight: Interconnected nodes, neural-net
function genNodes(rand, color) {
  let shapes = '';
  const nodeCount = 10 + Math.floor(rand() * 10);
  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    nodes.push({ x: rand() * 400, y: rand() * 600, r: 3 + rand() * 6 });
  }
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const dist = Math.hypot(nodes[i].x - nodes[j].x, nodes[i].y - nodes[j].y);
      if (dist < 120) {
        shapes += `<line x1="${nodes[i].x}" y1="${nodes[i].y}" x2="${nodes[j].x}" y2="${nodes[j].y}" stroke="${color}" stroke-width="0.5"/>`;
      }
    }
  }
  for (const n of nodes) {
    shapes += `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="none" stroke="${color}" stroke-width="1"/>`;
  }
  return shapes;
}

// Skill: Modular blocks, grid-based
function genBlocks(rand, color) {
  let shapes = '';
  const cols = 6 + Math.floor(rand() * 4);
  const rows = 9 + Math.floor(rand() * 4);
  const cellW = 400 / cols;
  const cellH = 600 / rows;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (rand() > 0.7) {
        const x = c * cellW + 2;
        const y = r * cellH + 2;
        const w = cellW - 4;
        const h = cellH - 4;
        shapes += `<rect x="${x}" y="${y}" width="${w}" height="${h}" fill="none" stroke="${color}" stroke-width="1" rx="2"/>`;
      }
    }
  }
  return shapes;
}

// What If: Branching paths, forking lines
function genBranching(rand, color) {
  let shapes = '';
  const startPoints = 2 + Math.floor(rand() * 3);
  for (let s = 0; s < startPoints; s++) {
    let x = rand() * 400;
    let y = 0;
    const path = [`M ${x} ${y}`];
    const segments = 6 + Math.floor(rand() * 6);
    for (let i = 0; i < segments; i++) {
      x += (rand() - 0.5) * 80;
      y += 40 + rand() * 60;
      path.push(`L ${x} ${y}`);
      if (rand() > 0.6) {
        let fx = x + (rand() - 0.5) * 120;
        let fy = y + 30 + rand() * 40;
        shapes += `<line x1="${x}" y1="${y}" x2="${fx}" y2="${fy}" stroke="${color}" stroke-width="0.8" stroke-dasharray="4,4"/>`;
        shapes += `<circle cx="${fx}" cy="${fy}" r="3" fill="${color}"/>`;
      }
    }
    shapes += `<path d="${path.join(' ')}" fill="none" stroke="${color}" stroke-width="1.5"/>`;
    shapes += `<circle cx="${x}" cy="${y}" r="4" fill="${color}"/>`;
  }
  return shapes;
}

// Timeless: Flowing curves, organic waves
function genWaves(rand, color) {
  let shapes = '';
  const waveCount = 4 + Math.floor(rand() * 4);
  for (let w = 0; w < waveCount; w++) {
    const yBase = (w + 1) * (600 / (waveCount + 1)) + (rand() - 0.5) * 40;
    const amp = 20 + rand() * 40;
    const freq = 0.01 + rand() * 0.02;
    const phase = rand() * Math.PI * 2;
    let path = `M 0 ${yBase}`;
    for (let x = 10; x <= 400; x += 10) {
      const y = yBase + Math.sin(x * freq + phase) * amp;
      path += ` L ${x} ${y}`;
    }
    shapes += `<path d="${path}" fill="none" stroke="${color}" stroke-width="${0.8 + rand()}" opacity="${0.5 + rand() * 0.5}"/>`;
  }
  return shapes;
}
