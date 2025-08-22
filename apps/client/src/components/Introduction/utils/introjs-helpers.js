/**
 * Utility: Wait until a DOM element becomes visible in the document
 * @param {string} selector - CSS selector string to find the target element
 * @param {number} maxTries - Maximum number of attempts to check for element visibility (default: 20)
 * @param {number} delay - Delay in milliseconds between each check (default: 100ms)
 * @returns {Promise<boolean>} Promise that resolves to true when element is visible, false if timeout occurs
 *
 * This function is useful for waiting for dynamically rendered elements to appear
 * before proceeding with subsequent operations in the introduction tour.
 */
const waitForElementVisible = (selector, maxTries = 20, delay = 100) =>
  new Promise((resolve) => {
    let tries = 0;
    const interval = setInterval(() => {
      const el = document.querySelector(selector);
      if (el && el.offsetParent !== null) {
        clearInterval(interval);
        resolve(true);
      } else if (++tries >= maxTries) {
        clearInterval(interval);
        console.warn(`Timeout waiting for ${selector}`);
        resolve(false);
      }
    }, delay);
  });

/**
 * Utility: Execute a series of actions sequentially, waiting for elements to become visible between steps
 * @param {Array<Object>} steps - Array of step objects to execute
 * @param {Function} [steps[].action] - Function to execute for this step
 * @param {string} [steps[].waitFor] - CSS selector to wait for before proceeding to next step
 * @param {number} [steps[].delay] - Additional delay in milliseconds after waiting for element
 * @returns {Promise<void>} Promise that resolves when all steps are completed
 *
 * This function is essential for the introduction tour to ensure UI elements are properly
 * rendered and visible before highlighting them or moving to the next step. It prevents
 * race conditions between DOM updates and tour progression.
 *
 * Example usage:
 * chainActionsWithVisibility([
 *   { action: () => openMenu(), waitFor: "#menu-content" },
 *   { action: () => selectItem(), delay: 150 },
 *   { waitFor: "#selected-item" }
 * ]);
 */
export const chainActionsWithVisibility = async (steps) => {
  for (const step of steps) {
    if (step.action) step.action();
    if (step.waitFor) await waitForElementVisible(step.waitFor);
    if (step?.delay)
      await new Promise((resolve) => setTimeout(resolve, step?.delay));
  }
};
