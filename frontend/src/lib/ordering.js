// Fractional-index keys must be compared as plain strings, not with localeCompare.
export const byPosition = (a, b) => a.position < b.position ? -1 : a.position > b.position ? 1 : 0;
