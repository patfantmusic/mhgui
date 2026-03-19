import { queryDB } from './dbutils.js';


async function fetchItems(query, excludeSet) {
    const excludeArray = Array.from(excludeSet);
    const placeholders = excludeArray.map(() => '?');
    try {
        const sql = `
            SELECT * FROM items
            WHERE regexp_replace(lower(name), '[^a-z0-9]', '', 'g') LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
            AND category NOT IN (${placeholders.join(', ')})
        `;
        const results = await queryDB(sql, [query, ...excludeArray]);
        return results;
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

async function fetchMaterials(query) {
    try {
        const sql = `
            SELECT * FROM materials
            WHERE regexp_replace(lower(name), '[^a-z0-9]', '', 'g') LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
        `
        const results = await queryDB(sql, [`%${query}%`]);
        return results;
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

/**
 * @typedef {import('./main.js').Suggestion} Suggestion
 */

/**
 * Fetches item suggestions from the server based on a query and exclusion list.
 * * @param {string} query - The search term entered by the user.
 * @param {Set<string>} excludeSet - A set of item values to exclude from results.
 * @param {Array<string>} typesSet - A set of types to include in results.
 * @returns {Promise<Suggestion[]>} A promise that resolves to an array of Suggestion objects.
 */
export async function fetchSuggestions(query, excludeSet, typesSet) {
    var results = [];

    if (typesSet.includes("item")) {
        const items = await fetchItems(query, excludeSet);
        results.push(...items);
    }

    if (typesSet.includes("material")) {
        const materials = await fetchMaterials(query);
        results.push(...materials);
    }
    return results;
}