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
        <div class="d-flex flex-row mb-3">
            <div class="col-md-4">
                <div class="card-body">
                    <img src="${item.icon}" width="48" height="48" alt="${item.name}">
                    <h5 class="card-title">${item.name}</h5>
                    <p><i>${item.category}</i></p>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card-body">
                    <p><b>Value: </b>${item.value}</p>
                    <p><b>Rarity: </b>${item.rarity}</p>
                    <p><b>Capacity: </b>${item.capacity}</p>
                    <p><b>How to Get: </b>${item.how_to_get}</p>
                </div>
            </div>
        </div>
    `;
}

/**
 * Generates HTML for a Material card.
 * @param {Material} material - The material data to render.
 * @returns {string} The HTML template string.
 */
export function materialCard(material) {
    return `
        <div class="d-flex flex-row mb-3">
            <div class="col-md-4">
                <div class="card-body">
                    <img src="${material.icon}" width="48" height="48" alt="${material.name}">
                    <h5 class="card-title">${material.name}</h5>
                    <p><i>${material.monster}</i></p>
                </div>
            </div>
            <div class="col-md-8">
                <div class="card-body">
                    <p><b>Value: </b>${material.value}</p>
                    <p><b>Rarity: </b>${material.rarity}</p>
                </div>
            </div>
        </div>
    `;
}