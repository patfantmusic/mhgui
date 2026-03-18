/**
 * @typedef {import('./main.js').Suggestion} Suggestion
 */

/**
 * Fetches item suggestions from the server based on a query and exclusion list.
 * * @param {string} query - The search term entered by the user.
 * @param {Set<string>} excludeSet - A set of item values to exclude from results.
 * @returns {Promise<Suggestion[]>} A promise that resolves to an array of Suggestion objects.
 */
export async function fetchSuggestions(query, excludeSet) {
    const excludeParam = Array.from(excludeSet).join(",");

    try {
        const response = await fetch(`/suggestions/${encodeURIComponent(query)}?exclude=${encodeURIComponent(excludeParam)}`);

        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }

        return await response.json();
    } catch (error) {
        console.error("Fetch error:", error);
        return [];
    }
}