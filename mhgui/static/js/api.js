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
    const excludeParam = Array.from(excludeSet).join(",");
    const typesParam = Array.from(typesSet).join(",");

    try {
        const response = await fetch(`/suggestions/${encodeURIComponent(query)}?exclude=${encodeURIComponent(excludeParam)}&types=${encodeURIComponent(typesParam)}`);

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}