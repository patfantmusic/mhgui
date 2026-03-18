(function () {

    var exclude = new Set();
    document.querySelectorAll(".exclude-check").forEach((element) => {
        exclude.add(element.value);
    });

    function debounce(func, delay) {
        let timeoutId;

        return function (...args) {
            // Clear the previous timer if the user types again
            clearTimeout(timeoutId);

            // Start a new timer
            timeoutId = setTimeout(() => {
                func.apply(this, args);
            }, delay);
        };
    }

    function item_card(suggestion) {
        return `
            <div class="d-flex flex-row mb-3">
                <div class="col-md-4">
                    <div class="card-body">
                        <img src="${suggestion.icon}" width=48 height=48>
                        <h5 class="card-title">${suggestion.name}</h5>
                        <p><i>${suggestion.category}</i></p>
                    </div>
                </div>
                <div class="col-md-8">
                    <div class="card-body">
                        <p><b>Value: </b>${suggestion.value}</p>
                        <p><b>Rarity: </b>${suggestion.rarity}</p>
                        <p><b>Capacity: </b>${suggestion.capacity}</p>
                        <p><b>How to Get: </b>${suggestion.how_to_get}</p>
                    </div>
                </div>
            </div>
        `;
    }

    async function handleSearch(event) {
        const query = event.target.value;
        const suggestionsList = document.getElementById("item-results");
        var result = "";
        const response = await fetch(`/suggestions/${query}?exclude=${Array.from(exclude).join(",")}`);
        const data = await response.json();
        data.forEach((suggestion, i) => {
            result += item_card(suggestion);
        });
        suggestionsList.innerHTML = result;
    }

    const debouncedSearch = debounce(handleSearch, 300);
    document.getElementById("item-search").addEventListener("input", debouncedSearch);

    document.querySelectorAll(".exclude-check").forEach((element) => {
        element.addEventListener("change", function (event) {
            if (event.target.checked) {
                exclude.add(event.target.value);
                console.log(exclude);
            } else {
                exclude.delete(event.target.value);
                console.log(exclude);
            }
        })
    });
})();