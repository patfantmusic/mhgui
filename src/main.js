import { debounce } from './utils.js';
import { itemCard } from './templates.js';
import { fetchSuggestions } from './api.js';
import { loadAppData } from './dbutils.js';

loadAppData();

/**
 * @typedef {Object} Suggestion
 * @property {string} icon - URL to the item icon
 * @property {string} name - Item display name
 * @property {string} category - Item category
 * @property {number|string} value - Monetary or point value
 * @property {string} rarity - Item rarity level
 * @property {number|string} capacity - Item storage capacity
 * @property {string} how_to_get - Instructions on obtaining the item
 */

/**
 * Global application state
 * @type {{ exclude: Set<string>, searchQuery: string, types: Array<string> }}
 */
const state = {
    exclude: new Set(),
    searchQuery: "",
    types: ["item", "material"],
};

/** @type {HTMLElement | null} */
const resultsContainer = document.getElementById("item-results");

/** @type {HTMLElement | null} */
const typeSelect = document.getElementById("type-select");

/** @type {HTMLInputElement | null} */
const searchInput = (/** @type {HTMLInputElement} */ (document.getElementById("item-search")));

/**
 * Fetches data based on current state and updates the DOM results container.
 * @returns {Promise<void>}
 */
async function updateUI() {
    if (!resultsContainer) return;

    if (!state.searchQuery) {
        resultsContainer.innerHTML = "";
        return;
    }

    /** @type {Suggestion[]} */
    const data = await fetchSuggestions(state.searchQuery, state.exclude, state.types);
    resultsContainer.innerHTML = data.map(itemCard).join("");
}

/**
 * Handles input events with a debounce delay.
 * @type {(event: Event) => void}
 */
const handleSearch = debounce((/** @type {Event} */ event) => {
    const target = /** @type {HTMLInputElement} */ (event.target);
    state.searchQuery = target.value;
    updateUI();
}, 300);


/**
 * Handles type selection changes.
 * @type {(event: Event) => void}
 */
const handleSelectType = (/** @type {Event} */ event) => {
    const value = /** @type {HTMLInputElement} */ (event.target).value;
    switch (value) {
        case "both":
            state.types = ["item", "material"]
            break;
        case "items":
            state.types = ["item"]

            break;
        case "materials":
            state.types = ["material"]
            break;
    }
    updateUI();
};


// Initialize Event Listeners
if (searchInput) {
    searchInput.addEventListener("input", handleSearch);
}

if (typeSelect) {
    typeSelect.addEventListener("change", handleSelectType);
}

document.querySelectorAll(".exclude-check").forEach((el) => {
    const checkbox = /** @type {HTMLInputElement} */ (el);

    // Initial state sync for pre-checked boxes
    if (checkbox.checked) state.exclude.add(checkbox.value);

    checkbox.addEventListener("change", (e) => {
        const target = /** @type {HTMLInputElement} */ (e.target);
        if (target.checked) {
            state.exclude.add(target.value);
        } else {
            state.exclude.delete(target.value);
        }

        updateUI();
    });
});

