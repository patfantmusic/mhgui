<script lang="ts">
    import { type GameItem, isCraftable, isGatherable } from "../../types";

    let { item: item }: { item: GameItem } = $props();

    const rarityColorMap: Record<string | number, string> = {
        1: "#FFFFFF", // White
        2: "#60A5FA", // Bright Blue (Adjusted for contrast)
        3: "#FACC15", // Vivid Yellow
        4: "#F472B6", // Soft Pink
        5: "#4ADE80", // Vibrant Green
        6: "#818CF8", // Indigo/Light Blue (Replacing Dark Blue for visibility)
        7: "#EF4444", // Bright Red
        8: "#22D3EE", // Cyan
        9: "#FB923C", // Bright Orange
        10: "#E879F9", // Prism Purple/Magenta
        X: "#FF0000", // Deviant Red
    };

    const rankColors: Record<string, string> = {
        l: "text-success",
        h: "text-warning",
        g: "text-danger",
    };
</script>

<div class="card custom-card-dark d-flex flex-row align-items-center mt-3">
    <div class="col-md-4">
        <div class="card-body">
            <img src={item.icon} width="48" height="48" alt={item.name} />
            <h5 class="card-title mt-2 text-warning">{item.name}</h5>
            <p class="text-muted"><i>{item.category}</i></p>
        </div>
    </div>

    <div class="col-md-4 border-start border-secondary">
        <div class="card-body d-flex flex-column justify-content-center h-100">
            <div class="mb-1">
                <h6 class="d-inline small text-warning">Value:</h6>
                <span>{item.value}z</span>
            </div>
            <div class="mb-1">
                <h6 class="d-inline small text-warning">Rarity:</h6>
                <span
                    class="fw-bold"
                    style="color: {rarityColorMap[item.rarity]}"
                >
                    {item.rarity}
                </span>
            </div>
            <div class="mb-1">
                <h6 class="d-inline small text-warning">Capacity:</h6>
                <span>{item.capacity}</span>
            </div>
            {#if isCraftable(item)}
                <div>
                    <h6 class="d-inline small text-warning">Ingredients:</h6>
                    <span
                        >{item.first_ingredient} + {item.second_ingredient}</span
                    >
                </div>
            {/if}
        </div>
    </div>

    <div class="col-md-4 border-start border-secondary">
        <div class="card-body">
            {#if isGatherable(item)}
                <h6 class="text-uppercase small text-warning fw-bold">
                    Gathering Locations
                </h6>
                <div class="gathering-container px-1">
                    {#each Object.entries(item.yields_json) as [map, areas]}
                        <div class="mb-2 d-flex flex-row align-items-center">
                            <div
                                class="text-uppercase fw-bold text-body-secondary"
                                style="font-size: 0.65rem; letter-spacing: 0.05rem;"
                            >
                                {map}
                            </div>
                            {#each Object.entries(areas) as [areaNum, ranks]}
                                <div
                                    class="badge border border-secondary-subtle bg-body-tertiary text-body fw-normal me-1 mb-1 p-1 d-inline-flex align-items-center"
                                    style="font-size: 0.65rem;"
                                >
                                    <span
                                        class="fw-bold border-end border-secondary-subtle pe-1 me-1"
                                        >{areaNum}</span
                                    >
                                    <span
                                        class="font-monospace"
                                        style="letter-spacing: 1px;"
                                    >
                                    </span>
                                    {#each ranks as char}
                                        <span class={rankColors[char]}
                                            >{char}</span
                                        >
                                    {/each}
                                </div>
                            {/each}
                        </div>
                    {/each}
                </div>
            {:else}
                <h6 class="text-uppercase small text-warning fw-bold">
                    How to Get
                </h6>
                <p>{item.how_to_get}</p>
            {/if}
        </div>
    </div>
</div>
