/**
 * @typedef {Object} Item
 * @property {string} icon - URL to the item icon
 * @property {string} name - Item display name
 * @property {string} category - Item category
 * @property {number|string} value - Monetary or point value
 * @property {string} rarity - Item rarity level
 * @property {number|string} capacity - Item storage capacity
 * @property {string} how_to_get - Instructions on obtaining the item
 */

/**
 * @typedef {Object} Material
 * @property {string} icon - URL to the material icon
 * @property {string} name - Material name
 * @property {string} monster - The monster this material drops from
 * @property {number|string} value - Monetary or point value
 * @property {string} rarity - Material rarity level
 */

/**
 * Generates HTML for an Item card.
 * @param {Item} item - The item data to render.
 * @returns {string} The HTML template string.
 */
export function itemCard(item) {
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
                    <span>${item.value}</span>
                </div>
                <div class="mb-1">
                    <h6 class="d-inline small text-warning">Rarity: </h6>
                    <span>${item.rarity}</span>
                </div>
                <div>
                    <h6 class="d-inline small text-warning">Capacity: </h6>
                    <span>${item.capacity}</span>
                </div>
            </div>
        </div>
        <div class="col-md-4 border-start border-secondary">
            <div class="card-body">
                <h6 class="text-uppercase small text-warning fw-bold">How to Acquire</h6>
                <p class="small mb-0">${item.how_to_get}</p>
            </div>
        </div>
    </div>
`
}

/**
 * Generates HTML for a Material card.
 * @param {Material} material - The material data to render.
 * @returns {string} The HTML template string.
 */
export function materialCard(material) {
    return `
    <div class="card custom-card-dark d-flex flex-row align-items-center mt-3">
        <div class="col-md-4">
            <div class="card-body">
                <img src="${material.icon}" width="48" height="48" alt="${material.name}">
                <h5 class="card-title text-warning mt-2">${material.name}</h5>
                <p class="text-muted"><i>${material.monster}</i></p>
            </div>
        </div>
        <div class="col-md-4 border-start border-secondary">
            <div class="card-body d-flex flex-column justify-content-center h-100">
                <div class="mb-2">
                    <h6 class="d-inline small text-warning">Value: </h6>
                    <span>${material.value}</span>
                </div>
                <div>
                    <h6 class="d-inline small text-warning">Rarity: </h6>
                    <span>${material.rarity}</span>
                </div>
            </div>
        </div>
        <div class="col-md-4 border-start border-secondary">
            <div class="card-body">
                <h6 class="text-uppercase small text-warning fw-bold">How to Acquire</h6>
                <p class="small mb-0">Hunt ${material.monster}.</p>
            </div>
        </div>
    </div>
`;
}