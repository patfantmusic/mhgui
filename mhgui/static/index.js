(function () {

    document.getElementById("item-search").addEventListener("input", (event) => {
        const query = event.target.value;
        const suggestionsList = document.getElementById("item-results");
        var result = "";
        fetch(`/suggestions/${query}`)
            .then((response) => response.json())
            .then((data) => {
                data.forEach((suggestion, i) => {
                    result += `
                        <div class="accordion-item">
                            <h2 class="accordion-header" id="item-suggestion-${i}">
                                <button class="accordion-button" type="button" data-bs-toggle="collapse"
                                    data-bs-target="#item-suggestion-${i}-collapse" aria-expanded="false" aria-controls="item-suggestion-${i}-collapse">
                                    ${suggestion.name}
                                </button>
                            </h2>
                            <div id="item-suggestion-${i}-collapse" class="accordion-collapse collapse" aria-labelledby="item-suggestion-${i}" data-bs-parent="item-results">
                                <div class="accordion-body" id="item-details-${i}">
                                    <p><b>Category: </b>${suggestion.category}</p>
                                    <p><b>Value: </b>${suggestion.value}</p>
                                    <p><b>Rarity: </b>${suggestion.rarity}</p>
                                    <p><b>Capacity: </b>${suggestion.capacity}</p>
                                    <p><b>How to Get: </b>${suggestion.how_to_get}</p>
                                </div>
                            </div>
                        </div>`;
                });
                suggestionsList.innerHTML = result;
            });
    });

})();