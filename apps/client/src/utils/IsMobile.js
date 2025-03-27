/**
 * TODO:
 * This is obsolete and will be removed once we refactor methods that
 * make use of getIsMobile() and isMobile().
 */
export const isMobile = getIsMobile();

export function getIsMobile() {
  return window.innerWidth < 600;
}
