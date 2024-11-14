// One place to check (and possibly change, if needed) if the current
// Hajk instance has authentication activated.
export const isAuthActive = process.env.AUTH_ACTIVE === "true" || false;
