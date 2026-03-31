<script lang="ts">
    import { db } from "$lib/db/dbStore";
    import { type GameItem } from "$lib/types";

    import ItemCard from "./ItemCard.svelte";

    let debounceTimer: ReturnType<typeof setTimeout>;

    let searchText = $state("");
    let categories = $state(["items", "materials"]);
    let results: GameItem[] = $state([]);

    async function populateResults(): Promise<void> {
        // 1. Fetch data concurrently to avoid sequential blocking
        if (!$db) {
            console.warn("Database is still initializing...");
            return;
        }

        const [items, materials] = await Promise.all([
            $db.getItems(searchText),
            $db.getMaterials(searchText),
        ]);

        // 2. Build the array functionally using filtering and spreading
        const newResults = [
            ...(categories.includes("items") ? items : []),
            ...(categories.includes("materials") ? materials : []),
        ];

        // 3. Single state update to prevent intermediate render cycles or inconsistent states
        results = newResults;
    }

    function handleInput() {
        clearTimeout(debounceTimer);
        debounceTimer = setTimeout(() => {
            populateResults();
        }, 300); // Adjust delay as needed
    }
</script>

<form>
    <div class="mb-3">
        <input
            class="form-control"
            id="item-search"
            type="text"
            list="item-suggestions"
            bind:value={searchText}
            oninput={handleInput}
        />
    </div>
    <div class="mb-3">
        <div
            class="btn-group"
            id="type-select"
            role="group"
            aria-label="Basic radio toggle button group"
        >
            <input
                type="radio"
                class="btn-check"
                name="btnradio"
                id="items-radio"
                onchange={() => (categories = ["items"])}
            />
            <label class="btn btn-outline-primary" for="items-radio"
                >Items</label
            >

            <input
                type="radio"
                class="btn-check"
                name="btnradio"
                id="materials-radio"
                onchange={() => (categories = ["materials"])}
            />
            <label class="btn btn-outline-primary" for="materials-radio"
                >Materials</label
            >

            <input
                type="radio"
                class="btn-check"
                name="btnradio"
                id="both-radio"
                onchange={() => (categories = ["items", "materials"])}
                checked
            />
            <label class="btn btn-outline-primary" for="both-radio">All</label>
        </div>
    </div>
    <div class="mb-3">
        <div class="form-check">
            <input
                class="form-check-input exclude-check"
                type="checkbox"
                value="Supply Items"
                id="exclude-supply-check"
                checked
            />
            <label class="form-check-label" for="exclude-supply-check">
                Exclude Supply Items
            </label>
        </div>
        <div class="form-check">
            <input
                class="form-check-input exclude-check"
                type="checkbox"
                value="Event Rewards"
                id="exclude-event-check"
                checked
            />
            <label class="form-check-label" for="exclude-event-check">
                Exclude Event Rewards
            </label>
        </div>
    </div>
</form>
<div class="my-1 border-bottom border-secondary opacity-25"></div>
<div id="item-results">
    {#each results as result}
        <ItemCard item={result} />
    {/each}
</div>
