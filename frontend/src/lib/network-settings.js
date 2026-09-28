// Editable vis-network display/physics options for the graph editor. Colors and fonts stay
// theme-driven (see styleNode / buildVisOptions in vis-network.js) - everything here is the
// subset of vis-network's own option tree that's safe to expose to the user without breaking
// the app's own theming or the manipulation/keyboard wiring vis-network.js sets up separately.

export const DEFAULT_NETWORK_SETTINGS = {
  nodes: {
    shape: 'dot',
    size: 20,
    borderWidth: 2,
    borderWidthSelected: 3,
    opacity: 1,
    shadowEnabled: true,
    shadowSize: 10,
    fontSize: 14,
  },
  edges: {
    width: 2,
    selectionWidth: 1,
    dashes: false,
    opacity: 0.8,
    smoothEnabled: true,
    smoothType: 'cubicBezier',
    smoothRoundness: 0.5,
    arrowsEnabled: true,
    arrowScaleFactor: 0.8,
    shadowEnabled: true,
  },
  physics: {
    enabled: true,
    solver: 'forceAtlas2Based',
    minVelocity: 0.75,
    maxVelocity: 50,
    timestep: 0.5,
    adaptiveTimestep: true,
    stabilizationEnabled: true,
    stabilizationIterations: 1000,
    stabilizationUpdateInterval: 100,
    stabilizationFit: true,
    forceAtlas2Based: {
      theta: 0.5,
      gravitationalConstant: -50,
      centralGravity: 0.01,
      springLength: 100,
      springConstant: 0.08,
      damping: 0.4,
      avoidOverlap: 0.5,
    },
    barnesHut: {
      theta: 0.5,
      gravitationalConstant: -2000,
      centralGravity: 0.3,
      springLength: 95,
      springConstant: 0.04,
      damping: 0.09,
      avoidOverlap: 0,
    },
    repulsion: {
      nodeDistance: 100,
      centralGravity: 0.2,
      springLength: 200,
      springConstant: 0.05,
      damping: 0.09,
    },
    hierarchicalRepulsion: {
      nodeDistance: 120,
      centralGravity: 0,
      springLength: 100,
      springConstant: 0.01,
      damping: 0.09,
      avoidOverlap: 0,
    },
  },
  layout: {
    randomSeed: '',
    improvedLayout: true,
    hierarchicalEnabled: false,
    hierarchicalDirection: 'UD',
    hierarchicalSortMethod: 'directed',
    levelSeparation: 200,
    nodeSpacing: 150,
    treeSpacing: 200,
    blockShifting: true,
    edgeMinimization: true,
    parentCentralization: true,
  },
  interaction: {
    dragNodes: true,
    dragView: true,
    zoomView: true,
    hover: true,
    multiselect: false,
    selectConnectedEdges: true,
    hideEdgesOnDrag: false,
    hideEdgesOnZoom: false,
    navigationButtons: false,
    keyboardEnabled: false,
    zoomSpeed: 1,
    tooltipDelay: 300,
  },
};

// Fields shown in the Physics tab for each solver, keyed by settings.physics.solver - vis-network
// nests solver-specific parameters under a differently-named object per solver, and the fields
// each solver accepts differ (e.g. repulsion has no `theta`), so the schema below only renders
// the ones that are actually meaningful for whichever solver is currently selected.
const SOLVERS = ['forceAtlas2Based', 'barnesHut', 'repulsion', 'hierarchicalRepulsion'];

const solverField = (solver, key, label, min, max, step) => ({
  tab: 'physics',
  path: `physics.${solver}.${key}`,
  label,
  type: 'range',
  min,
  max,
  step,
  showIf: (s) => s.physics.solver === solver,
});

