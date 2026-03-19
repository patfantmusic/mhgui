/**
 * Creates a debounced function that delays invoking func until after wait 
 * milliseconds have elapsed since the last time the debounced function was invoked.
 * * @param {Function} func - The function to debounce.
 * @param {number} delay - The number of milliseconds to delay.
 * @returns {(...args: any[]) => void} A new debounced function.
 */
export function debounce(func, delay) {
    /** @type {ReturnType<typeof setTimeout> | undefined} */
    let timeoutId;

    return function (...args) {
        if (timeoutId) clearTimeout(timeoutId);

        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
}