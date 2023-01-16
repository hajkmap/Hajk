/**
 * @description This function can be called multiple times and it will postpone the execution of 'func'
 * so that it is only executed once, after the specified delay has passed.
 *
 * @param {Function} func Function to be invoked when delay has passed
 * @param {*} delay Delay in ms
 * @returns Return value 'func'
 */
export function debounceSync(func, delay = 500) {
  let timeout;

  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      func(...args);
    }, delay);
  };
}

/**
 * @description A asynchronous version of debounceSync.
 * @param {Function} func Function to be invoked when delay has passed
 * @param {Number} delay Delay in ms
 * @returns Promise that resolves to the return value of 'func'
 */
export function debounce(func, delay) {
  let timer = null;

  return (...args) => {
    clearTimeout(timer);
    return new Promise((resolve) => {
      timer = setTimeout(() => resolve(func(...args)), delay);
    });
  };
}