export const SETTINGS_SCHEMA = [
  // Nodes
  { tab: 'nodes', path: 'nodes.shape', label: 'Shape', type: 'select', options: [
    'dot', 'ellipse', 'circle', 'box', 'database', 'diamond', 'star', 'triangle', 'triangleDown', 'hexagon', 'square',
  ].map(v => ({ value: v, label: v })) },
  { tab: 'nodes', path: 'nodes.size', label: 'Size', type: 'range', min: 5, max: 60, step: 1 },
  { tab: 'nodes', path: 'nodes.borderWidth', label: 'Border Width', type: 'range', min: 0, max: 10, step: 1 },
  { tab: 'nodes', path: 'nodes.borderWidthSelected', label: 'Border Width (Selected)', type: 'range', min: 0, max: 10, step: 1 },
  { tab: 'nodes', path: 'nodes.opacity', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.05 },
  { tab: 'nodes', path: 'nodes.fontSize', label: 'Label Font Size', type: 'range', min: 8, max: 32, step: 1 },
  { tab: 'nodes', path: 'nodes.shadowEnabled', label: 'Shadow', type: 'checkbox' },
  { tab: 'nodes', path: 'nodes.shadowSize', label: 'Shadow Size', type: 'range', min: 0, max: 30, step: 1, showIf: (s) => s.nodes.shadowEnabled },

  // Edges
  { tab: 'edges', path: 'edges.width', label: 'Width', type: 'range', min: 1, max: 10, step: 0.5 },
  { tab: 'edges', path: 'edges.selectionWidth', label: 'Width Increase (Selected)', type: 'range', min: 0, max: 10, step: 0.5 },
  { tab: 'edges', path: 'edges.opacity', label: 'Opacity', type: 'range', min: 0.1, max: 1, step: 0.05 },
  { tab: 'edges', path: 'edges.dashes', label: 'Dashed', type: 'checkbox' },
  { tab: 'edges', path: 'edges.shadowEnabled', label: 'Shadow', type: 'checkbox' },
  { tab: 'edges', path: 'edges.arrowsEnabled', label: 'Arrows', type: 'checkbox' },
  { tab: 'edges', path: 'edges.arrowScaleFactor', label: 'Arrow Size', type: 'range', min: 0.2, max: 3, step: 0.1, showIf: (s) => s.edges.arrowsEnabled },
  { tab: 'edges', path: 'edges.smoothEnabled', label: 'Curved Edges', type: 'checkbox' },
  { tab: 'edges', path: 'edges.smoothType', label: 'Curve Style', type: 'select', options: [
    'dynamic', 'continuous', 'discrete', 'diagonalCross', 'straightCross', 'horizontal', 'vertical', 'curvedCW', 'curvedCCW', 'cubicBezier',
  ].map(v => ({ value: v, label: v })), showIf: (s) => s.edges.smoothEnabled },
  { tab: 'edges', path: 'edges.smoothRoundness', label: 'Curve Roundness', type: 'range', min: 0, max: 1, step: 0.05, showIf: (s) => s.edges.smoothEnabled },

  // Physics (general)
  { tab: 'physics', path: 'physics.enabled', label: 'Physics Enabled', type: 'checkbox' },
  { tab: 'physics', path: 'physics.solver', label: 'Solver', type: 'select', options: SOLVERS.map(v => ({ value: v, label: v })), showIf: (s) => s.physics.enabled },

  // Physics (per-solver)
  solverField('forceAtlas2Based', 'gravitationalConstant', 'Gravitational Constant', -500, 0, 5),
    solverField('forceAtlas2Based', 'centralGravity', 'Central Gravity', 0, 1, 0.01),
    solverField('forceAtlas2Based', 'springLength', 'Spring Length', 10, 500, 5),
    solverField('forceAtlas2Based', 'springConstant', 'Spring Constant', 0, 1, 0.01),
    solverField('forceAtlas2Based', 'damping', 'Damping', 0, 1, 0.01),
    solverField('forceAtlas2Based', 'avoidOverlap', 'Avoid Overlap', 0, 1, 0.05),
    solverField('forceAtlas2Based', 'theta', 'Theta (Accuracy)', 0.1, 1.5, 0.05),

    solverField('barnesHut', 'gravitationalConstant', 'Gravitational Constant', -30000, 0, 50),
    solverField('barnesHut', 'centralGravity', 'Central Gravity', 0, 2, 0.05),
    solverField('barnesHut', 'springLength', 'Spring Length', 10, 500, 5),
    solverField('barnesHut', 'springConstant', 'Spring Constant', 0, 1, 0.01),
    solverField('barnesHut', 'damping', 'Damping', 0, 1, 0.01),
    solverField('barnesHut', 'avoidOverlap', 'Avoid Overlap', 0, 1, 0.05),
    solverField('barnesHut', 'theta', 'Theta (Accuracy)', 0.1, 1.5, 0.05),

    solverField('repulsion', 'nodeDistance', 'Node Distance', 10, 500, 5),
    solverField('repulsion', 'centralGravity', 'Central Gravity', 0, 2, 0.05),
    solverField('repulsion', 'springLength', 'Spring Length', 10, 500, 5),
    solverField('repulsion', 'springConstant', 'Spring Constant', 0, 1, 0.01),
    solverField('repulsion', 'damping', 'Damping', 0, 1, 0.01),

    solverField('hierarchicalRepulsion', 'nodeDistance', 'Node Distance', 10, 500, 5),
    solverField('hierarchicalRepulsion', 'centralGravity', 'Central Gravity', 0, 2, 0.05),
    solverField('hierarchicalRepulsion', 'springLength', 'Spring Length', 10, 500, 5),
    solverField('hierarchicalRepulsion', 'springConstant', 'Spring Constant', 0, 1, 0.01),
    solverField('hierarchicalRepulsion', 'damping', 'Damping', 0, 1, 0.01),
    solverField('hierarchicalRepulsion', 'avoidOverlap', 'Avoid Overlap', 0, 1, 0.05),

    // Physics (advanced)
    { tab: 'physics', path: 'physics.minVelocity', label: 'Min Velocity', type: 'range', min: 0.1, max: 5, step: 0.05, showIf: (s) => s.physics.enabled },
    { tab: 'physics', path: 'physics.maxVelocity', label: 'Max Velocity', type: 'range', min: 5, max: 150, step: 1, showIf: (s) => s.physics.enabled },
    { tab: 'physics', path: 'physics.timestep', label: 'Timestep', type: 'range', min: 0.1, max: 1, step: 0.05, showIf: (s) => s.physics.enabled },
    { tab: 'physics', path: 'physics.adaptiveTimestep', label: 'Adaptive Timestep', type: 'checkbox', showIf: (s) => s.physics.enabled },
    { tab: 'physics', path: 'physics.stabilizationEnabled', label: 'Stabilize on Load', type: 'checkbox', showIf: (s) => s.physics.enabled },
    { tab: 'physics', path: 'physics.stabilizationIterations', label: 'Stabilization Iterations', type: 'range', min: 0, max: 2000, step: 50, showIf: (s) => s.physics.enabled && s.physics.stabilizationEnabled },
    { tab: 'physics', path: 'physics.stabilizationUpdateInterval', label: 'Stabilization Update Interval', type: 'range', min: 10, max: 500, step: 10, showIf: (s) => s.physics.enabled && s.physics.stabilizationEnabled },
    { tab: 'physics', path: 'physics.stabilizationFit', label: 'Fit View After Stabilizing', type: 'checkbox', showIf: (s) => s.physics.enabled && s.physics.stabilizationEnabled },

    // Layout
    { tab: 'layout', path: 'layout.improvedLayout', label: 'Improved Layout Algorithm', type: 'checkbox' },
    { tab: 'layout', path: 'layout.randomSeed', label: 'Random Seed', type: 'text', placeholder: 'auto' },
    { tab: 'layout', path: 'layout.hierarchicalEnabled', label: 'Hierarchical Layout', type: 'checkbox' },
    { tab: 'layout', path: 'layout.hierarchicalDirection', label: 'Direction', type: 'select', options: [
      { value: 'UD', label: 'Up → Down' },
      { value: 'DU', label: 'Down → Up' },
      { value: 'LR', label: 'Left → Right' },
      { value: 'RL', label: 'Right → Left' },
    ], showIf: (s) => s.layout.hierarchicalEnabled },
    { tab: 'layout', path: 'layout.hierarchicalSortMethod', label: 'Sort Method', type: 'select', options: [
      { value: 'hubsize', label: 'Hub Size' },
      { value: 'directed', label: 'Directed' },
    ], showIf: (s) => s.layout.hierarchicalEnabled },
    { tab: 'layout', path: 'layout.levelSeparation', label: 'Level Separation', type: 'range', min: 50, max: 500, step: 10, showIf: (s) => s.layout.hierarchicalEnabled },
    { tab: 'layout', path: 'layout.nodeSpacing', label: 'Node Spacing', type: 'range', min: 50, max: 500, step: 10, showIf: (s) => s.layout.hierarchicalEnabled },
    { tab: 'layout', path: 'layout.treeSpacing', label: 'Tree Spacing', type: 'range', min: 50, max: 500, step: 10, showIf: (s) => s.layout.hierarchicalEnabled },
    { tab: 'layout', path: 'layout.blockShifting', label: 'Block Shifting', type: 'checkbox', showIf: (s) => s.layout.hierarchicalEnabled },
    { tab: 'layout', path: 'layout.edgeMinimization', label: 'Edge Minimization', type: 'checkbox', showIf: (s) => s.layout.hierarchicalEnabled },
    { tab: 'layout', path: 'layout.parentCentralization', label: 'Parent Centralization', type: 'checkbox', showIf: (s) => s.layout.hierarchicalEnabled },

    // Interaction
    { tab: 'interaction', path: 'interaction.dragNodes', label: 'Drag Nodes', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.dragView', label: 'Drag Canvas', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.zoomView', label: 'Zoom with Scroll', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.zoomSpeed', label: 'Zoom Speed', type: 'range', min: 0.1, max: 3, step: 0.1, showIf: (s) => s.interaction.zoomView },
    { tab: 'interaction', path: 'interaction.hover', label: 'Hover Highlighting', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.tooltipDelay', label: 'Tooltip Delay (ms)', type: 'range', min: 0, max: 1000, step: 50 },
    { tab: 'interaction', path: 'interaction.multiselect', label: 'Multi-select (Ctrl/Cmd Click)', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.selectConnectedEdges', label: 'Select Connected Edges', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.hideEdgesOnDrag', label: 'Hide Edges While Dragging', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.hideEdgesOnZoom', label: 'Hide Edges While Zooming', type: 'checkbox' },
    { tab: 'interaction', path: 'interaction.navigationButtons', label: 'On-canvas Navigation Buttons', type: 'checkbox' },
  { tab: 'interaction', path: 'interaction.keyboardEnabled', label: "vis-network's Built-in Keyboard Shortcuts", type: 'checkbox' },
];

export const SETTINGS_TABS = [
  { id: 'nodes', label: 'Nodes' },
  { id: 'edges', label: 'Edges' },
  { id: 'physics', label: 'Physics' },
  { id: 'layout', label: 'Layout' },
  { id: 'interaction', label: 'Interaction' },
];

export function getPath(obj, path) {
  return path.split('.').reduce((acc, key) => (acc == null ? acc : acc[key]), obj);
}

export function setPath(obj, path, value) {
  const keys = path.split('.');
  const next = { ...obj };
  let cursor = next;
  keys.forEach((key, i) => {
    if (i === keys.length - 1) {
      cursor[key] = value;
    } else {
      cursor[key] = { ...cursor[key] };
      cursor = cursor[key];
    }
  });
  return next;
}

// Fills in any keys missing from a persisted (possibly older) settings blob using the current
// defaults, so a settings shape added after a user already saved a network's settings doesn't
// crash the schema-driven form or leave `undefined`s in the vis-network options.
function deepMergeDefaults(defaults, saved) {
  if (typeof defaults !== 'object' || defaults === null || Array.isArray(defaults)) {
    return saved !== undefined ? saved : defaults;
  }
  const result = { ...defaults };
  if (saved && typeof saved === 'object') {
    for (const key of Object.keys(defaults)) {
      result[key] = deepMergeDefaults(defaults[key], saved[key]);
    }
  }
  return result;
}

const STORAGE_PREFIX = 'networkVisSettings_';

export function loadNetworkSettings(networkId) {
  if (typeof window === 'undefined' || !networkId) return DEFAULT_NETWORK_SETTINGS;
  try {
    const raw = localStorage.getItem(STORAGE_PREFIX + networkId);
    if (!raw) return DEFAULT_NETWORK_SETTINGS;
    return deepMergeDefaults(DEFAULT_NETWORK_SETTINGS, JSON.parse(raw));
  } catch {
    return DEFAULT_NETWORK_SETTINGS;
  }
}

export function saveNetworkSettings(networkId, settings) {
  if (typeof window === 'undefined' || !networkId) return;
  localStorage.setItem(STORAGE_PREFIX + networkId, JSON.stringify(settings));
}

// Builds the vis-network `options` object from our editable settings plus theme-derived
// colors/fonts. Deliberately omits `manipulation` - callers that need it (network creation)
// merge it in themselves, and omitting it here means calling `network.setOptions()` with this
// object never clobbers the manipulation callbacks wired up at creation time.
export function buildVisOptions(settings, isDarkMode) {
  const s = settings;
  const solver = s.physics.solver;
  const fontFace = 'Inter, -apple-system, BlinkMacSystemFont, sans-serif';

  return {
    autoResize: false,
    clickToUse: false,
    nodes: {
      shape: s.nodes.shape,
      size: s.nodes.size,
      opacity: s.nodes.opacity,
      borderWidth: s.nodes.borderWidth,
      borderWidthSelected: s.nodes.borderWidthSelected,
      font: {
        size: s.nodes.fontSize,
        face: fontFace,
        color: isDarkMode ? '#ffffff' : '#374151',
        strokeWidth: 0,
        strokeColor: '#ffffff',
        align: 'center',
        bold: {
          size: s.nodes.fontSize + 2,
          face: fontFace,
          color: isDarkMode ? '#ffffff' : '#1f2937',
        },
      },
      shadow: {
        enabled: s.nodes.shadowEnabled,
        size: s.nodes.shadowSize,
        color: 'rgba(0,0,0,0.1)',
        x: 5,
        y: 5,
      },
      color: {
        border: '#e5e7eb',
        background: '#ffffff',
        highlight: { border: '#3b82f6', background: '#eff6ff' },
        hover: { border: '#3b82f6', background: '#f8fafc' },
      },
    },
    edges: {
      width: s.edges.width,
      selectionWidth: s.edges.selectionWidth,
      dashes: s.edges.dashes,
      color: {
        color: '#9ca3af',
        highlight: '#3b82f6',
        hover: '#6b7280',
        opacity: s.edges.opacity,
      },
      smooth: s.edges.smoothEnabled
        ? { enabled: true, type: s.edges.smoothType, forceDirection: 'none', roundness: s.edges.smoothRoundness }
        : { enabled: false },
      arrows: {
        to: {
          enabled: s.edges.arrowsEnabled,
          scaleFactor: s.edges.arrowScaleFactor,
          type: 'arrow',
        },
      },
      shadow: {
        enabled: s.edges.shadowEnabled,
        color: 'rgba(0,0,0,0.1)',
        size: 5,
        x: 2,
        y: 2,
      },
      font: {
        size: 12,
        face: fontFace,
        color: '#6b7280',
        strokeWidth: 0,
        strokeColor: '#ffffff',
        align: 'middle',
      },
    },
    layout: {
      improvedLayout: s.layout.improvedLayout,
      ...(s.layout.randomSeed !== '' && s.layout.randomSeed != null
        ? { randomSeed: s.layout.randomSeed }
        : {}),
      hierarchical: {
        enabled: s.layout.hierarchicalEnabled,
        direction: s.layout.hierarchicalDirection,
        sortMethod: s.layout.hierarchicalSortMethod,
        levelSeparation: s.layout.levelSeparation,
        nodeSpacing: s.layout.nodeSpacing,
        treeSpacing: s.layout.treeSpacing,
        blockShifting: s.layout.blockShifting,
        edgeMinimization: s.layout.edgeMinimization,
        parentCentralization: s.layout.parentCentralization,
      },
    },
    physics: {
      enabled: s.physics.enabled,
      solver,
      [solver]: s.physics[solver],
      minVelocity: s.physics.minVelocity,
      maxVelocity: s.physics.maxVelocity,
      timestep: s.physics.timestep,
      adaptiveTimestep: s.physics.adaptiveTimestep,
      stabilization: {
        enabled: s.physics.stabilizationEnabled,
        iterations: s.physics.stabilizationIterations,
        updateInterval: s.physics.stabilizationUpdateInterval,
        fit: s.physics.stabilizationFit,
      },
    },
    interaction: {
      dragNodes: s.interaction.dragNodes,
      dragView: s.interaction.dragView,
      zoomView: s.interaction.zoomView,
      zoomSpeed: s.interaction.zoomSpeed,
      hover: s.interaction.hover,
      tooltipDelay: s.interaction.tooltipDelay,
      multiselect: s.interaction.multiselect,
      selectConnectedEdges: s.interaction.selectConnectedEdges,
      hideEdgesOnDrag: s.interaction.hideEdgesOnDrag,
      hideEdgesOnZoom: s.interaction.hideEdgesOnZoom,
      navigationButtons: s.interaction.navigationButtons,
      keyboard: { enabled: s.interaction.keyboardEnabled },
    },
  };
}
