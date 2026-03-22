export interface Item {
    icon: string;
    name: string;
    category: string;
    value: number | string;
    rarity: string;
    capacity: number | string;
    how_to_get: string;
}

export interface CraftableItem extends Item {
    first_ingredient: string;
    second_ingredient: string;
}

export interface GatherableItem extends Item {
    yields_struct: YieldData[];
}

function isCraftable(item: Item | CraftableItem): item is CraftableItem {
    return 'first_ingredient' in item && item.first_ingredient !== null;
}

function isGatherable(item: Item | GatherableItem): item is GatherableItem {
    return 'yields_struct' in item && item.yields_struct !== null;
}

export interface YieldData {
    rank: string;
    map: string;
    area: string;
}

export interface Material {
    icon: string;
    name: string;
    monster_name: string;
    value: number | string;
    rarity: string;
}

// Optimized for WCAG contrast on dark backgrounds (#212529)
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
    "X": "#FF0000" // Deviant Red
};

/**
 * Helper to get rarity color with a default fallback
 */
const getRarityColor = (rarity: string | number): string => {
    return rarityColorMap[rarity] || "#ADB5BD"; // Default to Bootstrap secondary grey
};


function gatheringInfo(yields: YieldData[]): string {
    const mapGroups: Record<string, Record<string, Set<string>>> = {};

    yields.forEach(({ map, area, rank }) => {
        if (!map || !area) return;
        if (!mapGroups[map]) mapGroups[map] = {};
        if (!mapGroups[map][area]) mapGroups[map][area] = new Set();

        const rankChar = rank ? rank[0].toUpperCase() : '';
        if (rankChar) mapGroups[map][area].add(rankChar);
    });

    const mapHtml = Object.entries(mapGroups).map(([mapName, areas]) => {
        const areaPills = Object.entries(areas).map(([areaNum, ranks]) => {
            const sortedRanks = Array.from(ranks).sort((a, b) =>
                "LHG".indexOf(a) - "LHG".indexOf(b)
            );

            // Create colored spans for each rank letter
            const coloredRanks = sortedRanks.map(r => {
                const colorClass = { 'L': 'text-success', 'H': 'text-warning', 'G': 'text-danger' }[r];
                return `<span class="${colorClass} fw-bold">${r}</span>`;
            }).join("");

            return `
                <div class="badge border border-secondary-subtle bg-body-tertiary text-body fw-normal me-1 mb-1 p-1 d-inline-flex align-items-center" style="font-size: 0.65rem;">
                    <span class="fw-bold border-end border-secondary-subtle pe-1 me-1">${areaNum}</span>
                    <span class="font-monospace" style="letter-spacing: 1px;">${coloredRanks}</span>
                </div>`;
        }).join("");

        return `
            <div class="mb-2 d-flex flex-row align-items-center">
                <div class="text-uppercase fw-bold text-body-secondary" style="font-size: 0.65rem; letter-spacing: 0.05rem;">${mapName}</div>
                <div class="d-flex flex-wrap mx-2">${areaPills}</div>
            </div>`;
    }).join("");

    return `<div class="gathering-container px-1">${mapHtml}</div>`;
}


export function acquireSection(item: Item | CraftableItem): string {
    if (isGatherable(item)) {
        const gathering_yields = Array.from(item.yields_struct);
        return `
            <div class="col-md-4 border-start border-secondary">
                <div class="card-body">
                    <h6 class="text-uppercase small text-warning fw-bold">Gathering Locations</h6>
                    <p class="small mb-0">${gatheringInfo(gathering_yields)}</p>
                </div>
            </div>
        `;
    }
    return `
        <div class="col-md-4 border-start border-secondary">
            <div class="card-body">
                <h6 class="text-uppercase small text-warning fw-bold">How to Acquire</h6>
                <p class="small mb-0">${item.how_to_get}</p>
            </div>
        </div>
    `;
}


/**
 * Generates HTML for an Item card.
 */
export function itemCard(item: Item): string {
    return `
    <div class="card custom-card-dark d-flex flex-row align-items-center mt-3">
        <div class="col-md-4">
            <div class="card-body">
                <img src="${item.icon}" width="48" height="48" alt="${item.name}">
                <h5 class="card-title mt-2 text-warning">${item.name}</h5>
                <p class="text-muted"><i>${item.category}</i></p>
            </div>
        </div>

        <div class="col-md-4 border-start border-secondary">
            <div class="card-body d-flex flex-column justify-content-center h-100">
                <div class="mb-1">
                    <h6 class="d-inline small text-warning">Value: </h6>
                    <span>${item.value}z</span>
                </div>
                <div class="mb-1">
                    <h6 class="d-inline small text-warning">Rarity: </h6>
                    <span 
                        class="fw-bold" 
                        style="color: ${getRarityColor(item.rarity)}">
                        ${item.rarity}
                    </span>
                </div>
                <div class="mb-1">
                    <h6 class="d-inline small text-warning">Capacity: </h6>
                    <span>${item.capacity}</span>
                </div>
                ${isCraftable(item) ? `
                    <div>
                        <h6 class="d-inline small text-warning">Ingredients: </h6>
                        <span>${item.first_ingredient} + ${item.second_ingredient}</span>
                    </div>
                ` : ''}
            </div>
        </div>
        ${acquireSection(item)}
    </div>
`;
}

/**
 * Generates HTML for a Material card.
 */
export function materialCard(material: Material): string {
    return `
    <div class="card custom-card-dark d-flex flex-row align-items-center mt-3">
        <div class="col-md-4">
            <div class="card-body">
                <img src="${material.icon}" width="48" height="48" alt="${material.name}">
                <h5 class="card-title text-warning mt-2">${material.name}</h5>
                <p class="text-muted"><i>${material.monster_name}</i></p>
            </div>
        </div>
        <div class="col-md-4 border-start border-secondary">
            <div class="card-body d-flex flex-column justify-content-center h-100">
                <div class="mb-2">
                    <h6 class="d-inline small text-warning">Value: </h6>
                    <span>${material.value}z</span>
                </div>
                <div class="mb-1">
                    <h6 class="d-inline small text-warning">Rarity: </h6>
                    <span 
                        class="fw-bold" 
                        style="color: ${getRarityColor(material.rarity)}">
                        ${material.rarity}
                    </span>
                </div>
            </div>
        </div>
        <div class="col-md-4 border-start border-secondary">
            <div class="card-body">
                <h6 class="text-uppercase small text-warning fw-bold">How to Acquire</h6>
                <p class="small mb-0">Hunt ${material.monster_name}.</p>
            </div>
        </div>
    </div>
`;
}