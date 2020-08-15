
document.addEventListener('keydown', event => {
    if (event.ctrlKey && event.key === 'l') {
        const overlayDiv = createOverlayDiv();
        const searchDiv = createSearchDiv();
        const resultsDiv = createSearchResultsList();

        overlayDiv.appendChild(resultsDiv);
        overlayDiv.appendChild(searchDiv);
        document.body.appendChild(overlayDiv);

        getSearchInputElement().focus();

        // now the magic
        const searchInput = getSearchInputElement();
        searchInput.addEventListener('keyup', async function(event) {
            const query = searchInput.value;
            const searchResults = searchBookmarks(query);
            // refine results
            if (typeof searchResults != 'undefined') {
                const refinedResults = refineResults(searchResults, query);
                updateSearchText(refinedResults);
                updateLinkEventListeners();
            }
            if (event.key === "Enter") {
                // go to first event in the list
                const top_result = refinedResults[0];
                window.open(top_result.url)
            }
        });
    }
});

function getSearchInputElement() {
    return document.getElementById("searchInput");
}

function getSearchResultsElement() {
    return document.getElementById("searchResults");
}

function createOverlayDiv () {
    const overlayDiv = document.createElement('div');
    overlayDiv.style = "position: fixed; left: 0; top: 0; width: 100%; height: 100%; opacity: 50%; background-color: gray;";
    overlayDiv.id = "evans-div"
    return overlayDiv
}

function createSearchDiv() {
    const searchDiv = document.createElement('input');
    searchDiv.id = "searchInput";
    searchDiv.style = "margin:auto; position: absolute; top: 50%; left: 50%; margin-right: -50%; transform: translate(-50%, -%50);"
    searchDiv.class = "";
    searchDiv.autocomplete = "off";
    return searchDiv
}

function createSearchResultsList() {
    const ul = document.createElement('ul');
    ul.id = "searchResults";
    return ul
}

function refineResults(searchResults, query) {
    return searchResults.filter(result => {
      // cuts bookmark Title down to a substring for closer matching
      const queryLen = query.length;
      const queryLower = query.toLowerCase();
      const bookmarkTitle = result.title.substring(0, queryLen).toLowerCase();
      return bookmarkTitle.includes(queryLower) & result.hasOwnProperty('url');
    });
  }
  
  
function updateLinkEventListeners() {
    const links = document.querySelectorAll(".link");
    if (links.length) {
        links.forEach(link => {
        link.addEventListener('click', event => {
            const ctrlPressed = (event.ctrlKey || event.metaKey);
            const url = event.target.href;
            chrome.tabs.create({'url': url, active: !ctrlPressed});
        }, false); 
    });
}
}

function updateSearchText(results) {
    const resultsDiv = getSearchResultsElement();
    // wipes the unordered list
    resultsDiv.innerHTML = '';
    results.forEach(result => {
        resultsDiv.appendChild(
            createListItem(result)
        );
    });
}

function createListItem(result) {
    const listElement = document.createElement('li');
    const listURL = document.createElement('a');
    listURL.class = "link";

    if (result.title.length > 27) {
        listURL.innerHTML = result.title.substring(0, 27) + '...';
    }
    else {
        listURL.innerHTML = result.title;
    }
    listURL.href = result.url;
    listElement.appendChild(listURL);
    return listElement
}

function focusInput() {
    getSearchInputElement().focus();
}

function searchBookmarks(query) {
    if (query.length > 3) {
        chrome.runtime.sendMessage({queryBody: query}, function(response) {
            console.log(response);
        });
    }
}
