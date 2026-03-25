import { queryDB } from './dbutils';
import { itemCard, materialCard, skillCard, Item, Material } from './templates';

async function fetchItems(query: string, excludeSet: Set<string>): Promise<string[]> {
    const excludeArray = Array.from(excludeSet);
    const placeholders = excludeArray.map(() => '?').join(', ');

    try {
        const sql = `
            SELECT
                items.*,
                combinations.first_ingredient AS first_ingredient,
                combinations.second_ingredient AS second_ingredient,
                list(DISTINCT {'map': yields.map, 'rank': yields.rank, 'area': yields.area}) 
                FILTER (WHERE yields.map IS NOT NULL) as yields_struct
            FROM items
            LEFT JOIN combinations ON items.name = combinations.result
            LEFT JOIN yields ON items.name = yields.name
            WHERE regexp_replace(lower(items.name), '[^a-z0-9]', '', 'g') 
            LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
            ${excludeArray.length > 0 ? `AND category NOT IN (${placeholders})` : ''}
            GROUP BY ALL
        `;

        // Use the Item interface to type the database result
        const results = await queryDB<Item>(sql, [query, ...excludeArray]);
        return results.map(itemCard);
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

async function fetchMaterials(query: string): Promise<string[]> {
    try {
        const sql = `
            SELECT *
            FROM materials
            WHERE regexp_replace(lower(name), '[^a-z0-9]', '', 'g')
            LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
        `;

        // Use the Material interface to type the database result
        const results = await queryDB<Material>(sql, [query]);
        return results.map(materialCard);
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}

/**
 * Fetches suggestions based on query, exclusion list, and selected types.
 */
export async function fetchSuggestions(
    query: string,
    excludeSet: Set<string>,
    typesSet: string[]
): Promise<string[]> {
    const results: string[] = [];

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


export async function fetchSkills(query: string): Promise<string[]> {
    try {
        const sql = `
            SELECT *
            FROM skills
            WHERE regexp_replace(lower(ability), '[^a-z0-9]', '', 'g')
            LIKE '%' || regexp_replace(lower(?), '[^a-z0-9]', '', 'g') || '%'
        `;
        const results = await queryDB(sql, [query]);
        return results.map(skillCard);
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}