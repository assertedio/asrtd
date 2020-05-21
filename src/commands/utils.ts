export const TABLE_CONFIG = {
  border: {
    topBody: '─',
    topJoin: '┬',
    topLeft: '┌',
    topRight: '┐',

    bottomBody: '─',
    bottomJoin: '┴',
    bottomLeft: '└',
    bottomRight: '┘',

    bodyLeft: '│',
    bodyRight: '│',
    bodyJoin: '│',

    joinBody: '─',
    joinLeft: '├',
    joinRight: '┤',
    joinJoin: '┼',
  },
};

export const DURATION_CONFIG = {
  round: true,
  largest: 2,
  units: ['y', 'mo', 'w', 'd', 'h', 'm', 's', 'ms'],
};

export const DURATION_CONFIG_SEC_MIN = { ...DURATION_CONFIG, units: DURATION_CONFIG.units.filter((unit) => unit !== 'ms') };
export const DURATION_CONFIG_MIN_MIN = {
  ...DURATION_CONFIG,
  units: DURATION_CONFIG.units.filter((unit) => unit !== 'ms' && unit !== 'sec'),
};
