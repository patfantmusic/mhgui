import { debounce } from './utils';
import { fetchSuggestions } from './api';
import { loadAppData } from './dbutils';

loadAppData();

export interface Suggestion {
    icon: string;
    name: string;
    category: string;
    value: number | string;
    rarity: string;
    capacity: number | string;
    how_to_get: string;
}

interface AppState {
    exclude: Set<string>;
    searchQuery: string;
    types: string[];
}

const state: AppState = {
    exclude: new Set(),
    searchQuery: "",
    types: ["item", "material"],
};

const resultsContainer = document.getElementById("item-results") as HTMLElement | null;
const typeSelect = document.getElementById("type-select") as HTMLElement | null;
const searchInput = document.getElementById("item-search") as HTMLInputElement | null;

async function updateUI(): Promise<void> {
    if (!resultsContainer) return;

    if (!state.searchQuery) {
        resultsContainer.innerHTML = "";
        return;
    }

    // Assuming fetchSuggestions returns an array of HTML strings based on your original code
    const data: string[] = await fetchSuggestions(state.searchQuery, state.exclude, state.types);
    resultsContainer.innerHTML = data.join("");
}

const handleSearch = debounce((event: Event): void => {
    const target = event.target as HTMLInputElement;
    state.searchQuery = target.value;
    updateUI();
}, 300);

const handleSelectType = (event: Event): void => {
    const target = event.target as HTMLSelectElement;
    const value = target.value;

    switch (value) {
        case "both":
            state.types = ["item", "material"];
            break;
        case "items":
            state.types = ["item"];
            break;
        case "materials":
            state.types = ["material"];
            break;
    }
    updateUI();
};

// Initialize Event Listeners
searchInput?.addEventListener("input", handleSearch);
typeSelect?.addEventListener("change", handleSelectType);

document.querySelectorAll<HTMLInputElement>(".exclude-check").forEach((checkbox) => {
    // Initial state sync
    if (checkbox.checked) state.exclude.add(checkbox.value);

    checkbox.addEventListener("change", (e: Event) => {
        const target = e.target as HTMLInputElement;
        if (target.checked) {
            state.exclude.add(target.value);
        } else {
            state.exclude.delete(target.value);
        }
        updateUI();
    });
});