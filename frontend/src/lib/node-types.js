// Node "type" is stored as the node's color on the backend (there's no separate type column),
// so every part of the UI that cares about type compares against these exact hex strings.
export const ROOT_COLOR = '#808080';
export const ACTION_COLOR = '#7FC6A4';
export const CATEGORY_COLOR = '#FFD166';
// A leaf node that's just reference material (e.g. music theory notes), not something to
// practice - excluded from routine generation server-side the same way Category nodes are.
export const INFO_COLOR = '#6FA8DC';

export const NODE_TYPES = [
  {
    color: ACTION_COLOR,
    label: 'Action',
    hint: 'Something you practice. Only Action nodes are scheduled into routines.',
    dotClass: 'bg-emerald-400',
  },
  {
    color: CATEGORY_COLOR,
    label: 'Category',
    hint: 'Groups related nodes together.',
    dotClass: 'bg-amber-400',
  },
  {
    color: INFO_COLOR,
    label: 'Info',
    hint: 'Reference notes - never scheduled into a routine.',
    dotClass: 'bg-sky-400',
  },
];

export const getNodeType = (color) => {
  if (color === ROOT_COLOR) return { color: ROOT_COLOR, label: 'Root', hint: 'The starting point of this network.', dotClass: 'bg-gray-400' };
  return NODE_TYPES.find(t => t.color === color) || NODE_TYPES[0];
};

const LABEL_MAX = 28;

// What the graph draws on a node. Long titles are cut down so the canvas stays readable (the
// full title shows on hover and in the inspector), and vis wraps what's left onto two lines
// via nodes.widthConstraint (see buildVisOptions).
export const toDisplayLabel = (text) => {
  if (!text) return text;
  return text.length > LABEL_MAX ? `${text.substring(0, LABEL_MAX)}...` : text;
};

export const parseISODuration = (duration) => {
  if (!duration) return null;
  const matches = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!matches) return null;
  return {
    hours: parseInt(matches[1] || 0, 10),
    minutes: parseInt(matches[2] || 0, 10),
    seconds: parseInt(matches[3] || 0, 10),
  };
};

export const formatDuration = (duration) => {
  const d = parseISODuration(duration);
  if (!d) return null;
  const totalMinutes = d.hours * 60 + d.minutes;
  if (totalMinutes === 0) return `${d.seconds}s`;
  return d.seconds ? `${totalMinutes}m ${d.seconds}s` : `${totalMinutes}m`;
};
