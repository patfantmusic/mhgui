import { debounce } from './utils';
import { fetchSuggestions, fetchSkills } from './api';
import { loadAppData } from './dbutils';

loadAppData();

abstract class ViewBase {
    protected state: object;
    protected url: string;


    constructor() {
        this.addListeners();
    }

    async render(): Promise<void> {
        const mainWrapper: HTMLElement | null = document.querySelector('.main-wrapper');
        if (!mainWrapper) return;

        try {
            // Fetch content from Flask
            console.log(`Fetching ${this.url}`);
            const response = await fetch(this.url, {
                headers: { 'X-Requested-With': 'XMLHttpRequest' }
            });

            if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);

            const html: string = await response.text();

            // Inject the new content
            mainWrapper.innerHTML = html;

            // Update the browser URL without refreshing
            window.history.pushState({ path: this.url }, '', this.url);
        } catch (error) {
            console.error('Fetch error:', error);
            // Optional: Fallback to a standard redirect if fetch fails
            window.location.href = this.url;
        }
        this.addListeners();
    }

    abstract update(): Promise<void>;
    abstract addListeners(): void;
}

class ItemsView extends ViewBase {
    protected url = "/items";
    protected state = {
        exclude: new Set<string>(),
        searchText: "",
        types: ["item", "material"],
    };

    async update(): Promise<void> {
        console.log("Updating items view");
        const resultsContainer = document.getElementById("item-results") as HTMLElement | null;
        if (!resultsContainer) return;

        if (!this.state.searchText) {
            resultsContainer.innerHTML = "";
            return;
        }

        const data: string[] = await fetchSuggestions(this.state.searchText, this.state.exclude, this.state.types);
        resultsContainer.innerHTML = data.join("");
    }

    addListeners(): void {
        console.log("Adding listeners to items view");

        const handleSearch = debounce((event: Event): void => {
            const target = event.target as HTMLInputElement;
            this.state.searchText = target.value;
            this.update();
        }, 300);

        document.querySelectorAll<HTMLInputElement>(".exclude-check").forEach((checkbox) => {
            // Initial state sync
            if (checkbox.checked) this.state.exclude.add(checkbox.value);

            checkbox.addEventListener("change", (e: Event) => {
                const target = e.target as HTMLInputElement;
                if (target.checked) {
                    this.state.exclude.add(target.value);
                } else {
                    this.state.exclude.delete(target.value);
                }
                this.update();
            });
        });

        const typeSelect = document.getElementById("type-select") as HTMLElement | null;
        const itemSearchInput = document.getElementById("item-search") as HTMLInputElement | null;
        itemSearchInput?.addEventListener("input", handleSearch);
        typeSelect?.addEventListener("change", this.handleSelectType);
    }

    handleSelectType(event: Event): void {
        const target = event.target as HTMLSelectElement;
        const value = target.value;

        switch (value) {
            case "both":
                this.state.types = ["item", "material"];
                break;
            case "items":
                this.state.types = ["item"];
                break;
            case "materials":
                this.state.types = ["material"];
                break;
        }
        this.update();
    }
}


class SkillsView extends ViewBase {
    protected url = "/skills";
    protected state = {
        searchText: "",
    };


    async update(): Promise<void> {
        console.log("Updating skills view");
        const resultsContainer = document.getElementById("skill-results") as HTMLElement | null;
        if (!resultsContainer) return;

        if (!this.state.searchText) {
            resultsContainer.innerHTML = "";
            return;
        }

        const data: string[] = await fetchSkills(this.state.searchText);
        resultsContainer.innerHTML = data.join("");
    }

    addListeners(): void {
        console.log("Adding listeners to skills view");

        const handleSearch = debounce((event: Event): void => {
            const target = event.target as HTMLInputElement;
            this.state.searchText = target.value;
            this.update();
        }, 300);

        const skillSearchInput = document.getElementById("skill-search") as HTMLInputElement | null;
        skillSearchInput?.addEventListener("input", handleSearch);
    }
}


// Define the container where content will be injected
const mainWrapper: HTMLElement | null = document.querySelector('.main-wrapper');

// Select all navigation links
const navLinks: NodeListOf<HTMLAnchorElement> = document.querySelectorAll('.nav-link');

async function handleNavClick(event: Event): Promise<void> {
    event.preventDefault();

    const target = event.currentTarget as HTMLAnchorElement;
    const url: string | null = target.getAttribute('href');

    var view: ViewBase | null = null;
    switch (target.id) {
        case "items-view":
            view = new ItemsView();
            break;
        case "skills-view":
            view = new SkillsView();
            break;
        default:
            break;
    }

    if (!view) return;

    view.render();
    view.addListeners();
    view.update();
}

navLinks.forEach((link: HTMLAnchorElement) => {
    link.addEventListener('click', handleNavClick);
});

// Handle browser Back/Forward buttons
window.addEventListener('popstate', async (): Promise<void> => {
    const currentUrl = window.location.pathname;
    if (mainWrapper) {
        const response = await fetch(currentUrl, {
            headers: { 'X-Requested-With': 'XMLHttpRequest' }
        });
        const html = await response.text();
        mainWrapper.innerHTML = html;
    }
});